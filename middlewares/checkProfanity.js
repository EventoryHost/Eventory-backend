import { Filter } from "bad-words";
const filter = new Filter();

import { customAbusiveWords } from "../constants/bad_words.js";

filter.addWords(...customAbusiveWords);

// Rename the function to match its purpose
export const checkProfanity = (text) => {
  if (!text || typeof text !== "string") return false;

  try {
    const isAbusive = filter.isProfane(text);
    return isAbusive;
  } catch (error) {
    console.error("Error checking for profanity:", error);
    return false; // In case of error, let the message through
  }
};
