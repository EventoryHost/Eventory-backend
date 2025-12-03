/**
 * Migration Script: Makeup Artists Collection
 * 
 * Migrates ALL makeup artist data from old structure to new structure
 * Reads from 'dev' database and writes to 'prod' database in destination
 * 
 * Usage:
 *   node scripts/migrate-makeup-artists.js
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
 * Maps: "caterer" -> 1, "venue" -> 2, "photographer" -> 3, "decorator" -> 4, "makeupartist" -> 5, etc.
 */
function mapCategoryToNumber(categoryStr) {
  if (!categoryStr) return 5; // Default to makeup artist
  
  const categoryMap = {
    'caterer': 1,
    'venue': 2,
    'photographer': 3,
    'decorator': 4,
    'makeupartist': 5,
    'makeup-artist': 5,
    'djartist': 6
  };
  
  const lower = String(categoryStr).toLowerCase();
  return categoryMap[lower] || 5; // Default to makeup artist
}

/**
 * Create business_details structure from vendor data
 */
function createBusinessDetails(makeupArtist, vendorData, serviceId) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const vendorBusiness = vendorData?.businessDetails || {};
  
  return {
    service_id: serviceId,
    service_type: 'Makeup-Artist',
    category: mapCategoryToNumber(vendorBusiness.category || 'makeupartist'),
    business_registration_name: vendorBusiness.businessName || makeupArtist.basicDetails?.name || 'Unknown Business',
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
    business_address: vendorBusiness.businessAddress || makeupArtist.basicDetails?.address || '',
    landmark: vendorBusiness.landmark || '',
    pincode: vendorBusiness.pinCode || makeupArtist.basicDetails?.location?.pincode || 0,
    operational_cities: vendorBusiness.cities && vendorBusiness.cities.length > 0 
      ? vendorBusiness.cities 
      : (makeupArtist.basicDetails?.serviceAreas || []),
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
 * Convert array to string (for terms_and_conditions and cancellation_policy)
 */
function arrayToString(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  return arr.join('\n');
}

/**
 * Transform old makeup artist document to new makeup artist document
 */
function transformMakeupArtist(oldMakeupArtist, vendorData = null) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Get vendor phone number
  const serviceContactNumber = vendorData?.mobile || '0000000000';

  // Transform IDs to match new schema pattern
  // Old makeup artist IDs start with "mak", new ones should start with "MKA"
  let transformedServiceId = oldMakeupArtist.id;
  if (transformedServiceId) {
    // Replace "mak" prefix with "MKA" prefix (case-insensitive)
    transformedServiceId = transformedServiceId.replace(/^mak/i, 'MKA');
  }
  const capitalizedVendorId = oldMakeupArtist.venId ? oldMakeupArtist.venId.toUpperCase() : oldMakeupArtist.venId;

  // Basic details transformation
  const basicDetails = {
    is_completed: oldMakeupArtist.basicDetails?.completed || false,
    point_of_contact: oldMakeupArtist.basicDetails?.name || '',
    service_contact_number: serviceContactNumber,
    min_booking_capacity: oldMakeupArtist.basicDetails?.eventSize?.ll || 1,
    max_booking_capacity: oldMakeupArtist.basicDetails?.eventSize?.ul || 100,
    description: oldMakeupArtist.basicDetails?.description || '',
    event_types_makeup: oldMakeupArtist.basicDetails?.eventTypes || [],
    types_of_makeup_artists_available: oldMakeupArtist.basicDetails?.typesOfMakeupArtists || [],
    service_location_make_up: {
      service_address: oldMakeupArtist.basicDetails?.address || oldMakeupArtist.basicDetails?.location?.googleMapsAddress || '',
      lat: toString(oldMakeupArtist.basicDetails?.location?.lat),
      lon: toString(oldMakeupArtist.basicDetails?.location?.lng),
      service_pincode: oldMakeupArtist.basicDetails?.location?.pincode || undefined,
      google_map_link: oldMakeupArtist.basicDetails?.location?.googleMapsAddress || ''
    }
  };

  // Service details transformation
  const serviceDetails = {
    is_completed: oldMakeupArtist.serviceDetails?.completed || false,
    is_onsite_makeup_available: oldMakeupArtist.serviceDetails?.onsiteMakeup !== undefined 
      ? oldMakeupArtist.serviceDetails.onsiteMakeup 
      : true, // Default to true if not specified
    is_customization_possible: oldMakeupArtist.serviceDetails?.customization !== undefined 
      ? oldMakeupArtist.serviceDetails.customization 
      : false,
    service_types: oldMakeupArtist.serviceDetails?.serviceTypes || []
  };

  // Additional details transformation
  const additionalDetails = {
    is_completed: oldMakeupArtist.additionalDetails?.completed || false,
    asset_images: oldMakeupArtist.additionalDetails?.photos || [],
    asset_videos: oldMakeupArtist.additionalDetails?.videos || [],
    min_booking_period: 1, // Required but not in old schema - default to 1
    max_booking_period: 30, // Required but not in old schema - default to 30
    prices_starts_from: oldMakeupArtist.additionalDetails?.priceStartingFrom || 0,
    ig_socials_link: oldMakeupArtist.additionalDetails?.socialMedia || '',
    web_social_link: oldMakeupArtist.additionalDetails?.websiteUrl || ''
  };

  // Policies transformation
  const policies = {
    is_completed: oldMakeupArtist.policies?.completed || false,
    cancellation_policy: arrayToString(oldMakeupArtist.policies?.cancellationPolicy),
    terms_and_conditions: arrayToString(oldMakeupArtist.policies?.termsAndConditions),
    agreement_url: oldMakeupArtist.policies?.agreementUrl || '',
    agreement_signed_at: oldMakeupArtist.policies?.agreementSignedAt || istTime
  };

  // Create business details from vendor data
  const businessDetails = createBusinessDetails(oldMakeupArtist, vendorData, transformedServiceId);

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

  // Create new makeup artist document
  const newMakeupArtist = {
    service_id: transformedServiceId,
    vendor_id: capitalizedVendorId,
    service_type: 'Makeup-Artist',
    is_active: oldMakeupArtist.isVerified || false,
    profile_completion_score: oldMakeupArtist.basicDetails?.profileCompletion || 0,
    service_areas: oldMakeupArtist.basicDetails?.serviceAreas || [],
    bank_details: bankDetails,
    business_details: businessDetails,
    basic_details: basicDetails,
    service_details: serviceDetails,
    additional_details: additionalDetails,
    policies: policies,
    makeup_artist_created_at: oldMakeupArtist.createdAt ? toIST(oldMakeupArtist.createdAt) : istTime,
    makeup_artist_updated_at: oldMakeupArtist.updatedAt ? toIST(oldMakeupArtist.updatedAt) : istTime
  };

  return newMakeupArtist;
}

