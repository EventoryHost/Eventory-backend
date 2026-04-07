import Message from "../models/message2.js";
import CustomerEnquiry from "../models/customerEnquiry.js";
import Chat from "../models/chats.js";
import generateUniqueId from "../utils/generateId.js";
import AnonCustomerOrder from "../models/anonCustomerOrder.js";
import CustomerNotification from "../models/customerNotifications.js";

export const handleInteractiveMessage = async (chatId, socketSenderId, messageContent, io) => {
    try {
        console.log(`[DEBUG] handleInteractiveMessage entry: chatId=${chatId}, content="${messageContent}"`);
        
        const chat = await Chat.findOne({ chat_id: chatId });
        if (!chat) return;

        let userId = chat.customer_id || chat.anon_customer_id;
        let isCustomer = !!chat.customer_id;
        let enquiry;

        let enquiryQuery = { 
            status: { $nin: ["CLOSED", "CONVERTED"] } 
        };
        if (isCustomer) enquiryQuery.customer_id = userId;
        else enquiryQuery.anon_customer_id = userId;

        enquiry = await CustomerEnquiry.findOne(enquiryQuery).sort({ created_at: -1 });

        let messageStr = "";
        if (typeof messageContent === "string") {
            messageStr = messageContent;
        } else if (messageContent !== null && messageContent !== undefined) {
            messageStr = typeof messageContent === "object" ? JSON.stringify(messageContent) : String(messageContent);
        }
        
        // 1. HELPERS
        const sendMessage = async (content, type = "text", options = null, action = null, delay = 400) => {
            return new Promise((resolve) => {
                setTimeout(async () => {
                    try {
                        const chat = await Chat.findOne({ chat_id: chatId });
                        if (!chat) {
                            console.error(`[CHAT_SERVICE] Chat not found for ID: ${chatId}`);
                            resolve(null);
                            return;
                        }

                        const msg = await Message.create({
                            chat_id: chatId,
                            chat_type: chat.chat_type,
                            sender: "admin",
                            sender_id: "admin",
                            message_content: content,
                            message_type: type,
                            options: options,
                            action: action
                        });

                        console.log(`[CHAT_SERVICE] Message created: ${msg._id} (${type}) for room ${chatId}`);

                        if (io) {
                            // DUAL-EMIT to ensure delivery to both potential rooms
                            const roomAnon = `${chatId}-anon_customer-admin`;
                            const roomCust = `${chatId}-customer-admin`;
                            
                            const payload = msg.toObject();
                            io.to(roomAnon).emit("new_message", payload);
                            io.to(roomCust).emit("new_message", payload);
                            console.log(`[CHAT_SERVICE] Socket emitted to rooms: ${roomAnon}, ${roomCust}`);
                        }
                        resolve(msg);
                    } catch (err) {
                        console.error("[CHAT_SERVICE] Error in sendMessage timeout:", err);
                        resolve(null);
                    }
                }, delay);
            });
        };

        const normalizedContent = (messageContent || "").toString().trim();
        const lowerContent = normalizedContent.toLowerCase();
        
        console.log(`[CHAT_SERVICE] Handling message: "${normalizedContent}" (Lower: "${lowerContent}") for Chat: ${chatId}`);

        // 2. VENDOR CARD ACTIONS (STAY AS IS)
        if (normalizedContent.startsWith("LIKE_VENDOR:") || normalizedContent.startsWith("DISLIKE_VENDOR:")) {
            const [action, vendorId] = messageContent.split(":");
            if (action === "LIKE_VENDOR") {
                await sendMessage("Great choice! Here is the summary of your order.", "order_summary", null, "confirm_order");
                await sendMessage("Would you like to proceed with this order?", "options", [
                    { label: "Confirm Order", value: `CONFIRM_ORDER:${vendorId}` },
                    { label: "Cancel", value: "CANCEL_ORDER" }
                ]);
            } else {
                await sendMessage("Got it. We'll look for other options.");
            }
            return;
        }

        if (messageContent.startsWith("CONFIRM_ORDER:")) {
             await Message.create({
                chat_id: chatId, chat_type: chat.chat_type, sender: "admin", sender_id: "admin",
                message_content: "To save your order and proceed to checkout, please login or sign up.",
                message_type: "login_prompt", action: "login_redirect"
            });
            return;
        }

        // 3. STEP-BY-STEP FLOW
        const eventTypes = ["birthday", "anniversary", "social gathering", "corporate event", "something else"];
        const isEventTypeSelection = eventTypes.includes(lowerContent);

        // STEP 2: HANDLE EVENT TYPE SELECTION
        console.log(`[CHAT_SERVICE] Found Enquiry: ${enquiry ? enquiry.enquiry_id : "NONE"} (Status: ${enquiry?.status || "N/A"})`);

        if (!enquiry || isEventTypeSelection) {
            console.log(`[CHAT_SERVICE] Step 1: Handling Event Type selection (isSelection: ${isEventTypeSelection})`);
            if (enquiry && isEventTypeSelection) {
                // If it's a new selection for an existing enquiry, just update the type
                console.log(`[CHAT_SERVICE] Updating existing enquiry ${enquiry.enquiry_id} to ${normalizedContent}`);
                enquiry.event_type = normalizedContent;
                enquiry.status = "COLLECTING_DATE"; // Reset to date step
            } else {
                console.log(`[CHAT_SERVICE] Creating NEW enquiry for ${normalizedContent}`);
                enquiry = await CustomerEnquiry.create({
                    enquiry_id: generateUniqueId("ENQ"),
                    [userId.startsWith("CUST") || !userId.startsWith("ANON") ? "customer_id" : "anon_customer_id"]: userId,
                    event_type: normalizedContent,
                    status: "COLLECTING_DATE"
                });
            }
            await enquiry.save();
            console.log(`[CHAT_SERVICE] Enquiry saved. Sending date_picker...`);
            chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
            await chat.save();

            // Transition to STEP 3: Event Date
            await sendMessage("Love it! Now, when are you planning to host it?", "date_picker", [
                { label: "Still exploring - not sure yet", value: "STILL_EXPLORING" }
            ]);
            return;
        }

        if (!enquiry) return;

        // STEP 3 -> 4: Event Date Selection
        if (enquiry.status === "COLLECTING_DATE") {
            enquiry.event_date = lowerContent === "still_exploring" ? null : normalizedContent;
            enquiry.status = "COLLECTING_LOCATION";
            await enquiry.save();
            chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
            await chat.save();

            await sendMessage("Got it! Which city or area is the event in?");
            return;
        }

        // STEP 4 -> 5: Location / City
        if (enquiry.status === "COLLECTING_LOCATION") {
            enquiry.city = normalizedContent;
            enquiry.status = "COLLECTING_VENUE";
            await enquiry.save();
            chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
            await chat.save();

            await sendMessage("Is this event happening at home or at an outside venue?", "options", [
                { label: "At home", value: "At home" },
                { label: "Outdoor / Outside venue", value: "Outdoor / Outside venue" }
            ]);
            return;
        }

        // STEP 5 -> 6: Venue Setting
        if (enquiry.status === "COLLECTING_VENUE") {
            if (lowerContent === "outdoor / outside venue") {
                enquiry.venue_setting = "Outdoor";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                await sendMessage("Have you already decided on a venue, or would you like Eventory to help find one?", "options", [
                    { label: "Yes, I have a venue in mind", value: "VENUE_YES" },
                    { label: "I need help finding a venue", value: "VENUE_HELP" }
                ]);
                return;
            } else if (lowerContent === "at home") {
                enquiry.venue_setting = "At home";
                enquiry.status = "COLLECTING_SERVICES";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                // Proceed to Step 6
                await sendMessage("Perfect! What kind of services are you looking for? (Select all that apply)", "multi_select", [
                    { label: "Catering", value: "Catering" },
                    { label: "Venue", value: "Venue" },
                    { label: "Photography / Videography", value: "Photography / Videography" },
                    { label: "Decoration & Florals", value: "Decoration & Florals" },
                    { label: "Music / Entertainment", value: "Music / Entertainment" },
                    { label: "Makeup & Styling", value: "Makeup & Styling" },
                    { label: "Others", value: "Others" }
                ]);
                return;
            } else if (lowerContent === "venue_yes" || lowerContent === "venue_help") {
                enquiry.venue_help_needed = lowerContent === "venue_help";
                enquiry.status = "COLLECTING_SERVICES";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                // Proceed to Step 6
                await sendMessage("Perfect! What kind of services are you looking for? (Select all that apply)", "multi_select", [
                    { label: "Catering", value: "Catering" },
                    { label: "Venue", value: "Venue" },
                    { label: "Photography / Videography", value: "Photography / Videography" },
                    { label: "Decoration & Florals", value: "Decoration & Florals" },
                    { label: "Music / Entertainment", value: "Music / Entertainment" },
                    { label: "Makeup & Styling", value: "Makeup & Styling" },
                    { label: "Others", value: "Others" }
                ]);
                return;
            }
        }

        // STEP 6 -> 7: Services Needed
        if (enquiry.status === "COLLECTING_SERVICES") {
            // Check if user is answering the custom "Others" or "Guest Count"
            if (enquiry.services_needed.length > 0 && (lowerContent.includes("under") || lowerContent.includes("-") || lowerContent.includes("+"))) {
                enquiry.guest_count = normalizedContent;
                enquiry.status = "COLLECTING_BUDGET";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                // Proceed to Step 7
                await sendMessage("Almost there! Do you have a budget in mind for this event?", "options", [
                    { label: "Yes, I have a rough number", value: "BUDGET_YES" },
                    { label: "Not decided yet", value: "BUDGET_NO" }
                ]);
                return;
            }

            // Normal service selection (could be multi_select JSON string from frontend)
            let selectedServices = [];
            try {
                selectedServices = JSON.parse(normalizedContent);
            } catch (e) {
                selectedServices = [normalizedContent];
            }

            if (selectedServices.includes("Others") && !enquiry.services_needed.includes("Others")) {
                enquiry.services_needed = selectedServices;
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                await sendMessage("What other services are you looking for?");
                return;
            }

            enquiry.services_needed = selectedServices;
            await enquiry.save();
            chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
            await chat.save();

            const needsGuestCount = selectedServices.some(s => s === "Catering" || s === "Venue");
            if (needsGuestCount) {
                await sendMessage("Around how many guests are you expecting?", "options", [
                    { label: "Under 25", value: "Under 25" },
                    { label: "25–50", value: "25–50" },
                    { label: "50–100", value: "50–100" },
                    { label: "100–200", value: "100–200" },
                    { label: "200+", value: "200+" },
                    { label: "Not sure yet", value: "Not sure yet" }
                ]);
            } else {
                enquiry.status = "COLLECTING_BUDGET";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                await sendMessage("Almost there! Do you have a budget in mind for this event?", "options", [
                    { label: "Yes, I have a rough number", value: "BUDGET_YES" },
                    { label: "Not decided yet", value: "BUDGET_NO" }
                ]);
            }
            return;
        }

        // STEP 7 -> 8/9: Budget
        if (enquiry.status === "COLLECTING_BUDGET") {
            if (lowerContent === "budget_yes") {
                enquiry.budget_option = "Yes";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                await sendMessage("What's your approximate budget range?", "options", [
                    { label: "Under ₹20,000", value: "Under ₹20,000" },
                    { label: "₹20,000 – ₹60,000", value: "₹20,000 – ₹60,000" },
                    { label: "₹60,000 – ₹1,00,000", value: "₹60,000 – ₹1,00,000" },
                    { label: "Above ₹1,00,000", value: "Above ₹1,00,000" },
                    { label: "Prefer to discuss with the manager", value: "Prefer to discuss with the manager" }
                ]);
                return;
            } else {
                enquiry.budget_option = lowerContent === "budget_no" ? "No" : enquiry.budget_option;
                if (!enquiry.budget_range && lowerContent !== "budget_no") {
                    enquiry.budget_range = normalizedContent;
                }
                enquiry.status = "COLLECTING_CONTACT";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                
                // STEP 8
                await sendMessage("This already sounds exciting! Here’s how we’ll help you:\nA dedicated Event Manager (FREE) will:\n • Share curated options\n • Suggest themes & ideas\n • Help you plan within your budget\n • Handle the entire coordination\nSo you can enjoy the event stress-free! \nTo make sure they can reach you quickly, could you share a couple of details?");
                
                // STEP 9
                await sendMessage("Your name? (First name works just fine!)");
                return;
            }
        }

        // STEP 9 -> 10: Contact Collection
        if (enquiry.status === "COLLECTING_CONTACT") {
            if (!enquiry.customer_name) {
                enquiry.customer_name = normalizedContent;
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                await sendMessage("Your phone number?");
                return;
            }
            if (!enquiry.phone_number) {
                 // Simple validation check
                if (!/^\d{10}$/.test(normalizedContent.replace(/\s/g, ""))) {
                    // console.warn("Invalid phone number:", normalizedContent);
                    // We'll proceed for now but normally we'd validate
                }
                enquiry.phone_number = normalizedContent;
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();
                await sendMessage("Best time to call? (Optional but helpful)", "options", [
                    { label: "Morning (9am–12pm)", value: "Morning (9am–12pm)" },
                    { label: "Afternoon (12pm–4pm)", value: "Afternoon (12pm–4pm)" },
                    { label: "Evening (4pm–8pm)", value: "Evening (4pm–8pm)" },
                    { label: "Anytime works!", value: "Anytime works!" }
                ]);
                return;
            }
            if (!enquiry.best_time_to_call) {
                enquiry.best_time_to_call = normalizedContent;
                enquiry.status = "PROCESSING";
                await enquiry.save();
                chat.metadata = { ...chat.metadata, ...enquiry.toObject() };
                await chat.save();

                // STEP 10: Confirmation
                await sendMessage(`Wonderful, ${enquiry.customer_name}!\nYour event brief is with us. One of our Event Managers will call you shortly at ${enquiry.phone_number}.\nWhile you wait - here's what our clients say about us.`, "options", [
                    { label: "Read Reviews", value: "CHECK_REVIEWS_ACTION" },
                    { label: "Back to Home", value: "BACK_TO_HOME_ACTION" }
                ]);
                console.log(`[FLOW] Lead capture complete for chat_id=${chatId}`);
                return;
            }
        }

    } catch (error) {
        console.error("Error in handleInteractiveMessage:", error);
    }
};

// Helper to trigger customer notification
const triggerCustomerNotification = async (customerId, chatId, messageContent, io) => {
    try {
        const notification = new CustomerNotification({
            customer_id: customerId,
            chat_id: chatId,
            notification_type: 'chat_message',
            message: `New message from Eventory: ${messageContent.length > 50 ? messageContent.substring(0, 47) + '...' : messageContent}`,
            read: false,
        });
        await notification.save();

        if (io) {
            const customerRoom = `notifications-${customerId}`;
            io.to(customerRoom).emit("new_notification", {
                type: 'chat_message',
                chat_id: chatId,
                message: notification.message,
                timestamp: notification.createdAt,
            });
        }
    } catch (err) {
        console.error("Failed to trigger automated customer notification:", err);
    }
};
