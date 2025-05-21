function parseRange(input) {
  const regex = /(\d+)-(\d+)/;
  const match = input.match(regex);

  if (match) {
    return {
      ll: parseInt(match[1], 10),
      ul: parseInt(match[2], 10),
    };
  }

  return null; // Return null if no match is found
}

export default parseRange;
