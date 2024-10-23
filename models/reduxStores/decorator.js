import mongoose from "mongoose";

const DecoratorSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true },
    businessName: { type: String },
    teamsizelist: { type: String },
    durationlist: { type: String },
    typeOfevents: { type: [String] },
    weddingEvents: { type: [String] },
    corporateEvents: { type: [String] },
    seasonalEvents: { type: [String] },
    culturalEvents: { type: [String] },
    themesOffered: { type: [String] },
    propthemesOffered: { type: Boolean },
    adobtThemes: { type: Boolean },
    colorschmes: { type: Boolean },
    customizationsThemes: { type: Boolean },
    customDesignProcess: { type: String },
    themesElements: { type: [String] },
    themephotos: { type: [String] },
    themevideos: { type: [String] },
    photos: { type: [String] },
    videos: { type: [String] },
    clientTestimonials: { type: String },
    Recongnition_awards: { type: String },
    intstagramurl: { type: String },
    websiteurl: { type: String },
    revisionforinitialthemeproposal: { type: Boolean },
    writtenthemeproposalafterconsultaion: { type: Boolean },
    advbookingperiod: { type: String },
    termsAndConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    ratings_reviews: { type: [String] },
    portfolio: { type: [String] },
    certificates_awards: { type: [String] },
  },
  { timestamps: true },
);

const DecoratorModel = mongoose.model("ReduxDecorator", DecoratorSchema);

export { DecoratorModel };
