// import mongoose from 'mongoose';
// import { Coupon } from './models/coupon.js';
// const MONGO_URL = 'mongodb+srv://eventorycareers:C%40reersEventory1234@eventory.0aghroh.mongodb.net/dev?retryWrites=true&w=majority&appName=Eventory';


// const seedCoupons = async () => {
//   try {
//     // Connect to MongoDB
//     console.log('Connecting to MongoDB...');
//     await mongoose.connect(MONGO_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected successfully!');

//     // Clear existing coupons
//     console.log('Clearing existing coupons...');
//     await Coupon.deleteMany({});

//     // Insert your coupons
//     const coupons = [
//       { code: 'EVTYSALES100', team: 'Sales', discount: 100 },
//       { code: 'EVTYSALES50', team: 'Sales', discount: 50 },
//       { code: 'EVTYSALES25', team: 'Sales', discount: 25 },
//       { code: 'EVTYSMM100', team: 'Social Media', discount: 100 },
//       { code: 'EVTYSMM50', team: 'Social Media', discount: 50 },
//       { code: 'EVTYSMM25', team: 'Social Media', discount: 25 },
//       { code: 'EVTYEMONB100', team: 'Event', discount: 100 },
//       { code: 'EVTYEMONB50', team: 'Event', discount: 50 },
//       { code: 'EVTYEMONB25', team: 'Event', discount: 25 }
//     ];

//     console.log('Inserting new coupons...');
//     await Coupon.insertMany(coupons);
//     console.log(`${coupons.length} coupons seeded successfully!`);
    
//     // Display inserted coupons
//     console.log('\nInserted Coupons:');
//     coupons.forEach(coupon => {
//       console.log(`- ${coupon.code}: ${coupon.discount}% (${coupon.team})`);
//     });

//   } catch (error) {
//     console.error('Error seeding coupons:', error);
//   } finally {
//     // Close the database connection
//     await mongoose.connection.close();
//     console.log('Database connection closed.');
//     process.exit(0);
//   }
// };


// seedCoupons().catch(error => {
//   console.error('Unexpected error:', error);
// });

// export default seedCoupons;
