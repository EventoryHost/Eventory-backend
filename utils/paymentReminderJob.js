import CustomerNotification from "../models/customerNotifications.js";
import { Events } from "../models/events.js";

const REMINDER_DAYS_BEFORE = 1; // 1 day before event_end

function getIstDayRangeUtc(daysAhead = 1) {
  const nowUtc = new Date();

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(nowUtc.getTime() + istOffsetMs);

  const year = nowIst.getFullYear();
  const month = nowIst.getMonth();
  const day = nowIst.getDate() + daysAhead;

  const istStart = new Date(year, month, day, 0, 0, 0, 0);
  const istEnd = new Date(year, month, day + 1, 0, 0, 0, 0);

  const fromUtc = new Date(istStart.getTime() - istOffsetMs);
  const toUtc = new Date(istEnd.getTime() - istOffsetMs);

  return { fromUtc, toUtc };
}

export async function runPaymentReminderJob() {
  const now = new Date();

  const { fromUtc, toUtc } = getIstDayRangeUtc(REMINDER_DAYS_BEFORE);

  const events = await Events.find({
    payment_status: "advance_paid",
    payment_method_details: { $size: 1 },
    event_end: { $gte: fromUtc, $lt: toUtc },
    final_amount: { $gt: 0 },
  }).lean();

  for (const ev of events) {
    const remaining = Math.max(
      0,
      (ev.final_amount || 0) - (ev.already_paid_amount || 0),
    );
    if (remaining <= 0) continue;

    const alreadySent = await CustomerNotification.exists({
      customer_id: ev.customer_id,
      event_id: ev.event_id,
      notification_type: "payment_reminder",
    });
    if (alreadySent) continue;

    const checkoutUrl = `/customerbooking/${ev.event_id}`;

    const eventDate = ev.event_start
      ? new Date(ev.event_start).toDateString()
      : "your event date";

    const message = `Your remaining payment of ₹${remaining.toFixed(
      2,
    )} for your event on ${eventDate} is due before the event ends. Please complete the payment.`;

    await CustomerNotification.create({
      customer_id: ev.customer_id,
      event_id: ev.event_id,
      order_id: null,
      quotation_id: ev.quotation_id,
      chat_id: ev.quotation_id,
      notification_type: "payment_reminder",
      message,
      final_amount: remaining,
      checkout_url: checkoutUrl,
      read: false,
    });
  }

  console.log(
    `Payment reminder job ran at ${now.toISOString()}, events processed: ${events.length}`,
    events.map((e) => e.event_id),
  );
}
