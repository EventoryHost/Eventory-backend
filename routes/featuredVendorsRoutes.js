import { Router } from "express";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import { Venue } from "../models/venue.js";
import PropRental from "../models/props.js";
import Photographer from "../models/photographers.js";
import MakeupArtist from "../models/makeupArtists.js";
import DjArtist from "../models/djArtist.js";

const router = Router();

function getFeaturedVendors(req, res) {
  const featuredVendors = {
    name: "Krishna Vendors",
    rating: "4.5",
    price: "4000",
    category: ["Wedding cakes", "Western suburbs"],
    img: "https://eventory-web-prod.s3.ap-south-1.amazonaws.com/assets/landing_page/featured_images/card_01.png",
  };
  res.status(200).json(featuredVendors);
}

async function getCaterer(req, res) {
  try {
    const caterer = await Caterer.findOne({});
    res.status(200).json(caterer);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getDecorator(req, res) {
  try {
    const decorator = await Decorator.findOne({});
    res.status(200).json(decorator);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getVenue(req, res) {
  try {
    const venue = await Venue.findOne({});
    console.log(venue);
    res.status(200).json(venue);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getPropRental(req, res) {
  try {
    const propRental = await PropRental.findOne({});
    console.log(propRental);
    res.status(200).json(propRental);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getPav(req, res) {
  try {
    const pav = await Photographer.findOne({});
    console.log(pav);
    res.status(200).json(pav);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getMakeupArtist(req, res) {
  try {
    const makeupArtist = await MakeupArtist.findOne({});
    console.log(makeupArtist);
    res.status(200).json(makeupArtist);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getDjArtist(req, res) {
  try {
    const djArtist = await DjArtist.findOne({});
    console.log(djArtist);
    res.status(200).json(djArtist);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

router.get("/featured-vendors", getFeaturedVendors);

export default router;
