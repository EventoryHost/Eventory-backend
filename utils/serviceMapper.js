// utils/serviceMapper.js

import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decorator.js";
import Photographer from "../models/photographerVideographer.js";
import VenueProvider from "../models/venueProvider.js";
import MakeupArtist from "../models/makeupArtist.js";
import DjArtist from "../models/djArtist.js";

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