import DjArtist from "../../models/djArtist";

export const checkDjArtistProfileCompletion = async (artistId) => { 
    
    try {
        const artist = await DjArtist.findOne({ id: artistId });
        
        if (!artist) {
            throw new Error("Dj Artist not found");
        }
        
        // Check if basic details are complete
        const basicDetailsComplete =
            artist.basicDetails.name &&
            artist.basicDetails.contact &&
            artist.basicDetails.description ;

        console.log(`Basic details check: ------- ${basicDetailsComplete}`);
        await DjArtist.findOneAndUpdate(
            { id: artistId },
            {
                "basicDetails.completed": basicDetailsComplete,
            },
        );


        // Check if service details are complete
        const serviceDetailsComplete =
        artist.serviceDetails.eventTypes.length > 0 &&
        artist.serviceDetails.regionalSpecializations.length > 0 &&
        artist.serviceDetails.servicesOffered.length > 0 &&
        artist.serviceDetails.musicGenres.length > 0;

        console.log(`Service details check: ----- ${serviceDetailsComplete}`);
        await DjArtist.findOneAndUpdate(
            { id: artistId },
            { "serviceDetails.completed": serviceDetailsComplete},
        );

        // Check if additional details are complete
        const additionalDetailsComplete =
            artist.additionalDetails.photos.length > 0 &&
            artist.additionalDetails.videos.length > 0 &&
            artist.additionalDetails.websiteUrl !=null &&
            artist.additionalDetails.instagramUrl !=null &&
            artist.additionalDetails.priceStarts != null &&
            artist.additionalDetails.testimonials !=null &&
            artist.additionalDetails.awards !=null;

        console.log(`Additional details check: ----- ${additionalDetailsComplete}`);
        await DjArtist.findOneAndUpdate(
            { id: artistId },
            { "additionalDetails.completed": additionalDetailsComplete },
        );

        // Check if policies are complete
        const policiesComplete =
            artist.policies.termsAndConditions.length > 0 &&
            artist.policies.cancellationPolicy.length > 0;
            
        console.log(`Policies check: ----- ${policiesComplete}`);
        await DjArtist.findOneAndUpdate(
            { id: artistId },
            { "policies.completed": policiesComplete },
        );
        
        return true;
    } catch (error) {
        console.error("Error checking Dj Artist profile completion:", error);
        throw error;
    }
};