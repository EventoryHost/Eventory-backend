const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the caterer schema
const catererSchema = new Schema({
  basicInfo: {
    catererName: { type: String, required: true },
    businessAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      landmark: { type: String }
    }
  },
  contactInfo: {
    phoneNumber: { type: String, required: true },
    emailAddress: { type: String, required: true },
    website: { type: String },
    contactPerson: {
      name: { type: String, required: true },
      position: { type: String }
    }
  },
  cuisineMenuDetails: {
    cuisineSpecialties: {
      northIndian: { type: Boolean },
      southIndian: { type: Boolean },
      eastIndian: { type: Boolean },
      westIndian: { type: Boolean },
      regionalSpecialties: { type: [String] } // e.g., Gujarati, Rajasthani, Bengali
    },
    menuOptions: {
      appetisers: { type: [String] },
      mainCourses: { type: [String] },
      desserts: { type: [String] },
      beverages: { type: [String] },
      specialDietaryOptions: { type: [String] } // e.g., vegan, vegetarian, gluten-free
    },
    menuCustomization: {
      customizableMenus: { type: Boolean },
      preSetMenus: { type: Boolean }
    },
    servingStyles: {
      buffet: { type: Boolean },
      platedMeals: { type: Boolean },
      familyStyle: { type: Boolean },
      foodStations: { type: Boolean }
    }
  },
  servicesProvided: {
    eventTypesCatered: {
      weddings: { type: Boolean },
      corporateEvents: { type: Boolean },
      birthdayParties: { type: Boolean },
      festivals: { type: Boolean },
      privateParties: { type: Boolean }
    },
    cateringEquipment: {
      utensils: { type: Boolean },
      chafingDishes: { type: Boolean },
      servingWare: { type: Boolean },
      tableware: { type: Boolean }
    },
    onSiteServices: {
      chefs: { type: Boolean },
      servers: { type: Boolean },
      bartenders: { type: Boolean }
    },
    setupCleanup: {
      setupServices: { type: Boolean },
      cleanupServices: { type: Boolean }
    }
  },
  bookingPaymentDetails: {
    bookingPolicy: { type: String },
    advanceBookingPeriod: { type: Number },
    minimumOrderRequirements: { type: Number },
    paymentTerms: { type: String },
    depositRequired: { type: Boolean },
    cancellationPolicy: { type: String }
  },
  pricing: {
    perPlateRates: { type: Number },
    packageDeals: { type: [String] }
  },
  additionalInfo: {
    tastingSessions: {
      availability: { type: Boolean }
    },
    certificatesLicenses: {
      foodSafetyCertificates: { type: [String] }, // URLs or paths to certificates
      businessLicenses: { type: [String] }
    }
  },
  reviewsRatings: {
    reviews: [{ type: String }], // or more complex structure
    ratings: [{ type: Number }] // or more complex structure
  },
  photosVideos: {
    images: [{ type: String }], // URLs of images
    videos: [{ type: String }] // URLs of videos
  }
});

// Create the model from the schema and export it
const Caterer = mongoose.model('Caterer', catererSchema);

module.exports = Caterer;
