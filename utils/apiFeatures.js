class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    console.log(this.queryString);
  }

  sort() {
    if (this.queryString.sort) {
      if (this.queryString.sort === "lth") {
        this.query = this.query.sort("additionalDetails.priceStartingFrom");
      } else if (this.queryString.sort === "htl") {
        this.query = this.query.sort("-additionalDetails.priceStartingFrom");
      } else if (this.queryString.sort === "whats_new") {
        this.query = this.query.sort({ _id: -1 });
      }
    } else {
      this.query = this.query.sort({ _id: -1 });
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      console.log(this.queryString.fields);
      const fields = this.queryString.fields.split(",").join(" ");
      console.log(fields);
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    if (this.queryString.page) {
      const page = this.queryString.page * 1 || 1; //string => int
      const limit = this.queryString.limit * 1 || 1; //string => int
      this.query.skip((page - 1) * limit).limit(limit); //convert into blocks by limit and then return each page seperately
    }
    return this;
  }
}

export default APIFeatures;
