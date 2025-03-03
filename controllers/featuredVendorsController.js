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

  const [caterer, decorator, venue, prop_rental, pav, makeupArtist] =
    await Promise.all([
      getCaterer(),
      getDecorator(),
      getVenue(),
      getPropRental(),
      getPav(),
      getMakeupArtist(),
    ]);

  // caterer
  featuredVendors.push({
    id: caterer.id,
    category_name: "Caterer",
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
    id: decorator.id,
    category_name: "Decorator",
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
    id: venue.id,
    category_name: "Venue Provider",
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
    id: prop_rental.id,
    category_name: "Prop Rental",
    name: prop_rental.basicDetails.managerName || "Krishna Vendors",
    rating: prop_rental.reviews[0]?.rating || "4.5",
    price: prop_rental.additionalDetails.priceStartingFrom || "4000",
    category: ["Property Rental"],
    img:
      prop_rental.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // photography and videography
  featuredVendors.push({
    id: pav.id,
    category_name: "Photographers & Videographers",
    name: pav.basicDetails.managerName || "Krishna Vendors",
    rating: pav.reviews[0]?.rating || "4.5",
    price: pav.additionalDetails.priceStartingFrom || "4000",
    category: ["Photography", "Videography"],
    img:
      pav.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  // makeup artist
  featuredVendors.push({
    id: makeupArtist.id,
    category_name: "Makeup Artist",
    name: makeupArtist.basicDetails.name || "Krishna Vendors",
    rating: "4.7",
    price: makeupArtist.additionalDetails.priceStarts || "4000",
    category: ["Makeup Artist"],
    img:
      makeupArtist.additionalDetails.photos[0] ||
      "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
  });

  res.status(200).json(featuredVendors);
}

async function getCaterer() {
  try {
    const caterer = await Caterer.findOne({});
    return caterer;
  } catch (e) {
    console.err(e);
  }
}

async function getDecorator() {
  try {
    const decorator = await Decorator.findOne({});
    return decorator;
  } catch (e) {
    console.err(e);
  }
}

async function getVenue() {
  try {
    const venue = await Venue.findOne({});
    return venue;
  } catch (e) {
    console.err(e);
  }
}

async function getPropRental() {
  try {
    const propRental = await PropRental.findOne({});
    return propRental;
  } catch (e) {
    console.err(e);
  }
}

async function getPav() {
  try {
    const pav = await Photographer.findOne({});
    return pav;
  } catch (e) {
    console.err(e);
  }
}

async function getMakeupArtist() {
  try {
    const makeupArtist = await MakeupArtist.findOne({});
    return makeupArtist;
  } catch (e) {
    console.err(e);
  }
}

export { getFeaturedVendors };
