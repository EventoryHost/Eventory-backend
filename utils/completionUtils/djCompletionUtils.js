import DjArtist from "../../models2/djArtist.js";

export const checkDjArtistProfileCompletion = async (artistId) => { 
    
    try {
        // New schema uses service_id instead of id
        const artist = await DjArtist.findOne({ service_id: artistId });
        
        if (!artist) {
            throw new Error("DJ Artist not found");
        }
        
        // Check if basic details are complete (new schema: basic_details with snake_case)
        const basicDetailsComplete =
            !!artist.basic_details?.point_of_contact &&
            !!artist.basic_details?.service_contact_number &&
            !!artist.basic_details?.description &&
            !!artist.basic_details?.service_location_dj_artist?.service_address;

        console.log(`Basic details check: ------- ${basicDetailsComplete}`);
        await DjArtist.findOneAndUpdate(
            { service_id: artistId },
            {
                "basic_details.is_completed": basicDetailsComplete,
            },
        );

        // Check if service details are complete (new schema: service_details with snake_case)
        const serviceDetailsComplete =
            Array.isArray(artist.service_details?.event_types_dj) &&
            artist.service_details.event_types_dj.length > 0 &&
            Array.isArray(artist.service_details?.regional_specializations) &&
            artist.service_details.regional_specializations.length > 0 &&
            Array.isArray(artist.service_details?.services_offered) &&
            artist.service_details.services_offered.length > 0;

        console.log(`Service details check: ----- ${serviceDetailsComplete}`);
        await DjArtist.findOneAndUpdate(
            { service_id: artistId },
            { "service_details.is_completed": serviceDetailsComplete},
        );

        // Check if additional details are complete (new schema: additional_details with snake_case)
        const additionalDetailsComplete =
            Array.isArray(artist.additional_details?.asset_images) &&
            artist.additional_details.asset_images.length > 0 &&
            Array.isArray(artist.additional_details?.asset_videos) &&
            artist.additional_details.asset_videos.length > 0 &&
            !!artist.additional_details?.prices_starts_from;

        console.log(`Additional details check: ----- ${additionalDetailsComplete}`);
        await DjArtist.findOneAndUpdate(
            { service_id: artistId },
            { "additional_details.is_completed": additionalDetailsComplete },
        );

        // Check if policies are complete (new schema: policies with snake_case)
        const policiesComplete =
            Array.isArray(artist.policies?.terms_and_conditions) &&
            artist.policies.terms_and_conditions.length > 0 &&
            Array.isArray(artist.policies?.cancellation_policy) &&
            artist.policies.cancellation_policy.length > 0;
            
        console.log(`Policies check: ----- ${policiesComplete}`);
        await DjArtist.findOneAndUpdate(
            { service_id: artistId },
            { "policies.is_completed": policiesComplete },
        );
        
        return true;
    } catch (error) {
        console.error("Error checking Dj Artist profile completion:", error);
        throw error;
    }
};