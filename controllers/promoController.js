import { Promotion } from "../models/promo.js";
import APIFeatures from "../utils/apiFeatures.js";

const getAllPromotions = async (req, res) => {
  try {
    const features = new APIFeatures(Promotion.find(), req.query)
      .sort()
      .limitFields()
      .paginate();

    const promotions = await features.query.lean();

    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const enrichedPromotions = promotions.map((promo) => {
      const lastSentDate = promo.lastSentDate
        ? new Date(promo.lastSentDate)
        : null;
      const canSend = promo.canSend?.value;
      const canSendUpdated = promo.canSend?.updatedAt;
      const callReq = promo.callRequest?.value;
      const callReqUpdated = promo.callRequest?.updatedAt;
      const joinComm = promo.reqToJoinCommunity?.value;
      const joinCommUpdated = promo.reqToJoinCommunity?.updatedAt;

      let status = "Active & Eligible";

      if (!canSend) {
        status = `Vendor has stopped the promotions on ${formatDate(canSendUpdated)}.`;
      } else if (callReq && joinComm) {
        status = `Promotional message has already been sent on ${formatDate(lastSentDate)} and vendor has requested for 1:1 call on ${formatDate(callReqUpdated)} and has requested to join the community on ${formatDate(joinCommUpdated)}.`;
      } else if (callReq && !joinComm) {
        status = `Promotional message has already been sent on ${formatDate(lastSentDate)} and vendor has requested for 1:1 call on ${formatDate(callReqUpdated)}.`;
      } else if (!callReq && joinComm) {
        status = `Promotional message has already been sent on ${formatDate(lastSentDate)} and vendor has requested to join the community on ${formatDate(joinCommUpdated)}.`;
      } else if (lastSentDate && lastSentDate > sixtyDaysAgo) {
        status = `Promotional message has already been sent on ${formatDate(lastSentDate)}.`;
      }

      return {
        ...promo,
        status,
      };
    });

    res.status(200).json({
      status: "success",
      results: enrichedPromotions.length,
      data: enrichedPromotions,
    });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch promotions." });
  }
};

const formatDate = (date) => {
  return date
    ? new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";
};

export { getAllPromotions };
