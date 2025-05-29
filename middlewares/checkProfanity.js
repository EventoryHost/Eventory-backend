import { Filter } from 'bad-words';
const filter = new Filter();

import { customAbusiveWords } from '../constants/bad_words.js';

filter.addWords(...customAbusiveWords);

export const checkPhoneNumber = (req, res, next) => {
    const isAbusive = filter.isProfane(req.content);

    return isAbusive;
}