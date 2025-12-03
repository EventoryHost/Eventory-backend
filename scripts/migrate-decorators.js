/**
 * Migration Script: Decorators Collection
 * 
 * Migrates ALL decorator data from old structure to new structure
 * Reads from 'dev' database and writes to 'prod' database in destination
 * 
 * Usage:
 *   node scripts/migrate-decorators.js
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
 * Maps: "caterer" -> 1, "venue" -> 2, "photographer" -> 3, "decorator" -> 4, etc.
 */
function mapCategoryToNumber(categoryStr) {
  if (!categoryStr) return 4; // Default to decorator
  
  const categoryMap = {
    'caterer': 1,
    'venue': 2,
    'photographer': 3,
    'decorator': 4,
    'makeupartist': 5,
    'djartist': 6
  };
  
  const lower = String(categoryStr).toLowerCase();
  return categoryMap[lower] || 4; // Default to decorator
}

/**
 * Create business_details structure from vendor data
 */
function createBusinessDetails(decorator, vendorData, serviceId) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const vendorBusiness = vendorData?.businessDetails || {};
  
  return {
    service_id: serviceId,
    service_type: 'Decorator',
    category: mapCategoryToNumber(vendorBusiness.category || 'decorator'),
    business_registration_name: vendorBusiness.businessName || decorator.basicDetails?.name || 'Unknown Business',
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
    business_address: vendorBusiness.businessAddress || decorator.basicDetails?.location?.googleMapsAddress || '',
    landmark: vendorBusiness.landmark || '',
    pincode: vendorBusiness.pinCode || decorator.basicDetails?.location?.pincode || 0,
    operational_cities: vendorBusiness.cities && vendorBusiness.cities.length > 0 
      ? vendorBusiness.cities 
      : (decorator.basicDetails?.serviceAreas || []),
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
 * Transform old decorator document to new decorator document
 */
function transformDecorator(oldDecorator, vendorData = null) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Get vendor phone number
  const serviceContactNumber = vendorData?.mobile || '0000000000';

  // Transform IDs to match new schema pattern
  // Old decorator IDs start with "dec", new ones should start with "DECO"
  let transformedServiceId = oldDecorator.id;
  if (transformedServiceId) {
    // Replace "dec" prefix with "DECO" prefix (case-insensitive)
    transformedServiceId = transformedServiceId.replace(/^dec/i, 'DECO');
  }
  const capitalizedVendorId = oldDecorator.venId ? oldDecorator.venId.toUpperCase() : oldDecorator.venId;

  // Basic details transformation
  const basicDetails = {
    is_completed: oldDecorator.basicDetails?.completed || false,
    point_of_contact: oldDecorator.basicDetails?.name || '',
    service_contact_number: serviceContactNumber,
    avg_setup_duration: oldDecorator.basicDetails?.duration || '',
    description: oldDecorator.basicDetails?.description || '',
    event_types_decorated: oldDecorator.basicDetails?.eventTypes?.types || [],
    service_location_decorator: {
      service_address: oldDecorator.basicDetails?.location?.googleMapsAddress || '',
      lat: toString(oldDecorator.basicDetails?.location?.lat),
      lon: toString(oldDecorator.basicDetails?.location?.lng),
      service_pincode: oldDecorator.basicDetails?.location?.pincode || undefined,
      google_map_link: oldDecorator.basicDetails?.location?.googleMapsAddress || ''
    }
  };

  // Theme details transformation (combines themesOffered and themesElement)
  const themeDetails = {
    is_completed: oldDecorator.themesOffered?.completed || oldDecorator.themesElement?.completed || false,
    themes_offered: oldDecorator.themesOffered?.themesOffered || [],
    is_prop_selection_available: oldDecorator.themesOffered?.propSelection || false,
    any_custom_design_process: oldDecorator.themesOffered?.customDesignProcess || '',
    is_colour_scheme_assistance_provided: oldDecorator.themesOffered?.colorSchemeAssistance || false,
    is_theme_customization_allowed: oldDecorator.themesOffered?.themeCustomization || false,
    is_venue_adaptability: oldDecorator.themesOffered?.venueAdaptability || false,
    theme_elements_available: oldDecorator.themesElement?.themeElements || [],
    theme_portfolio_images: oldDecorator.themesElement?.themePhotos || [],
    theme_portfolio_videos: oldDecorator.themesElement?.themeVideos || []
  };

  // Additional details transformation
  const additionalDetails = {
    is_completed: oldDecorator.additionalDetails?.completed || false,
    asset_images: oldDecorator.additionalDetails?.photos || [],
    asset_videos: oldDecorator.additionalDetails?.videos || [],
    min_booking_period: oldDecorator.additionalDetails?.advanceBookingPeriod?.ll || 1,
    max_booking_period: oldDecorator.additionalDetails?.advanceBookingPeriod?.ul || undefined,
    prices_starts_from: oldDecorator.additionalDetails?.priceStartingFrom || 0,
    ig_socials_link: oldDecorator.additionalDetails?.instagram || '',
    web_social_link: oldDecorator.additionalDetails?.website || '',
    is_theme_proposals_provided: oldDecorator.additionalDetails?.themeProposels || false,
    is_proposal_revision_possible: oldDecorator.additionalDetails?.proposalRevisions !== undefined 
      ? oldDecorator.additionalDetails.proposalRevisions 
      : true // Default to true as per schema
  };

  // Policies transformation
  const policies = {
    is_completed: oldDecorator.policies?.completed || false,
    cancellation_policy: oldDecorator.policies?.cancellationPolicy || null,
    terms_and_conditions: oldDecorator.policies?.termsAndConditions || null,
    agreement_url: oldDecorator.policies?.agreementUrl || '',
    agreement_signed_at: oldDecorator.policies?.agreementSignedAt || istTime
  };

  // Create business details from vendor data
  const businessDetails = createBusinessDetails(oldDecorator, vendorData, transformedServiceId);

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

  // Create new decorator document
  const newDecorator = {
    service_id: transformedServiceId,
    vendor_id: capitalizedVendorId,
    service_type: 'Decorator',
    is_active: oldDecorator.isVerified || false,
    profile_completion_score: oldDecorator.basicDetails?.profileCompletion || 0,
    service_areas: oldDecorator.basicDetails?.serviceAreas || [],
    bank_details: bankDetails,
    business_details: businessDetails,
    basic_details: basicDetails,
    theme_details: themeDetails,
    additional_details: additionalDetails,
    policies: policies,
    decorator_created_at: oldDecorator.createdAt ? toIST(oldDecorator.createdAt) : istTime,
    decorator_updated_at: oldDecorator.updatedAt ? toIST(oldDecorator.updatedAt) : istTime
  };

  return newDecorator;
}