/**
 * Validate transformed makeup artist document
 */
function validateMakeupArtist(makeupArtist) {
  const errors = [];

  // Required top-level fields
  if (!makeupArtist.service_id) errors.push('service_id is required');
  if (!makeupArtist.vendor_id) errors.push('vendor_id is required');

  // Required basic_details fields
  if (!makeupArtist.basic_details?.point_of_contact) errors.push('basic_details.point_of_contact is required');
  if (!makeupArtist.basic_details?.service_contact_number) errors.push('basic_details.service_contact_number is required');
  if (!makeupArtist.basic_details?.min_booking_capacity) errors.push('basic_details.min_booking_capacity is required');
  if (!makeupArtist.basic_details?.max_booking_capacity) errors.push('basic_details.max_booking_capacity is required');
  if (!makeupArtist.basic_details?.description) errors.push('basic_details.description is required');
  if (!makeupArtist.basic_details?.event_types_makeup?.length) errors.push('basic_details.event_types_makeup is required');
  if (!makeupArtist.basic_details?.types_of_makeup_artists_available?.length) errors.push('basic_details.types_of_makeup_artists_available is required');

  // Required service_details fields
  if (makeupArtist.service_details?.is_onsite_makeup_available === undefined) errors.push('service_details.is_onsite_makeup_available is required');
  if (!makeupArtist.service_details?.service_types?.length) errors.push('service_details.service_types is required');

  // Required additional_details fields
  if (!makeupArtist.additional_details?.asset_videos?.length) errors.push('additional_details.asset_videos is required');
  if (makeupArtist.additional_details?.min_booking_period === undefined) errors.push('additional_details.min_booking_period is required');
  if (makeupArtist.additional_details?.max_booking_period === undefined) errors.push('additional_details.max_booking_period is required');
  if (makeupArtist.additional_details?.prices_starts_from === undefined) errors.push('additional_details.prices_starts_from is required');

  // Required policies fields
  if (!makeupArtist.policies?.agreement_url) errors.push('policies.agreement_url is required');
  if (!makeupArtist.policies?.agreement_signed_at) errors.push('policies.agreement_signed_at is required');

  // Required business_details
  if (!makeupArtist.business_details) errors.push('business_details is required');

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Main migration function
 */
async function migrateMakeupArtists() {
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
    
    // Source collections (old data) - Mongoose auto-pluralizes "MakeupArtists" model to "makeupartists" collection
    const oldCollection = sourceDb.collection('makeupartists');
    const vendorsCollection = sourceDb.collection('vendors');
    
    // Destination collection (new data) - collection name is "makeup-artists" (kebab-case) as per new schema
    const newCollection = destDb.collection('makeup-artists');
    
    // Verify source database has data
    console.log(`Verifying source database '${sourceDbName}'...`);
    const makeupArtistCount = await oldCollection.countDocuments();
    console.log(`✓ Found ${makeupArtistCount} makeup artists in '${sourceDbName}.makeupartists' collection\n`);

    // Get all documents from old collection (or limit if specified)
    if (LIMIT) {
      console.log(`Fetching top ${LIMIT} documents from old makeupartists collection...`);
    } else {
      console.log(`Fetching ALL documents from old makeupartists collection...`);
    }
    
    let query = oldCollection.find({}).sort({ createdAt: -1 });
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    const oldMakeupArtists = await query.toArray();
    
    console.log(`✓ Found ${oldMakeupArtists.length} makeup artists to migrate\n`);

    if (oldMakeupArtists.length === 0) {
      console.log('No makeup artists to migrate. Exiting.');
      return;
    }

    // Statistics
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const migrated = [];

    // Process each makeup artist
    console.log('Processing makeup artists...\n');
    
    for (let i = 0; i < oldMakeupArtists.length; i++) {
      const oldMakeupArtist = oldMakeupArtists[i];
      const makeupArtistNumber = i + 1;
      
      try {
        console.log(`[${makeupArtistNumber}/${oldMakeupArtists.length}] Processing makeup artist: ${oldMakeupArtist.id || oldMakeupArtist._id}`);
        console.log(`  Name: ${oldMakeupArtist.basicDetails?.name || 'N/A'}`);
        console.log(`  Vendor ID: ${oldMakeupArtist.venId || 'N/A'}`);

        // Skip if essential fields are missing (malformed document)
        if (!oldMakeupArtist.id || !oldMakeupArtist.venId || !oldMakeupArtist.basicDetails) {
          console.log(`  ⚠ Skipping malformed document - missing essential fields (id, venId, or basicDetails)`);
          errorCount++;
          errors.push({
            oldId: oldMakeupArtist._id,
            name: oldMakeupArtist.basicDetails?.name || 'N/A',
            error: 'Malformed document - missing essential fields'
          });
          continue;
        }

        // Transform IDs to match new schema pattern
        // Old makeup artist IDs start with "mak", new ones should start with "MKA"
        let transformedServiceId = oldMakeupArtist.id;
        if (transformedServiceId) {
          // Replace "mak" prefix with "MKA" prefix (case-insensitive)
          transformedServiceId = transformedServiceId.replace(/^mak/i, 'MKA');
        }
        const capitalizedVendorId = oldMakeupArtist.venId ? oldMakeupArtist.venId.toUpperCase() : oldMakeupArtist.venId;
        
        // Log ID transformation
        console.log(`  ID Transformation: ${oldMakeupArtist.id} → ${transformedServiceId}`);
        console.log(`  Vendor ID Transformation: ${oldMakeupArtist.venId} → ${capitalizedVendorId}`);

        // Check if already exists (using transformed ID)
        const existing = await newCollection.findOne({ service_id: transformedServiceId });
        if (existing) {
          console.log(`  ⚠ Already exists in new collection - skipping`);
          continue;
        }

        // Fetch vendor data to get phone number (using original venId, not capitalized)
        let vendorData = null;
        if (oldMakeupArtist.venId) {
          console.log(`  Fetching vendor data for vendor ID: ${oldMakeupArtist.venId}`);
          vendorData = await fetchVendorData(sourceDb, oldMakeupArtist.venId);
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

        // Transform makeup artist with vendor data
        const newMakeupArtist = transformMakeupArtist(oldMakeupArtist, vendorData);

        // Handle missing required fields with placeholders BEFORE validation
        if (!newMakeupArtist.basic_details.service_contact_number || newMakeupArtist.basic_details.service_contact_number === '0000000000') {
          console.log(`  ⚠ WARNING: service_contact_number is missing or invalid - using placeholder`);
          newMakeupArtist.basic_details.service_contact_number = '0000000000';
        } else {
          console.log(`  ✓ Using vendor phone number: ${newMakeupArtist.basic_details.service_contact_number}`);
        }

        if (!newMakeupArtist.policies.agreement_url) {
          console.log(`  ⚠ WARNING: agreement_url is missing - setting placeholder`);
          newMakeupArtist.policies.agreement_url = 'https://placeholder.com/agreement';
        }

        // Handle missing asset_videos (required field)
        if (!newMakeupArtist.additional_details.asset_videos || newMakeupArtist.additional_details.asset_videos.length === 0) {
          console.log(`  ⚠ WARNING: asset_videos is missing - setting placeholder`);
          newMakeupArtist.additional_details.asset_videos = ['https://placeholder.com/video.mp4'];
        }

        // Validate after setting placeholders
        validateMakeupArtist(newMakeupArtist);

        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate:`);
          console.log(`    Service ID: ${newMakeupArtist.service_id}`);
          console.log(`    Vendor ID: ${newMakeupArtist.vendor_id}`);
          console.log(`    Is Active: ${newMakeupArtist.is_active}`);
          console.log(`    Profile Completion: ${newMakeupArtist.profile_completion_score}%`);
          console.log(`    Service Areas: ${newMakeupArtist.service_areas.length} areas`);
          console.log(`    Event Types: ${newMakeupArtist.basic_details.event_types_makeup.length} types`);
          console.log(`    Types of Makeup Artists: ${newMakeupArtist.basic_details.types_of_makeup_artists_available.length} types`);
          console.log(`    Service Types: ${newMakeupArtist.service_details.service_types.length} types`);
          console.log(`    Videos: ${newMakeupArtist.additional_details.asset_videos.length} videos`);
          console.log(`    Price Starts From: ₹${newMakeupArtist.additional_details.prices_starts_from}`);
        } else {
          // Insert into new collection
          await newCollection.insertOne(newMakeupArtist);
          console.log(`  ✓ Successfully migrated`);
        }

        migrated.push({
          oldId: oldMakeupArtist.id || oldMakeupArtist._id,
          newId: newMakeupArtist.service_id,
          name: oldMakeupArtist.basicDetails?.name
        });

        successCount++;
        console.log(''); // Empty line for readability

      } catch (error) {
        errorCount++;
        const errorInfo = {
          oldId: oldMakeupArtist.id || oldMakeupArtist._id,
          name: oldMakeupArtist.basicDetails?.name,
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
    console.log(`Total makeup artists processed: ${oldMakeupArtists.length}`);
    console.log(`✓ Successful:            ${successCount}`);
    console.log(`✗ Errors:               ${errorCount}`);
    console.log(`Progress:                ${((successCount / oldMakeupArtists.length) * 100).toFixed(1)}%`);

    if (DRY_RUN) {
      console.log('\n⚠ This was a DRY RUN - No data was actually modified');
    }

    // Print migrated documents
    if (migrated.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('MIGRATED MAKEUP ARTISTS:');
      console.log('-'.repeat(60));
      migrated.forEach((mua, idx) => {
        console.log(`${idx + 1}. ${mua.name || 'N/A'}`);
        console.log(`   Old ID: ${mua.oldId}`);
        console.log(`   New ID: ${mua.newId}`);
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
migrateMakeupArtists()
  .then(() => {
    console.log('\n✓ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });

