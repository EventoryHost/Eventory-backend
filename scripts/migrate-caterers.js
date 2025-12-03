/**
 * aMigration Script: Caterers Collection
 * 
 * Migrates ALL caterer data from old structure to new structure
 * Reads from 'prod' database and writes to 'prod' database in destination
 * 
 * Usage:
 *   node scripts/migrate-caterers.js
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
 * Transform vegOrNonVeg value to new format
 */
function transformVegNonVeg(oldValue) {
  const mapping = {
    'veg': 'VEG',
    'nonVeg': 'NON-VEG',
    'both': 'BOTH'
  };
  return mapping[oldValue] || 'BOTH';
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
  
  // Remove spaces and convert to string
  const str = String(teamSizeStr).trim();
  
  // Handle ranges like "6-15"
  if (str.includes('-')) {
    const parts = str.split('-');
    const max = parseInt(parts[1]);
    return isNaN(max) ? 1 : max;
  }
  
  // Handle "16+" or "12+"
  if (str.includes('+')) {
    const num = parseInt(str.replace('+', ''));
    return isNaN(num) ? 1 : num;
  }
  
  // Try to parse as number
  const num = parseInt(str);
  return isNaN(num) ? 1 : num;
}

/**
 * Parse years of operation from string format (e.g., "12+", "5-10", "3")
 * Returns the maximum value or the number itself
 */
function parseYearsOfOperation(yearsStr) {
  if (!yearsStr) return 0;
  
  // Remove spaces and convert to string
  const str = String(yearsStr).trim();
  
  // Handle "12+" or "5+"
  if (str.includes('+')) {
    const num = parseInt(str.replace('+', ''));
    return isNaN(num) ? 0 : num;
  }
  
  // Handle ranges like "5-10"
  if (str.includes('-')) {
    const parts = str.split('-');
    const max = parseInt(parts[1]);
    return isNaN(max) ? 0 : max;
  }
  
  // Try to parse as number
  const num = parseInt(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert category string to number
 * Maps: "caterer" -> 1, "venue" -> 2, "photographer" -> 3, etc.
 */
function mapCategoryToNumber(categoryStr) {
  if (!categoryStr) return 1;
  
  const categoryMap = {
    'caterer': 1,
    'venue': 2,
    'photographer': 3,
    'decorator': 4,
    'makeupartist': 5,
    'djartist': 6
  };
  
  const lower = String(categoryStr).toLowerCase();
  return categoryMap[lower] || 1;
}

/**
 * Create business_details structure from vendor data
 * @param {Object} caterer - Old caterer document
 * @param {Object} vendorData - Vendor data from vendors collection
 * @param {String} serviceId - Capitalized service ID
 */
function createBusinessDetails(caterer, vendorData, serviceId) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Use vendor business details if available, otherwise use defaults
  const vendorBusiness = vendorData?.businessDetails || {};
  
  return {
    service_id: serviceId,
    service_type: 'Caterer',
    category: mapCategoryToNumber(vendorBusiness.category || 'caterer'),
    business_registration_name: vendorBusiness.businessName || caterer.basicDetails?.name || 'Unknown Business',
    gst: vendorBusiness.gstin || null,
    pan: vendorBusiness.panNo || null,
    verification_type: (() => {
      // Use vendor's verificationType if it's valid
      if (vendorBusiness.verificationType && vendorBusiness.verificationType !== '' && vendorBusiness.verificationType !== null) {
        return vendorBusiness.verificationType.toUpperCase();
      }
      // Otherwise, determine from available data
      if (vendorBusiness.panNo && vendorBusiness.panNo !== '') {
        return 'PAN';
      }
      if (vendorBusiness.gstin && vendorBusiness.gstin !== '') {
        return 'GSTIN';
      }
      // Default to PAN if neither is available
      return 'PAN';
    })(),
    team_size: parseTeamSize(vendorBusiness.teamsize),
    years_of_operation: parseYearsOfOperation(vendorBusiness.years),
    business_address: vendorBusiness.businessAddress || caterer.basicDetails?.location?.googleMapsAddress || '',
    landmark: vendorBusiness.landmark || '',
    pincode: vendorBusiness.pinCode || caterer.basicDetails?.location?.pincode || 0,
    operational_cities: vendorBusiness.cities && vendorBusiness.cities.length > 0 
      ? vendorBusiness.cities 
      : (caterer.basicDetails?.serviceAreas || []),
    annual_revenue: vendorBusiness.annualrevenue || null,
    annual_bookings: vendorBusiness.bookingsPerMonth ? vendorBusiness.bookingsPerMonth * 12 : 0, // Convert monthly to annual
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
 * Transform old caterer document to new caterer document
 * @param {Object} oldCaterer - Old caterer document
 * @param {Object} vendorData - Vendor data from vendors collection (optional)
 */
function transformCaterer(oldCaterer, vendorData = null) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Get vendor phone number - use vendor.mobile if available, otherwise use placeholder
  const serviceContactNumber = vendorData?.mobile || '0000000000';

  // Basic details transformation
  const basicDetails = {
    is_completed: oldCaterer.basicDetails?.completed || false,
    point_of_contact: oldCaterer.basicDetails?.name || '',
    service_contact_number: serviceContactNumber, // Fetched from vendor collection
    min_booking_capacity: oldCaterer.basicDetails?.capacity?.ll || 1,
    max_booking_capacity: oldCaterer.basicDetails?.capacity?.ul || 100,
    description: oldCaterer.basicDetails?.description || '',
    cuisine_specialities: oldCaterer.basicDetails?.cuisine_specialities || [],
    regional_specialities: oldCaterer.basicDetails?.regional_specialities || [],
    service_style_offered: oldCaterer.basicDetails?.service_style_offered || [],
    service_location_caterer: {
      service_address: oldCaterer.basicDetails?.location?.googleMapsAddress || '',
      lat: toString(oldCaterer.basicDetails?.location?.lat),
      lon: toString(oldCaterer.basicDetails?.location?.lng),
      service_pincode: oldCaterer.basicDetails?.location?.pincode || undefined,
      google_map_link: oldCaterer.basicDetails?.location?.googleMapsAddress || ''
    }
  };

  // Event details transformation (combines menuDetails, eventDetails, staffAndEquipmentDetails)
  const eventDetails = {
    is_completed: oldCaterer.menuDetails?.completed || 
                  oldCaterer.eventDetails?.completed || 
                  oldCaterer.staffAndEquipmentDetails?.completed || 
                  false,
    event_types_catered: oldCaterer.eventDetails?.event_types_catered || [],
    additional_services_for_any_event: oldCaterer.eventDetails?.additional_services || [],
    staff_provided: oldCaterer.staffAndEquipmentDetails?.staff_provided || [],
    equipment_provided: oldCaterer.staffAndEquipmentDetails?.equipment_provided || [],
    menu: oldCaterer.menuDetails?.menu || [],
    veg_or_nonveg: transformVegNonVeg(oldCaterer.menuDetails?.vegOrNonVeg),
    appetizers: oldCaterer.menuDetails?.appetizers || [],
    main_course: oldCaterer.menuDetails?.main_course || [],
    beverages: oldCaterer.menuDetails?.beverages || [],
    special_dietary_options: oldCaterer.menuDetails?.special_dietary_options || [],
    pre_set_menus: oldCaterer.menuDetails?.pre_set_menus || [],
    menu_customizable: oldCaterer.menuDetails?.customizable || false
  };

  // Additional details transformation
  const additionalDetails = {
    is_completed: oldCaterer.additionalDetails?.completed || false,
    min_booking_period: oldCaterer.additionalDetails?.advance_booking_period?.ll || 1,
    max_booking_period: oldCaterer.additionalDetails?.advance_booking_period?.ul || undefined,
    asset_images: oldCaterer.additionalDetails?.photos || [],
    asset_videos: oldCaterer.additionalDetails?.videos || [],
    is_tasting_session_provided: oldCaterer.additionalDetails?.tasting_sessions || false,
    is_business_license_available: oldCaterer.additionalDetails?.business_licenses || false,
    food_safety_certificates: oldCaterer.additionalDetails?.food_safety_certificates || [],
    prices_starts_from: oldCaterer.additionalDetails?.priceStartingFrom || 0
  };

  // Policies transformation
  const policies = {
    is_completed: oldCaterer.policies?.completed || false,
    cancellation_policy: oldCaterer.policies?.cancellationPolicy || null,
    terms_and_conditions: oldCaterer.policies?.termsAndConditions || null,
    agreement_url: oldCaterer.policies?.agreementUrl || '',
    agreement_signed_at: oldCaterer.policies?.agreementSignedAt || istTime
  };

  // Capitalize IDs to avoid conflicts with existing documents
  const capitalizedServiceId = oldCaterer.id ? oldCaterer.id.toUpperCase() : oldCaterer.id;
  const capitalizedVendorId = oldCaterer.venId ? oldCaterer.venId.toUpperCase() : oldCaterer.venId;

  // Create business details from vendor data
  const businessDetails = createBusinessDetails(oldCaterer, vendorData, capitalizedServiceId);

  // Map bank details from vendor if available
  const bankDetails = (() => {
    if (vendorData?.bankDetails && Array.isArray(vendorData.bankDetails) && vendorData.bankDetails.length > 0) {
      const bank = vendorData.bankDetails[0]; // Use first bank detail
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      
      return {
        vendor_id: capitalizedVendorId,
        service_id: capitalizedServiceId,
        bank_name: bank.bankName || null,
        account_type: null, // Not in old schema
        account_number: bank.accountNo || null,
        ifsc: bank.ifscCode || null,
        beneficiary_id: bank.beneficiaryId || null,
        bank_created_at: istTime,
        bank_updated_at: istTime
      };
    }
    return {}; // Empty default
  })();

  // Create new caterer document
  const newCaterer = {
    id: capitalizedServiceId, // Set id field to satisfy unique index constraint (capitalized)
    service_id: capitalizedServiceId, // Capitalized to avoid conflicts
    vendor_id: capitalizedVendorId, // Capitalized to avoid conflicts
    service_type: 'Caterer',
    is_active: oldCaterer.isVerified || false,
    profile_completion_score: oldCaterer.basicDetails?.profileCompletion || 0,
    service_areas: oldCaterer.basicDetails?.serviceAreas || [],
    bank_details: bankDetails,
    business_details: businessDetails,
    basic_details: basicDetails,
    event_details: eventDetails,
    additional_details: additionalDetails,
    policies: policies,
    caterer_created_at: oldCaterer.createdAt ? toIST(oldCaterer.createdAt) : istTime,
    caterer_updated_at: oldCaterer.updatedAt ? toIST(oldCaterer.updatedAt) : istTime
  };

  return newCaterer;
}

/**
 * Validate transformed caterer document
 */
function validateCaterer(caterer) {
  const errors = [];

  // Required top-level fields
  if (!caterer.service_id) errors.push('service_id is required');
  if (!caterer.vendor_id) errors.push('vendor_id is required');

  // Required basic_details fields
  if (!caterer.basic_details?.point_of_contact) errors.push('basic_details.point_of_contact is required');
  if (!caterer.basic_details?.service_contact_number) errors.push('basic_details.service_contact_number is required');
  if (!caterer.basic_details?.min_booking_capacity) errors.push('basic_details.min_booking_capacity is required');
  if (!caterer.basic_details?.max_booking_capacity) errors.push('basic_details.max_booking_capacity is required');
  if (!caterer.basic_details?.description) errors.push('basic_details.description is required');

  // Required event_details fields
  if (!caterer.event_details?.event_types_catered?.length) errors.push('event_details.event_types_catered is required');
  if (!caterer.event_details?.staff_provided?.length) errors.push('event_details.staff_provided is required');
  if (!caterer.event_details?.veg_or_nonveg) errors.push('event_details.veg_or_nonveg is required');

  // Required additional_details fields
  if (!caterer.additional_details?.min_booking_period) errors.push('additional_details.min_booking_period is required');
  // asset_videos is required but we'll set a placeholder if missing
  if (caterer.additional_details?.prices_starts_from === undefined) errors.push('additional_details.prices_starts_from is required');

  // Required policies fields
  if (!caterer.policies?.agreement_url) errors.push('policies.agreement_url is required');
  if (!caterer.policies?.agreement_signed_at) errors.push('policies.agreement_signed_at is required');

  // Required business_details
  if (!caterer.business_details) errors.push('business_details is required');

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Main migration function
 */
async function migrateCaterers() {
  let sourceClient;
  let destClient;

  try {
    // Connect to source MongoDB (where old data is)
    console.log('Connecting to SOURCE MongoDB (old data)...');
    console.log(`Source URI: ${MONGO_URI_SOURCE.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    sourceClient = new MongoClient(MONGO_URI_SOURCE);
    await sourceClient.connect();
    console.log('✓ Connected to SOURCE MongoDB\n');

    // Connect to destination MongoDB (where new data will be)
    console.log('Connecting to DESTINATION MongoDB (new data)...');
    console.log(`Dest URI: ${MONGO_URI_DEST.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    destClient = new MongoClient(MONGO_URI_DEST);
    await destClient.connect();
    console.log('✓ Connected to DESTINATION MongoDB\n');

    if (DRY_RUN) {
      console.log('⚠ DRY RUN MODE - No data will be modified\n');
    }

    // Extract database name from URI
    const getDbNameFromUri = (uri) => {
      // Match pattern: mongodb+srv://...@host.net/dbname?...
      const match = uri.match(/\.net\/([^?]+)/);
      return match ? match[1] : null;
    };
    
    // Source: read from 'dev' database (where actual data is)
    // Destination: write to 'prod' database (in new MongoDB)
    const sourceDbName = 'dev'; // Data is in 'dev' database
    const destDbName = 'prod'; // Write to 'prod' in destination
    
    console.log(`Source database: '${sourceDbName}' (reading from old data)`);
    console.log(`Destination database: '${destDbName}' (writing to new data)\n`);
    
    // Get source and destination databases
    const sourceDb = sourceClient.db(sourceDbName);
    const destDb = destClient.db(destDbName);
    
    // Source collections (old data)
    const oldCollection = sourceDb.collection('caterers');
    const vendorsCollection = sourceDb.collection('vendors');
    
    // Destination collection (new data)
    const newCollection = destDb.collection('caterers');
    
    // Verify source database has data
    console.log(`Verifying source database '${sourceDbName}'...`);
    const catererCount = await oldCollection.countDocuments();
    console.log(`✓ Found ${catererCount} caterers in '${sourceDbName}.caterers' collection\n`);

    // Get all documents from old collection (or limit if specified)
    if (LIMIT) {
      console.log(`Fetching top ${LIMIT} documents from old caterers collection...`);
    } else {
      console.log(`Fetching ALL documents from old caterers collection...`);
    }
    
    let query = oldCollection.find({}).sort({ createdAt: -1 }); // Get most recent first
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    const oldCaterers = await query.toArray();
    
    console.log(`✓ Found ${oldCaterers.length} caterers to migrate\n`);

    if (oldCaterers.length === 0) {
      console.log('No caterers to migrate. Exiting.');
      return;
    }

    // Statistics
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const migrated = [];

    // Process each caterer
    console.log('Processing caterers...\n');
    
    for (let i = 0; i < oldCaterers.length; i++) {
      const oldCaterer = oldCaterers[i];
      const catererNumber = i + 1;
      
      try {
        console.log(`[${catererNumber}/${oldCaterers.length}] Processing caterer: ${oldCaterer.id || oldCaterer._id}`);
        console.log(`  Name: ${oldCaterer.basicDetails?.name || 'N/A'}`);
        console.log(`  Vendor ID: ${oldCaterer.venId || 'N/A'}`);

        // Skip if essential fields are missing (malformed document)
        if (!oldCaterer.id || !oldCaterer.venId || !oldCaterer.basicDetails) {
          console.log(`  ⚠ Skipping malformed document - missing essential fields (id, venId, or basicDetails)`);
          errorCount++;
          errors.push({
            oldId: oldCaterer._id,
            name: oldCaterer.basicDetails?.name || 'N/A',
            error: 'Malformed document - missing essential fields'
          });
          continue;
        }

        // Capitalize IDs to avoid conflicts with existing documents
        const capitalizedServiceId = oldCaterer.id ? oldCaterer.id.toUpperCase() : oldCaterer.id;
        const capitalizedVendorId = oldCaterer.venId ? oldCaterer.venId.toUpperCase() : oldCaterer.venId;
        
        // Log ID transformation
        console.log(`  ID Transformation: ${oldCaterer.id} → ${capitalizedServiceId}`);
        console.log(`  Vendor ID Transformation: ${oldCaterer.venId} → ${capitalizedVendorId}`);

        // Check if already exists (using capitalized ID)
        const existing = await newCollection.findOne({ service_id: capitalizedServiceId });
        if (existing) {
          console.log(`  ⚠ Already exists in new collection - skipping`);
          continue;
        }

        // Fetch vendor data to get phone number (using original venId, not capitalized)
        let vendorData = null;
        if (oldCaterer.venId) {
          console.log(`  Fetching vendor data for vendor ID: ${oldCaterer.venId}`);
          vendorData = await fetchVendorData(sourceDb, oldCaterer.venId);
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

        // Transform caterer with vendor data
        const newCaterer = transformCaterer(oldCaterer, vendorData);

        // Handle missing required fields with placeholders BEFORE validation
        if (!newCaterer.basic_details.service_contact_number || newCaterer.basic_details.service_contact_number === '0000000000') {
          console.log(`  ⚠ WARNING: service_contact_number is missing or invalid - using placeholder`);
          newCaterer.basic_details.service_contact_number = '0000000000'; // Placeholder
        } else {
          console.log(`  ✓ Using vendor phone number: ${newCaterer.basic_details.service_contact_number}`);
        }

        if (!newCaterer.policies.agreement_url) {
          console.log(`  ⚠ WARNING: agreement_url is missing - setting placeholder`);
          newCaterer.policies.agreement_url = 'https://placeholder.com/agreement';
        }

        // Handle missing asset_videos (required field)
        if (!newCaterer.additional_details.asset_videos || newCaterer.additional_details.asset_videos.length === 0) {
          console.log(`  ⚠ WARNING: asset_videos is missing - setting placeholder`);
          newCaterer.additional_details.asset_videos = ['https://placeholder.com/video.mp4'];
        }

        // Validate after setting placeholders
        validateCaterer(newCaterer);

        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate:`);
          console.log(`    Service ID: ${newCaterer.service_id}`);
          console.log(`    Vendor ID: ${newCaterer.vendor_id}`);
          console.log(`    Is Active: ${newCaterer.is_active}`);
          console.log(`    Profile Completion: ${newCaterer.profile_completion_score}%`);
          console.log(`    Service Areas: ${newCaterer.service_areas.length} areas`);
          console.log(`    Event Types: ${newCaterer.event_details.event_types_catered.length} types`);
          console.log(`    Menu Items: ${newCaterer.event_details.menu.length} items`);
          console.log(`    Videos: ${newCaterer.additional_details.asset_videos.length} videos`);
          console.log(`    Price Starts From: ₹${newCaterer.additional_details.prices_starts_from}`);
        } else {
          // Insert into new collection
          await newCollection.insertOne(newCaterer);
          console.log(`  ✓ Successfully migrated`);
        }

        migrated.push({
          oldId: oldCaterer.id || oldCaterer._id,
          newId: newCaterer.service_id,
          name: oldCaterer.basicDetails?.name
        });

        successCount++;
        console.log(''); // Empty line for readability

      } catch (error) {
        errorCount++;
        const errorInfo = {
          oldId: oldCaterer.id || oldCaterer._id,
          name: oldCaterer.basicDetails?.name,
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
    console.log(`Total caterers processed: ${oldCaterers.length}`);
    console.log(`✓ Successful:            ${successCount}`);
    console.log(`✗ Errors:               ${errorCount}`);
    console.log(`Progress:                ${((successCount / oldCaterers.length) * 100).toFixed(1)}%`);

    if (DRY_RUN) {
      console.log('\n⚠ This was a DRY RUN - No data was actually modified');
    }

    // Print migrated documents
    if (migrated.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('MIGRATED CATERERS:');
      console.log('-'.repeat(60));
      migrated.forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat.name || 'N/A'}`);
        console.log(`   Old ID: ${cat.oldId}`);
        console.log(`   New ID: ${cat.newId}`);
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
migrateCaterers()
  .then(() => {
    console.log('\n✓ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });

