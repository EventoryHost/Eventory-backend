import Booking from "../models/booking"; // adjust the import path if needed

export const checkBookingsInRange = async (startDate, endDate, idList) => {
  const availabilityMap = idList.reduce((acc, id) => {
    acc[id] = false;
    return acc;
  }, {});

  try {
    const overlappingBookings = await Booking.find({
      serviceId: { $in: idList },
      status: "pending",
      $or: [
        {
          startDate: { $lt: new Date(endDate) },
          endDate: { $gt: new Date(startDate) },
        },
      ],
    });

    for (const booking of overlappingBookings) {
      if (
        booking.serviceId &&
        availabilityMap.hasOwnProperty(booking.serviceId)
      ) {
        availabilityMap[booking.serviceId] = true;
      }
    }

    return idList.map((id) => availabilityMap[id]);
  } catch (error) {
    console.error("Error checking bookings in range:", error);
    throw error;
  }
};
