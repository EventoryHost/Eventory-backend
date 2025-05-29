import { Filter } from 'bad-words';
const filter = new Filter();

import { customAbusiveWords } from '../constants/bad_words.js';

filter.addWords(...customAbusiveWords);

export const checkPhoneNumber = (text) => {
    const isAbusive = filter.isProfane(text);

    return isAbusive;
}