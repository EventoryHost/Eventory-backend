const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const marriageHallSchema = new Schema({
  basicInfo: {
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    landmark: { type: String }
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
  venueDetails: {
    capacity: {
      seating: { type: Number, required: true },
      floating: { type: Number, required: true }
    },
    hallSize: {
      squareFootage: { type: Number },
      dimensions: { type: String }
    },
    numberOfHalls: { type: Number },
    multipleHallsAvailable: { type: Boolean },
    typeOfVenue: {
      indoor: { type: Boolean },
      outdoor: { type: Boolean },
      combination: { type: Boolean }
    },
    layoutOptions: {
      banquet: { type: Boolean },
      theater: { type: Boolean },
      uShape: { type: Boolean },
      otherConfigurations: { type: String }
    }
  },
  amenitiesFacilities: {
    airConditioning: { type: Boolean },
    powerBackup: { type: Boolean },
    parking: {
      available: { type: Boolean },
      numberOfSpaces: { type: Number },
      valetService: { type: Boolean }
    },
    restrooms: {
      numberOfRestrooms: { type: Number },
      handicapAccessibility: { type: Boolean }
    },
    dressingRooms: {
      forBride: { type: Boolean },
      forGroom: { type: Boolean }
    },
    kitchenFacilities: { type: Boolean },
    audioVisualEquipment: {
      soundSystem: { type: Boolean },
      projector: { type: Boolean },
      microphones: { type: Boolean }
    },
    wiFiAvailability: { type: Boolean }
  },
  servicesProvided: {
    cateringServices: {
      inHouseCatering: { type: Boolean },
      outsideCateringAllowed: { type: Boolean }
    },
    decorationServices: {
      inHouseDecorator: { type: Boolean },
      outsideDecoratorAllowed: { type: Boolean }
    },
    djEntertainmentServices: {
      inHouseDJ: { type: Boolean },
      outsideDJAllowed: { type: Boolean }
    },
    securityServices: { type: Boolean },
    cleaningMaintenance: { type: Boolean }
  },
  bookingPaymentDetails: {
    availabilityCalendar: { type: String }, // or use a more complex type if needed
    bookingPolicy: { type: String },
    advanceBookingPeriod: { type: Number },
    paymentTerms: { type: String },
    paymentMethodsAccepted: { type: [String] },
    depositRequired: { type: Boolean },
    cancellationPolicy: { type: String }
  },
  additionalInfo: {
    pricing: {
      rentalRates: { type: Number },
      packagesAvailable: { type: String }
    },
    specialFeatures: {
      scenicViews: { type: Boolean },
      historicSignificance: { type: Boolean }
    },
    restrictions: {
      noiseRestrictions: { type: Boolean },
      alcoholPolicy: { type: String }
    }
  },
  reviewsRatings: {
    reviews: [{ type: String }], // or more complex structure
    ratings: [{ type: Number }] // or more complex structure
  },
  photosVideos: {
    images: [{ type: String }], // URLs of images
    virtualTour: { type: String } // URL of virtual tour
  }
});

// Create the model from the schema and export it
const MarriageHall = mongoose.model('MarriageHall', marriageHallSchema);

module.exports = MarriageHall;
