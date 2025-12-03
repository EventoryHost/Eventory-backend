/**
 * Migration Script: DJ Artists Collection
 * 
 * Migrates ALL DJ artist data from old structure to new structure
 * Reads from 'dev' database and writes to 'prod' database in destination
 * 
 * Usage:
 *   node scripts/migrate-dj-artists.js
 * 
 * Environment Variables:
 *   MONGO_URI_SOURCE - Source MongoDB connection string (where old data is)
 *   MONGO_URI_DEST - Destination MongoDB connection string (where new data will be)
 *   LIMIT - Number of documents to migrate (defaults to null = migrate all)
 *   DRY_RUN - Set to 'true' for dry run mode (defaults to false)
 */

import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// MongoDB connection strings
// Source database (where old data is) - using 'dev' database (where actual data is)
const MONGO_URI_SOURCE = process.env.MONGO_URI_SOURCE || 
  'mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev?retryWrites=true&w=majority&appName=eventory-prod';

// Destination database (where new data will be migrated to) - using 'prod' database
const MONGO_URI_DEST = process.env.MONGO_URI_DEST || 
  'mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod?retryWrites=true&w=majority';

// Set LIMIT to null or very high number to migrate all documents
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : null; // null = migrate all
const DRY_RUN = process.env.DRY_RUN === 'true';

/**
 * Convert date to IST (UTC+5:30)
 */
function toIST(date) {
  if (!date) {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
  }
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
}

/**
 * Convert number to string (for lat/lon in new schema)
 */
