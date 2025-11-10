// utils/serviceMapper.js

import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import Photographer from "../models2/photographerVideographer.js";
import PropRental from "../models/props.js";
import VenueProvider from "../models2/venueProvider.js";
import MakeupArtist from "../models2/makeupArtist.js";
import DjArtist from "../models2/djArtist.js";

const serviceModelMap = {
    'CAT': { model: Caterer, name: 'Caterer' },
    'DEC': { model: Decorator, name: 'Decorator' },
    'PAV': { model: Photographer, name: 'Photographer' },
    'VNP': { model: VenueProvider, name: 'Venue Provider' },
    'MAK': { model: MakeupArtist, name: 'Makeup Artist' },
    'MKA': { model: MakeupArtist, name: 'Makeup Artist' },
    'DJS': { model: DjArtist, name: 'DJ Artist' },
};

export const getServiceModel = (serviceId) => {
    // Get the first three letters of the service ID
    const prefix = serviceId.substring(0, 3).toUpperCase();
    return serviceModelMap[prefix] || { model: null, name: '' };
};