import { Caterer } from "../models2/caterer.js";
import { Decorator }  from "../models2/decorator.js";
import VenueProvider from "../models2/venueProvider.js";
import PropRental from "../models/props.js";
import PhotographerVideographer from "../models2/photographerVideographer.js";
import MakeupArtist from "../models2/makeupArtist.js";

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
  if (caterer)
    featuredVendors.push({
      vendor_id: caterer.vendor_id,
      service_id: caterer.service_id,
      category_name: "Caterer",
      name: caterer.business_details.business_registration_name || "Krishna Vendors",
      rating: caterer.rating || "4.5",
      price: caterer.additional_details.prices_starts_from || "4000",
      category: caterer.service_type || ["Caterer"],
      img:
        caterer.additional_details.asset_images[0] ||
        "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
    });

  // decorator
  if (decorator)
    featuredVendors.push({
      vendor_id: decorator.vendor_id,
      service_id: decorator.service_id,
      category_name: "Decorator",
      name: decorator.business_details.business_registration_name  || "Krishna Vendors",
      rating: decorator.rating || "4.5",
      price: decorator.additional_details.prices_starts_from  || "4000",
      category: decorator.service_type || ["Decorator"],
      img:
        decorator.additional_details.asset_images[0] ||
        "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
    });

  // venue
  if (venue)
    featuredVendors.push({
      vendor_id: venue.vendor_id,
      service_id: venue.service_id,
      category_name: "Venue Provider",
      name: venue.business_details.business_registration_name || "Krishna Vendors",
      rating: venue.rating || "4.5",
      price: venue.additional_details.prices_starts_from || "4000",
      category: venue.service_type || ["Venue"],
      img:
        venue.additional_details.asset_images[0] ||
        "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
    });

  // prop rentals
  if (prop_rental)
    featuredVendors.push({
      vendor_id: prop_rental.vendor_id,
      service_id: prop_rental.service_id,
      category_name: "Prop Rental",
      name: prop_rental.business_details.business_registration_name || "Krishna Vendors",
      rating: prop_rental.rating || "4.5",
      price: prop_rental.additional_details.prices_starts_from || "4000",
      category: prop_rental.service_type || ["Property Rental"],
      img:
        prop_rental.additional_details.asset_images[0] ||
        "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
    });

  // photography and videography
  if (pav)
    featuredVendors.push({
      vendor_id: pav.vendor_id,
      service_id: pav.service_id,
      category_name: "Photographers & Videographers",
      name: pav.business_details.business_registration_name || "Krishna Vendors",
      rating: pav.rating || "4.5",
      price: pav.additional_details.prices_starts_from || "4000",
      category: pav.service_type || ["Photography", "Videography"],
      img:
        pav.additional_details.asset_images[0] ||
        "https://d5b8uhuzdzhj3.cloudfront.net/assets/landing_page/featured_images/card_01.png",
    });

  // makeup artist
  if (makeupArtist)
    featuredVendors.push({
      vendor_id: makeupArtist.vendor_id,
      service_id: makeupArtist.service_id,
      category_name: "Makeup Artist",
      name: makeupArtist.business_details.business_registration_name || "Krishna Vendors",
      rating: "4.7",
      price: makeupArtist.additional_details.prices_starts_from || "4000",
      category: makeupArtist.service_type || ["Makeup Artist"],
      img:
        makeupArtist.additional_details.asset_images[0] ||
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
    const venue = await VenueProvider.findOne({});
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
    const pav = await PhotographerVideographer.findOne({});
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