function toString(value) {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

/**
 * Parse team size from string format (e.g., "6-15", "1-5", "16+") to number
 * Returns the maximum value or middle value if range
 */
function parseTeamSize(teamSizeStr) {
  if (!teamSizeStr) return 1;
  
  const str = String(teamSizeStr).trim();
  
  if (str.includes('-')) {
    const parts = str.split('-');
    const max = parseInt(parts[1]);
    return isNaN(max) ? 1 : max;
  }
  
  if (str.includes('+')) {
    const num = parseInt(str.replace('+', ''));
    return isNaN(num) ? 1 : num;
  }
  
  const num = parseInt(str);
  return isNaN(num) ? 1 : num;
}

/**
 * Parse years of operation from string format (e.g., "12+", "5-10", "3")
 * Returns the maximum value or the number itself
 */
function parseYearsOfOperation(yearsStr) {
  if (!yearsStr) return 0;
  
  const str = String(yearsStr).trim();
  
  if (str.includes('+')) {
    const num = parseInt(str.replace('+', ''));
    return isNaN(num) ? 0 : num;
  }
  
  if (str.includes('-')) {
    const parts = str.split('-');
    const max = parseInt(parts[1]);
    return isNaN(max) ? 0 : max;
  }
  
  const num = parseInt(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert category string to number
 * Maps: "caterer" -> 1, "venue" -> 2, "photographer" -> 3, "decorator" -> 4, "makeupartist" -> 5, "djartist" -> 6
 */
function mapCategoryToNumber(categoryStr) {
  if (!categoryStr) return 6; // Default to DJ artist
  
  const categoryMap = {
    'caterer': 1,
    'venue': 2,
    'photographer': 3,
    'decorator': 4,
    'makeupartist': 5,
    'makeup-artist': 5,
    'djartist': 6,
    'dj-artist': 6
  };
  
  const lower = String(categoryStr).toLowerCase();
  return categoryMap[lower] || 6; // Default to DJ artist
}

/**
 * Create business_details structure from vendor data
 */
function createBusinessDetails(djArtist, vendorData, serviceId) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const vendorBusiness = vendorData?.businessDetails || {};
  
  return {
    service_id: serviceId,
    service_type: 'DJ-Artist',
    category: mapCategoryToNumber(vendorBusiness.category || 'djartist'),
    business_registration_name: vendorBusiness.businessName || djArtist.basicDetails?.name || 'Unknown Business',
    gst: vendorBusiness.gstin || null,
    pan: vendorBusiness.panNo || null,
    verification_type: (() => {
      if (vendorBusiness.verificationType && vendorBusiness.verificationType !== '' && vendorBusiness.verificationType !== null) {
        return vendorBusiness.verificationType.toUpperCase();
      }
      if (vendorBusiness.panNo && vendorBusiness.panNo !== '') {
        return 'PAN';
      }
      if (vendorBusiness.gstin && vendorBusiness.gstin !== '') {
        return 'GSTIN';
      }
      return 'PAN';
    })(),
    team_size: parseTeamSize(vendorBusiness.teamsize),
    years_of_operation: parseYearsOfOperation(vendorBusiness.years),
    business_address: vendorBusiness.businessAddress || djArtist.basicDetails?.address || '',
    landmark: vendorBusiness.landmark || '',
    pincode: vendorBusiness.pinCode || djArtist.basicDetails?.location?.pincode || 0,
    operational_cities: vendorBusiness.cities && vendorBusiness.cities.length > 0 
      ? vendorBusiness.cities 
      : (djArtist.basicDetails?.serviceAreas || []),
    annual_revenue: vendorBusiness.annualrevenue || null,
    annual_bookings: vendorBusiness.bookingsPerMonth ? vendorBusiness.bookingsPerMonth * 12 : 0,
    business_created_at: istTime,
    business_updated_at: istTime
  };
}

/**
 * Fetch vendor data from vendors collection (from source database)
 */
async function fetchVendorData(sourceDb, vendorId) {
  try {
    const vendorsCollection = sourceDb.collection('vendors');
    const vendor = await vendorsCollection.findOne({ id: vendorId });
    return vendor;
  } catch (error) {
    console.error(`Error fetching vendor ${vendorId}:`, error.message);
    return null;
  }
}

/**
 * Transform old DJ artist document to new DJ artist document
 */
function transformDjArtist(oldDjArtist, vendorData = null) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Get vendor phone number
  const serviceContactNumber = vendorData?.mobile || '0000000000';

  // Transform IDs to match new schema pattern
  // Old DJ artist IDs start with "dj", new ones should start with "DJS"
  let transformedServiceId = oldDjArtist.id;
  if (transformedServiceId) {
    // Replace "dj" prefix with "DJS" prefix (case-insensitive)
    transformedServiceId = transformedServiceId.replace(/^dj/i, 'DJS');
  }
  const capitalizedVendorId = oldDjArtist.venId ? oldDjArtist.venId.toUpperCase() : oldDjArtist.venId;

  // Basic details transformation
  // Use name as point_of_contact (managerName is not in new schema)
  const basicDetails = {
    is_completed: oldDjArtist.basicDetails?.completed || false,
    point_of_contact: oldDjArtist.basicDetails?.name || oldDjArtist.basicDetails?.managerName || '',
    service_contact_number: serviceContactNumber,
    description: oldDjArtist.basicDetails?.description || '',
    service_location_dj_artist: {
      service_address: oldDjArtist.basicDetails?.address || oldDjArtist.basicDetails?.location?.googleMapsAddress || '',
      lat: toString(oldDjArtist.basicDetails?.location?.lat),
      lon: toString(oldDjArtist.basicDetails?.location?.lng),
      service_pincode: oldDjArtist.basicDetails?.location?.pincode || undefined,
      google_map_link: oldDjArtist.basicDetails?.location?.googleMapsAddress || ''
    }
  };

  // Service details transformation
  const serviceDetails = {
    is_completed: oldDjArtist.serviceDetails ? true : false, // No completed flag in old schema
    event_types_dj: oldDjArtist.serviceDetails?.eventTypes || [],
    music_genres: oldDjArtist.serviceDetails?.musicGenres || [],
    regional_specializations: oldDjArtist.serviceDetails?.regionalSpecializations || [],
    services_offered: oldDjArtist.serviceDetails?.servicesOffered || []
  };

  // Additional details transformation
  // Note: awards and testimonials are not in new schema, so they're dropped
  const additionalDetails = {
    is_completed: oldDjArtist.additionalDetails ? true : false, // No completed flag in old schema
    asset_images: oldDjArtist.additionalDetails?.photos || [],
    asset_videos: oldDjArtist.additionalDetails?.videos || [],
    ig_socials_link: oldDjArtist.additionalDetails?.instagramUrl || '',
    web_social_link: oldDjArtist.additionalDetails?.websiteUrl || '',
    prices_starts_from: oldDjArtist.additionalDetails?.priceStartingFrom || 0
  };

  // Policies transformation
  // Note: terms_and_conditions and cancellation_policy are arrays in both old and new schemas
  const policies = {
    is_completed: oldDjArtist.policies?.completed || false,
    terms_and_conditions: oldDjArtist.policies?.termsAndConditions || [],
    cancellation_policy: oldDjArtist.policies?.cancellationPolicy || [],
    agreement_url: oldDjArtist.policies?.agreementUrl || '',
    agreement_signed_at: oldDjArtist.policies?.agreementSignedAt || istTime
  };

  // Create business details from vendor data
  const businessDetails = createBusinessDetails(oldDjArtist, vendorData, transformedServiceId);

  // Map bank details from vendor if available
  const bankDetails = (() => {
    if (vendorData?.bankDetails && Array.isArray(vendorData.bankDetails) && vendorData.bankDetails.length > 0) {
      const bank = vendorData.bankDetails[0];
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      
      return {
        vendor_id: capitalizedVendorId,
        service_id: transformedServiceId,
        bank_name: bank.bankName || null,
        account_type: null,
        account_number: bank.accountNo || null,
        ifsc: bank.ifscCode || null,
        beneficiary_id: bank.beneficiaryId || null,
        bank_created_at: istTime,
        bank_updated_at: istTime
      };
    }
    return {};
  })();

  // Create new DJ artist document
  const newDjArtist = {
    service_id: transformedServiceId,
    vendor_id: capitalizedVendorId,
    service_type: 'DJ-Artist',
    is_active: true, // Default to true in new schema
    is_verified: oldDjArtist.isVerified || false, // Separate field in new schema
    profile_completion_score: oldDjArtist.basicDetails?.profileCompletion || 0,
    service_areas: oldDjArtist.basicDetails?.serviceAreas || [],
    bank_details: bankDetails,
    business_details: businessDetails,
    basic_details: basicDetails,
    service_details: serviceDetails,
    additional_details: additionalDetails,
    policies: policies,
    dj_artist_created_at: oldDjArtist.createdAt ? toIST(oldDjArtist.createdAt) : istTime,
    dj_artist_updated_at: oldDjArtist.updatedAt ? toIST(oldDjArtist.updatedAt) : istTime
  };

  return newDjArtist;
}

/**
 * Validate transformed DJ artist document
 */
function validateDjArtist(djArtist) {
  const errors = [];

  // Required top-level fields
  if (!djArtist.service_id) errors.push('service_id is required');
  if (!djArtist.vendor_id) errors.push('vendor_id is required');

  // Required basic_details fields
  if (!djArtist.basic_details?.point_of_contact) errors.push('basic_details.point_of_contact is required');
  if (!djArtist.basic_details?.service_contact_number) errors.push('basic_details.service_contact_number is required');
  if (!djArtist.basic_details?.description) errors.push('basic_details.description is required');

  // Required service_details fields
  if (!djArtist.service_details?.event_types_dj?.length) errors.push('service_details.event_types_dj is required');
  if (!djArtist.service_details?.regional_specializations?.length) errors.push('service_details.regional_specializations is required');
  if (!djArtist.service_details?.services_offered?.length) errors.push('service_details.services_offered is required');

  // Required additional_details fields
  if (!djArtist.additional_details?.asset_videos?.length) errors.push('additional_details.asset_videos is required');
  if (djArtist.additional_details?.prices_starts_from === undefined) errors.push('additional_details.prices_starts_from is required');

  // Required business_details
  if (!djArtist.business_details) errors.push('business_details is required');

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Main migration function
 */
async function migrateDjArtists() {
  let sourceClient;
  let destClient;

  try {
    // Connect to source MongoDB (where old data is)
    console.log('Connecting to SOURCE MongoDB (old data)...');
    console.log(`Source URI: ${MONGO_URI_SOURCE.replace(/:[^:@]+@/, ':****@')}`);
    sourceClient = new MongoClient(MONGO_URI_SOURCE);
    await sourceClient.connect();
    console.log('✓ Connected to SOURCE MongoDB\n');

    // Connect to destination MongoDB (where new data will be)
    console.log('Connecting to DESTINATION MongoDB (new data)...');
    console.log(`Dest URI: ${MONGO_URI_DEST.replace(/:[^:@]+@/, ':****@')}`);
    destClient = new MongoClient(MONGO_URI_DEST);
    await destClient.connect();
    console.log('✓ Connected to DESTINATION MongoDB\n');

    if (DRY_RUN) {
      console.log('⚠ DRY RUN MODE - No data will be modified\n');
    }

    // Source: read from 'dev' database (where actual data is)
    // Destination: write to 'prod' database (in new MongoDB)
    const sourceDbName = 'dev';
    const destDbName = 'prod';
    
    console.log(`Source database: '${sourceDbName}' (reading from old data)`);
    console.log(`Destination database: '${destDbName}' (writing to new data)\n`);
    
    // Get source and destination databases
    const sourceDb = sourceClient.db(sourceDbName);
    const destDb = destClient.db(destDbName);
    
    // Source collections (old data) - Mongoose auto-pluralizes "DjArtist" model to "djartists" collection
    const oldCollection = sourceDb.collection('djartists');
    const vendorsCollection = sourceDb.collection('vendors');
    
    // Destination collection (new data) - collection name is "dj-artists" (kebab-case) as per new schema
    const newCollection = destDb.collection('dj-artists');
    
    // Verify source database has data
    console.log(`Verifying source database '${sourceDbName}'...`);
    const djArtistCount = await oldCollection.countDocuments();
    console.log(`✓ Found ${djArtistCount} DJ artists in '${sourceDbName}.djartists' collection\n`);

    // Get all documents from old collection (or limit if specified)
    if (LIMIT) {
      console.log(`Fetching top ${LIMIT} documents from old djartists collection...`);
    } else {
      console.log(`Fetching ALL documents from old djartists collection...`);
    }
    
    let query = oldCollection.find({}).sort({ createdAt: -1 });
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    const oldDjArtists = await query.toArray();
    
    console.log(`✓ Found ${oldDjArtists.length} DJ artists to migrate\n`);

    if (oldDjArtists.length === 0) {
      console.log('No DJ artists to migrate. Exiting.');
      return;
    }

    // Statistics
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const migrated = [];

    // Process each DJ artist
    console.log('Processing DJ artists...\n');
    
    for (let i = 0; i < oldDjArtists.length; i++) {
      const oldDjArtist = oldDjArtists[i];
      const djArtistNumber = i + 1;
      
      try {
        console.log(`[${djArtistNumber}/${oldDjArtists.length}] Processing DJ artist: ${oldDjArtist.id || oldDjArtist._id}`);
        console.log(`  Name: ${oldDjArtist.basicDetails?.name || 'N/A'}`);
        console.log(`  Manager: ${oldDjArtist.basicDetails?.managerName || 'N/A'}`);
        console.log(`  Vendor ID: ${oldDjArtist.venId || 'N/A'}`);

        // Skip if essential fields are missing (malformed document)
        if (!oldDjArtist.id || !oldDjArtist.venId || !oldDjArtist.basicDetails) {
          console.log(`  ⚠ Skipping malformed document - missing essential fields (id, venId, or basicDetails)`);
          errorCount++;
          errors.push({
            oldId: oldDjArtist._id,
            name: oldDjArtist.basicDetails?.name || 'N/A',
            error: 'Malformed document - missing essential fields'
          });
          continue;
        }

        // Transform IDs to match new schema pattern
        // Old DJ artist IDs start with "dj", new ones should start with "DJS"
        let transformedServiceId = oldDjArtist.id;
        if (transformedServiceId) {
          // Replace "dj" prefix with "DJS" prefix (case-insensitive)
          transformedServiceId = transformedServiceId.replace(/^dj/i, 'DJS');
        }
        const capitalizedVendorId = oldDjArtist.venId ? oldDjArtist.venId.toUpperCase() : oldDjArtist.venId;
        
        // Log ID transformation
        console.log(`  ID Transformation: ${oldDjArtist.id} → ${transformedServiceId}`);
        console.log(`  Vendor ID Transformation: ${oldDjArtist.venId} → ${capitalizedVendorId}`);

        // Check if already exists (using transformed ID)
        const existing = await newCollection.findOne({ service_id: transformedServiceId });
        if (existing) {
          console.log(`  ⚠ Already exists in new collection - skipping`);
          continue;
        }

        // Fetch vendor data to get phone number (using original venId, not capitalized)
        let vendorData = null;
        if (oldDjArtist.venId) {
          console.log(`  Fetching vendor data for vendor ID: ${oldDjArtist.venId}`);
          vendorData = await fetchVendorData(sourceDb, oldDjArtist.venId);
          if (vendorData) {
            console.log(`  ✓ Found vendor: ${vendorData.name || 'N/A'}`);
            console.log(`    Vendor mobile: ${vendorData.mobile || 'N/A'}`);
            if (vendorData.businessDetails) {
              console.log(`    Business Details found:`);
              console.log(`      - PAN: ${vendorData.businessDetails.panNo || 'N/A'}`);
              console.log(`      - GST: ${vendorData.businessDetails.gstin || 'N/A'}`);
              console.log(`      - Team Size: ${vendorData.businessDetails.teamsize || 'N/A'}`);
              console.log(`      - Years: ${vendorData.businessDetails.years || 'N/A'}`);
              console.log(`      - Bookings/Month: ${vendorData.businessDetails.bookingsPerMonth || 'N/A'}`);
            }
          } else {
            console.log(`  ⚠ Vendor not found - will use placeholder for service_contact_number`);
          }
        }

        // Transform DJ artist with vendor data
        const newDjArtist = transformDjArtist(oldDjArtist, vendorData);

        // Handle missing required fields with placeholders BEFORE validation
        if (!newDjArtist.basic_details.service_contact_number || newDjArtist.basic_details.service_contact_number === '0000000000') {
          console.log(`  ⚠ WARNING: service_contact_number is missing or invalid - using placeholder`);
          newDjArtist.basic_details.service_contact_number = '0000000000';
        } else {
          console.log(`  ✓ Using vendor phone number: ${newDjArtist.basic_details.service_contact_number}`);
        }

        // Handle missing asset_videos (required field)
        if (!newDjArtist.additional_details.asset_videos || newDjArtist.additional_details.asset_videos.length === 0) {
          console.log(`  ⚠ WARNING: asset_videos is missing - setting placeholder`);
          newDjArtist.additional_details.asset_videos = ['https://placeholder.com/video.mp4'];
        }

        // Handle missing agreement_url (not required but good to have)
        if (!newDjArtist.policies.agreement_url) {
          console.log(`  ⚠ WARNING: agreement_url is missing - setting placeholder`);
          newDjArtist.policies.agreement_url = 'https://placeholder.com/agreement';
        }

        // Validate after setting placeholders
        validateDjArtist(newDjArtist);

        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate:`);
          console.log(`    Service ID: ${newDjArtist.service_id}`);
          console.log(`    Vendor ID: ${newDjArtist.vendor_id}`);
          console.log(`    Is Active: ${newDjArtist.is_active}`);
          console.log(`    Is Verified: ${newDjArtist.is_verified}`);
          console.log(`    Profile Completion: ${newDjArtist.profile_completion_score}%`);
          console.log(`    Service Areas: ${newDjArtist.service_areas.length} areas`);
          console.log(`    Event Types: ${newDjArtist.service_details.event_types_dj.length} types`);
          console.log(`    Music Genres: ${newDjArtist.service_details.music_genres.length} genres`);
          console.log(`    Regional Specializations: ${newDjArtist.service_details.regional_specializations.length} specializations`);
          console.log(`    Services Offered: ${newDjArtist.service_details.services_offered.length} services`);
          console.log(`    Videos: ${newDjArtist.additional_details.asset_videos.length} videos`);
          console.log(`    Price Starts From: ₹${newDjArtist.additional_details.prices_starts_from}`);
        } else {
          // Insert into new collection
          await newCollection.insertOne(newDjArtist);
          console.log(`  ✓ Successfully migrated`);
        }

        migrated.push({
          oldId: oldDjArtist.id || oldDjArtist._id,
          newId: newDjArtist.service_id,
          name: oldDjArtist.basicDetails?.name
        });

        successCount++;
        console.log(''); // Empty line for readability

      } catch (error) {
        errorCount++;
        const errorInfo = {
          oldId: oldDjArtist.id || oldDjArtist._id,
          name: oldDjArtist.basicDetails?.name,
          error: error.message
        };
        errors.push(errorInfo);
        console.error(`  ✗ Error: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
        console.log(''); // Empty line
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total DJ artists processed: ${oldDjArtists.length}`);
    console.log(`✓ Successful:            ${successCount}`);
    console.log(`✗ Errors:               ${errorCount}`);
    console.log(`Progress:                ${((successCount / oldDjArtists.length) * 100).toFixed(1)}%`);

    if (DRY_RUN) {
      console.log('\n⚠ This was a DRY RUN - No data was actually modified');
    }

    // Print migrated documents
    if (migrated.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('MIGRATED DJ ARTISTS:');
      console.log('-'.repeat(60));
      migrated.forEach((dja, idx) => {
        console.log(`${idx + 1}. ${dja.name || 'N/A'}`);
        console.log(`   Old ID: ${dja.oldId}`);
        console.log(`   New ID: ${dja.newId}`);
      });
    }

    // Print errors if any
    if (errors.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('ERRORS:');
      console.log('-'.repeat(60));
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.name || 'N/A'} (ID: ${err.oldId})`);
        console.log(`   Error: ${err.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (sourceClient) {
      await sourceClient.close();
      console.log('\n✓ Disconnected from SOURCE MongoDB');
    }
    if (destClient) {
      await destClient.close();
      console.log('✓ Disconnected from DESTINATION MongoDB');
    }
  }
}

// Run migration
migrateDjArtists()
  .then(() => {
    console.log('\n✓ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });

