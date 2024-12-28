const calculateProfileCompletion = (data) => {
  let totalFields = 0;
  let completedFields = 0;

  // Count total fields in all sections
  totalFields += 7; // basicDetails
  totalFields += 3; // menuDetails
  totalFields += 2; // eventDetails
  totalFields += 2; // staffAndEquipmentDetails
  totalFields += 6; // additionalDetails
  totalFields += 3; // policies

  // Check if each field is populated, with null/undefined checks
  if (data.basicDetails && data.basicDetails.name) completedFields++;
  if (data.basicDetails && data.basicDetails.managerName) completedFields++;
  if (data.basicDetails && data.basicDetails.capacity) completedFields++;
  if (data.basicDetails && data.basicDetails.description) completedFields++;

  if (data.menuDetails && data.menuDetails.vegOrNonVeg) completedFields++;
  if (
    data.menuDetails &&
    data.menuDetails.pre_set_menus &&
    data.menuDetails.pre_set_menus.length > 0
  )
    completedFields++;
  if (data.menuDetails && data.menuDetails.customizable) completedFields++;

  if (
    data.eventDetails &&
    data.eventDetails.event_types_catered &&
    data.eventDetails.event_types_catered.length > 0
  )
    completedFields++;
  if (
    data.eventDetails &&
    data.eventDetails.additional_services &&
    data.eventDetails.additional_services.length > 0
  )
    completedFields++;

  if (
    data.staffAndEquipmentDetails &&
    data.staffAndEquipmentDetails.staff_provided &&
    data.staffAndEquipmentDetails.staff_provided.length > 0
  )
    completedFields++;
  if (
    data.staffAndEquipmentDetails &&
    data.staffAndEquipmentDetails.equipment_provided &&
    data.staffAndEquipmentDetails.equipment_provided.length > 0
  )
    completedFields++;

  if (
    data.additionalDetails &&
    data.additionalDetails.minimum_order_requirements
  )
    completedFields++;
  if (data.additionalDetails && data.additionalDetails.advance_booking_period)
    completedFields++;
  if (data.additionalDetails && data.additionalDetails.priceStartingFrom)
    completedFields++;

  if (data.policies && data.policies.cancellation_policy) completedFields++;
  if (data.policies && data.policies.terms_and_conditions) completedFields++;
  if (data.policies && data.policies.client_testimonials) completedFields++;

  // Calculate profile completion percentage
  return Math.round((completedFields / totalFields) * 100);
};

export default calculateProfileCompletion;
