import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import { Venue } from "../models/venue.js";
import PropRental from "../models/props.js";
import Photographer from "../models/photographers.js";
import MakeupArtist from "../models/makeupArtists.js";

// Schema of featuredVendors
// const featuredVendors = {
//   name: "Krishna Vendors",
//   rating: "4.5",
//   price: "4000",
//   category: ["Wedding cakes", "Western suburbs"],
//   img: "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
// };
async function getFeaturedVendors(req, res) {
  var featuredVendors = [];

  const [caterer, decorator, venue, prop_rental, pav] = await Promise.all([
    getCaterer(),
    getDecorator(),
    getVenue(),
    getPropRental(),
    getPav(),
  ]);

  // caterer
  featuredVendors.push({
    name: caterer.basicDetails.name || "Krishna Vendors",
    rating: caterer.reviews[0]?.rating || "4.5",
    price: caterer.additionalDetails.priceStartingFrom || "4000",
    category: ["Caterer"],
    img:
      caterer.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // decorator
  featuredVendors.push({
    name: decorator.basicDetails.name || "Krishna Vendors",
    rating: decorator.reviews[0]?.rating || "4.5",
    price: decorator.additionalDetails.priceStartingFrom || "4000",
    category: ["Decorator"],
    img:
      decorator.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // venue
  featuredVendors.push({
    name: venue.basicDetails.name || "Krishna Vendors",
    rating: venue.policies.reviews[0]?.rating || "4.5",
    price: venue.additionalDetails.priceStartingFrom || "4000",
    category: ["Venue"],
    img:
      venue.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // prop rentals
  featuredVendors.push({
    name: prop_rental.basicDetails.managerName || "Krishna Vendors",
    rating: prop_rental.reviews[0]?.rating || "4.5",
    price: prop_rental.additionalDetails.priceStartingFrom || "4000",
    category: ["Property Rental"],
    img:
      prop_rental.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // prop rentals
  featuredVendors.push({
    name: pav.basicDetails.managerName || "Krishna Vendors",
    rating: pav.reviews[0]?.rating || "4.5",
    price: pav.additionalDetails.priceStartingFrom || "4000",
    category: ["Photography", "Videography"],
    img:
      pav.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // temporary duplicating prop rentals
  // TODO: map to makeupArtist as below
  featuredVendors.push(featuredVendors[featuredVendors.length - 1]);

  // // makeup artist
  // const makeupArtist = await getMakeupArtist();
  // featuredVendors.push({
  //   name: makeupArtist.basicDetails.managerName || "Krishna Vendors",
  //   rating: makeupArtist.reviews[0]?.rating || "4.5",
  //   price: makeupArtist.additionalDetails.priceStartingFrom || "4000",
  //   category: ["Wedding cakes", "Western suburbs"],
  //   img:
  //     makeupArtist.additionalDetails.photos[0] ||
  //     "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  // });

  res.status(200).json(featuredVendors);
}

async function getCaterer() {
  try {
    const caterer = await Caterer.findOne({});
    return caterer;
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getDecorator() {
  try {
    const decorator = await Decorator.findOne({});
    return decorator;
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getVenue() {
  try {
    const venue = await Venue.findOne({});
    return venue;
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getPropRental() {
  try {
    const propRental = await PropRental.findOne({});
    return propRental;
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getPav() {
  try {
    const pav = await Photographer.findOne({});
    return pav;
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getMakeupArtist() {
  try {
    const makeupArtist = await MakeupArtist.findOne({});
    return makeupArtist;
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export { getFeaturedVendors };