/**
 * Validate transformed decorator document
 */
function validateDecorator(decorator) {
  const errors = [];

  // Required top-level fields
  if (!decorator.service_id) errors.push('service_id is required');
  if (!decorator.vendor_id) errors.push('vendor_id is required');

  // Required basic_details fields
  if (!decorator.basic_details?.point_of_contact) errors.push('basic_details.point_of_contact is required');
  if (!decorator.basic_details?.service_contact_number) errors.push('basic_details.service_contact_number is required');
  if (!decorator.basic_details?.avg_setup_duration) errors.push('basic_details.avg_setup_duration is required');
  if (!decorator.basic_details?.description) errors.push('basic_details.description is required');
  if (!decorator.basic_details?.event_types_decorated?.length) errors.push('basic_details.event_types_decorated is required');

  // Required theme_details fields
  if (!decorator.theme_details?.themes_offered?.length) errors.push('theme_details.themes_offered is required');

  // Required additional_details fields
  if (!decorator.additional_details?.asset_videos?.length) errors.push('additional_details.asset_videos is required');
  if (!decorator.additional_details?.min_booking_period) errors.push('additional_details.min_booking_period is required');
  if (decorator.additional_details?.prices_starts_from === undefined) errors.push('additional_details.prices_starts_from is required');

  // Required policies fields
  if (!decorator.policies?.agreement_url) errors.push('policies.agreement_url is required');
  if (!decorator.policies?.agreement_signed_at) errors.push('policies.agreement_signed_at is required');

  // Required business_details
  if (!decorator.business_details) errors.push('business_details is required');

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Main migration function
 */
async function migrateDecorators() {
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
    
    // Source collections (old data)
    const oldCollection = sourceDb.collection('decorators');
    const vendorsCollection = sourceDb.collection('vendors');
    
    // Destination collection (new data)
    const newCollection = destDb.collection('decorators');
    
    // Verify source database has data
    console.log(`Verifying source database '${sourceDbName}'...`);
    const decoratorCount = await oldCollection.countDocuments();
    console.log(`✓ Found ${decoratorCount} decorators in '${sourceDbName}.decorators' collection\n`);

    // Get all documents from old collection (or limit if specified)
    if (LIMIT) {
      console.log(`Fetching top ${LIMIT} documents from old decorators collection...`);
    } else {
      console.log(`Fetching ALL documents from old decorators collection...`);
    }
    
    let query = oldCollection.find({}).sort({ createdAt: -1 });
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    const oldDecorators = await query.toArray();
    
    console.log(`✓ Found ${oldDecorators.length} decorators to migrate\n`);

    if (oldDecorators.length === 0) {
      console.log('No decorators to migrate. Exiting.');
      return;
    }

    // Statistics
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const migrated = [];

    // Process each decorator
    console.log('Processing decorators...\n');
    
    for (let i = 0; i < oldDecorators.length; i++) {
      const oldDecorator = oldDecorators[i];
      const decoratorNumber = i + 1;
      
      try {
        console.log(`[${decoratorNumber}/${oldDecorators.length}] Processing decorator: ${oldDecorator.id || oldDecorator._id}`);
        console.log(`  Name: ${oldDecorator.basicDetails?.name || 'N/A'}`);
        console.log(`  Vendor ID: ${oldDecorator.venId || 'N/A'}`);

        // Skip if essential fields are missing (malformed document)
        if (!oldDecorator.id || !oldDecorator.venId || !oldDecorator.basicDetails) {
          console.log(`  ⚠ Skipping malformed document - missing essential fields (id, venId, or basicDetails)`);
          errorCount++;
          errors.push({
            oldId: oldDecorator._id,
            name: oldDecorator.basicDetails?.name || 'N/A',
            error: 'Malformed document - missing essential fields'
          });
          continue;
        }

        // Transform IDs to match new schema pattern
        // Old decorator IDs start with "dec", new ones should start with "DECO"
        let transformedServiceId = oldDecorator.id;
        if (transformedServiceId) {
          // Replace "dec" prefix with "DECO" prefix (case-insensitive)
          transformedServiceId = transformedServiceId.replace(/^dec/i, 'DECO');
        }
        const capitalizedVendorId = oldDecorator.venId ? oldDecorator.venId.toUpperCase() : oldDecorator.venId;
        
        // Log ID transformation
        console.log(`  ID Transformation: ${oldDecorator.id} → ${transformedServiceId}`);
        console.log(`  Vendor ID Transformation: ${oldDecorator.venId} → ${capitalizedVendorId}`);

        // Check if already exists (using transformed ID)
        const existing = await newCollection.findOne({ service_id: transformedServiceId });
        if (existing) {
          console.log(`  ⚠ Already exists in new collection - skipping`);
          continue;
        }

        // Fetch vendor data to get phone number (using original venId, not capitalized)
        let vendorData = null;
        if (oldDecorator.venId) {
          console.log(`  Fetching vendor data for vendor ID: ${oldDecorator.venId}`);
          vendorData = await fetchVendorData(sourceDb, oldDecorator.venId);
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

        // Transform decorator with vendor data
        const newDecorator = transformDecorator(oldDecorator, vendorData);

        // Handle missing required fields with placeholders BEFORE validation
        if (!newDecorator.basic_details.service_contact_number || newDecorator.basic_details.service_contact_number === '0000000000') {
          console.log(`  ⚠ WARNING: service_contact_number is missing or invalid - using placeholder`);
          newDecorator.basic_details.service_contact_number = '0000000000';
        } else {
          console.log(`  ✓ Using vendor phone number: ${newDecorator.basic_details.service_contact_number}`);
        }

        if (!newDecorator.policies.agreement_url) {
          console.log(`  ⚠ WARNING: agreement_url is missing - setting placeholder`);
          newDecorator.policies.agreement_url = 'https://placeholder.com/agreement';
        }

        // Handle missing asset_videos (required field)
        if (!newDecorator.additional_details.asset_videos || newDecorator.additional_details.asset_videos.length === 0) {
          console.log(`  ⚠ WARNING: asset_videos is missing - setting placeholder`);
          newDecorator.additional_details.asset_videos = ['https://placeholder.com/video.mp4'];
        }

        // Validate after setting placeholders
        validateDecorator(newDecorator);

        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate:`);
          console.log(`    Service ID: ${newDecorator.service_id}`);
          console.log(`    Vendor ID: ${newDecorator.vendor_id}`);
          console.log(`    Is Active: ${newDecorator.is_active}`);
          console.log(`    Profile Completion: ${newDecorator.profile_completion_score}%`);
          console.log(`    Service Areas: ${newDecorator.service_areas.length} areas`);
          console.log(`    Event Types: ${newDecorator.basic_details.event_types_decorated.length} types`);
          console.log(`    Themes Offered: ${newDecorator.theme_details.themes_offered.length} themes`);
          console.log(`    Theme Portfolio Images: ${newDecorator.theme_details.theme_portfolio_images.length} images`);
          console.log(`    Videos: ${newDecorator.additional_details.asset_videos.length} videos`);
          console.log(`    Price Starts From: ₹${newDecorator.additional_details.prices_starts_from}`);
        } else {
          // Insert into new collection
          await newCollection.insertOne(newDecorator);
          console.log(`  ✓ Successfully migrated`);
        }

        migrated.push({
          oldId: oldDecorator.id || oldDecorator._id,
          newId: newDecorator.service_id,
          name: oldDecorator.basicDetails?.name
        });

        successCount++;
        console.log(''); // Empty line for readability

      } catch (error) {
        errorCount++;
        const errorInfo = {
          oldId: oldDecorator.id || oldDecorator._id,
          name: oldDecorator.basicDetails?.name,
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
    console.log(`Total decorators processed: ${oldDecorators.length}`);
    console.log(`✓ Successful:            ${successCount}`);
    console.log(`✗ Errors:               ${errorCount}`);
    console.log(`Progress:                ${((successCount / oldDecorators.length) * 100).toFixed(1)}%`);

    if (DRY_RUN) {
      console.log('\n⚠ This was a DRY RUN - No data was actually modified');
    }

    // Print migrated documents
    if (migrated.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('MIGRATED DECORATORS:');
      console.log('-'.repeat(60));
      migrated.forEach((dec, idx) => {
        console.log(`${idx + 1}. ${dec.name || 'N/A'}`);
        console.log(`   Old ID: ${dec.oldId}`);
        console.log(`   New ID: ${dec.newId}`);
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
migrateDecorators()
  .then(() => {
    console.log('\n✓ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });


