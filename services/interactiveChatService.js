import Message from "../models/message2.js";
import CustomerEnquiry from "../models/customerEnquiry.js";
import Chat from "../models/chats.js";
import generateUniqueId from "../utils/generateId.js";
import AnonCustomerOrder from "../models/anonCustomerOrder.js";
import CustomerNotification from "../models/customerNotifications.js";

export const handleInteractiveMessage = async (chatId, socketSenderId, messageContent, io) => {
    try {
        // AGGRESSIVE ID SANITIZATION
        const cleanChatId = (chatId || "").toString().replace(/['"]/g, "").trim();
        const cleanSocketSenderId = (socketSenderId || "").toString().replace(/['"]/g, "").trim();

        const chat = await Chat.findOne({ chat_id: cleanChatId });
        if (!chat) {
            console.warn(`[CHAT_INTERACTIVE] Chat not found: ${cleanChatId}`);
            return;
        }

        let userId = (chat.customer_id || chat.anon_customer_id || "").toString().replace(/['"]/g, "").trim();
        if (!userId) {
            console.warn(`[CHAT_INTERACTIVE] No userId found for chat: ${cleanChatId}`);
            return;
        }

        // Robust ID normalization to avoid crashes on undefined
        const isAnon = userId.toString().startsWith("ANON");
        
        // RESTORED FILTER: Exclude closed/converted enquiries to ensure we start/pick an active flow
        const enquiryQuery = {
            [isAnon ? "anon_customer_id" : "customer_id"]: userId,
            status: { $nin: ["CLOSED", "CONVERTED"] }
        };

        let enquiry = null;
        try {
            enquiry = await CustomerEnquiry.findOne(enquiryQuery).sort({ created_at: -1 });
        } catch (dbErr) {
            console.error(`[CHAT_INTERACTIVE] Database error finding enquiry:`, dbErr);
        }


        const syncEnquiryToChat = async () => {
            if (chat && enquiry) {
                try {
                    const metadata = chat.metadata || {};
                    chat.metadata = { ...metadata, ...(typeof enquiry.toObject === 'function' ? enquiry.toObject() : enquiry) };
                    chat.markModified("metadata");
                    await chat.save();
                } catch(e) {
                    console.error("[STAB] syncEnquiryToChat ERR:", e);
                }
            }
        };

        const sendMessage = async (content, type = "text", options = null, action = null, delay = 50) => {
            return new Promise((resolve) => {
                setTimeout(async () => {
                    try {
                        const chat = await Chat.findOne({ chat_id: chatId });
                        if (!chat) {
                            console.error(`[CHAT_SERVICE] Chat not found for ID during delayed send: ${chatId}`);
                            resolve(null);
                            return;
                        }

                        const msg = await Message.create({
                            chat_id: chatId,
                            chat_type: chat.chat_type,
                            sender: "admin",
                            sender_id: "admin",
                            message_type: type,
                            message_content: content,
                            options,
                            action,
                            message_sent_at: new Date()
                        });

                        const roomAnon = `${chatId}-anon_customer-admin`;
                        const roomCust = `${chatId}-customer-admin`;

                        const socketPayload = { ...msg.toObject(), chat_id: chatId };

                        console.log(`[CHAT_SERVICE] Emitting message to rooms: ${roomAnon}, ${roomCust}`);
                        if (io) {
                            io.to(roomAnon).emit("new_message", socketPayload);
                            io.to(roomCust).emit("new_message", socketPayload);
                        }
                        resolve(msg);
                    } catch (error) {
                        console.error(`[CHAT_SERVICE] Error sending message to participants:`, error);
                        resolve(null);
                    }
                }, delay);
            });
        };

        const normalizedContent = (messageContent || "").toString().trim();
        const lowerContent = normalizedContent.toLowerCase();

        const eventKeywords = ["birthday", "anniversary", "wedding", "annaprashan", "baby shower", "housewarming", "social", "corporate", "party", "gathering", "celebration", "event", "decoration", "else"];
        const isKnownEventType = eventKeywords.some(keyword => lowerContent.includes(keyword));
        const genericGreetings = ["hi", "hello", "hey", "hii", "hey there", "hola", "yo"];
        const isGreeting = genericGreetings.includes(lowerContent);

        // STEP 2: Event Type Selection (Start flow if it's a known type OR any custom message)
        if (!enquiry || enquiry.status === "OPEN") {
            console.log(`[CHAT_SERVICE] Step 2: Handling Event Type selection. Match: custom string`);

            if (enquiry) {
                enquiry.event_type = normalizedContent;
                enquiry.status = "COLLECTING_DATE";
            } else {
                enquiry = await CustomerEnquiry.create({
                    enquiry_id: generateUniqueId("ENQ"),
                    [isAnon ? "anon_customer_id" : "customer_id"]: userId,
                    event_type: normalizedContent,
                    status: "COLLECTING_DATE"
                });
            }

            await enquiry.save();
            await syncEnquiryToChat();

            await sendMessage("Love it! Now, when are you planning to host it?", "date_picker", [
                { label: "Still exploring - not sure yet", value: "STILL_EXPLORING" }
            ]);
            return;
        }

        // AGGRESSIVE SAFETY CHECK: If no enquiry exists we can't proceed
        if (!enquiry) {
            console.warn(`[CHAT_INTERACTIVE] No active enquiry found for user: ${userId}. Skipping. Content: "${normalizedContent}"`);
            return;
        }

        // STEP 3: Date Selection -> Go to Location
        if (enquiry.status === "COLLECTING_DATE") {
            const dateMatch = normalizedContent.match(/\d{4}-\d{2}-\d{2}/);
            const isExploring = lowerContent === "still exploring - not sure yet" || lowerContent === "still_exploring";

            // If random text is entered, proceed with null date instead of getting stuck
            enquiry.event_date = dateMatch ? new Date(dateMatch[0]) : null;
            enquiry.status = "COLLECTING_LOCATION";
            await enquiry.save();
            await syncEnquiryToChat();

            await sendMessage("Got it! Which city or area is the event in?");
            return;
        }

        // STEP 4: City Selection -> Step 5 (Venue Setting)
        if (enquiry.status === "COLLECTING_LOCATION") {
            enquiry.city = normalizedContent;
            enquiry.status = "COLLECTING_VENUE_SETTING";
            await enquiry.save();
            await syncEnquiryToChat();

            await sendMessage("Is this event happening at home or at an outside venue?", "options", [
                { label: "At home", value: "At home" },
                { label: "Outdoor / Outside venue", value: "Outdoor / Outside venue" }
            ]);
            return;
        }

        // STEP 5: Venue Setting -> Decision OR Services
        if (enquiry.status === "COLLECTING_VENUE_SETTING") {
            enquiry.venue_setting = normalizedContent;
            
            if (lowerContent.includes("outside") || lowerContent.includes("outdoor")) {
                enquiry.status = "COLLECTING_VENUE_DECISION";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Have you already decided on a venue, or would you like Eventory to help find one?", "options", [
                    { label: "Yes, I have a venue in mind", value: "VENUE_YES" },
                    { label: "I need help finding a venue", value: "VENUE_HELP" }
                ]);
            } else {
                enquiry.status = "COLLECTING_SERVICES";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Perfect! What kind of services are you looking for? (Select all that apply)", "multi_select", [
                    { label: "Catering", value: "Catering" },
                    { label: "Venue", value: "Venue" },
                    { label: "Photography / Videography", value: "Photography / Videography" },
                    { label: "Decoration & Florals", value: "Decoration & Florals" },
                    { label: "Music / Entertainment", value: "Music / Entertainment" },
                    { label: "Makeup & Styling", value: "Makeup & Styling" },
                    { label: "Others", value: "Others" }
                ]);
            }
            return;
        }

        // STEP 5b: Venue Decision -> Step 6 (Services)
        if (enquiry.status === "COLLECTING_VENUE_DECISION") {
            enquiry.venue_help_needed = lowerContent.includes("help");
            enquiry.status = "COLLECTING_SERVICES";
            await enquiry.save();
            await syncEnquiryToChat();

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

        // STEP 6: Services Selection -> Step 6c (Other Details) OR Step 6b (Guest Count) OR Step 7 (Budget)
        if (enquiry.status === "COLLECTING_SERVICES") {
            let services = [];
            if (normalizedContent.startsWith("[") && normalizedContent.endsWith("]")) {
                try {
                    services = JSON.parse(normalizedContent);
                } catch (e) { services = [normalizedContent]; }
            } else {
                services = [normalizedContent];
            }

            enquiry.services_needed = services;
            
            const hasOthers = services.some(s => s.toLowerCase().includes("others"));

            if (hasOthers) {
                enquiry.status = "COLLECTING_OTHER_SERVICES_DETAILS";
                enquiry.pending_others_input = true;
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Could you tell us more about the other services you need?");
                return;
            }

            // If no "Others", proceed to guests or budget
            const needsGuests = services.some(s => {
                const ls = s.toLowerCase();
                return ls.includes("catering") || ls.includes("venue");
            });

            if (needsGuests) {
                enquiry.status = "COLLECTING_GUEST_COUNT";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Around how many guests are you expecting?", "options", [
                    { label: "Under 25", value: "Under 25" },
                    { label: "25–50", value: "25–50" },
                    { label: "50–100", value: "50–100" },
                    { label: "100–200", value: "100–200" },
                    { label: "200+", value: "200+" },
                    { label: "Not sure yet", value: "Not sure yet" }
                ]);
            } else {
                enquiry.status = "COLLECTING_BUDGET_OPTION";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Almost there! Do you have a budget in mind for this event?", "options", [
                    { label: "Yes, I have a rough number", value: "BUDGET_YES" },
                    { label: "Not decided yet", value: "BUDGET_NO" }
                ]);
            }
            return;
        }

        // STEP 6c: Handle Other Services Details
        if (enquiry.status === "COLLECTING_OTHER_SERVICES_DETAILS") {
            enquiry.other_service_details = normalizedContent;
            enquiry.pending_others_input = false;
            
            const needsGuests = (enquiry.services_needed || []).some(s => {
                const ls = s.toLowerCase();
                return ls.includes("catering") || ls.includes("venue");
            });

            if (needsGuests) {
                enquiry.status = "COLLECTING_GUEST_COUNT";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Around how many guests are you expecting?", "options", [
                    { label: "Under 25", value: "Under 25" },
                    { label: "25–50", value: "25–50" },
                    { label: "50–100", value: "50–100" },
                    { label: "100–200", value: "100–200" },
                    { label: "200+", value: "200+" },
                    { label: "Not sure yet", value: "Not sure yet" }
                ]);
            } else {
                enquiry.status = "COLLECTING_BUDGET_OPTION";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("Almost there! Do you have a budget in mind for this event?", "options", [
                    { label: "Yes, I have a rough number", value: "BUDGET_YES" },
                    { label: "Not decided yet", value: "BUDGET_NO" }
                ]);
            }
            return;
        }

        // STEP 6b: Guest Count -> Step 7 (Budget)
        if (enquiry.status === "COLLECTING_GUEST_COUNT") {
            enquiry.guest_count = normalizedContent;
            enquiry.status = "COLLECTING_BUDGET_OPTION";
            await enquiry.save();
            await syncEnquiryToChat();

            await sendMessage("Almost there! Do you have a budget in mind for this event?", "options", [
                { label: "Yes, I have a rough number", value: "BUDGET_YES" },
                { label: "Not decided yet", value: "BUDGET_NO" }
            ]);
            return;
        }

        // STEP 7: Budget Option -> Budget Range OR Step 8 (Handoff)
        if (enquiry.status === "COLLECTING_BUDGET_OPTION") {
            const hasBudget = lowerContent.includes("yes");
            enquiry.budget_option = hasBudget ? "Yes" : "No";

            if (hasBudget) {
                enquiry.status = "COLLECTING_BUDGET_RANGE";
                await enquiry.save();
            await syncEnquiryToChat();
                await sendMessage("What's your approximate budget range?", "options", [
                    { label: "Under ₹20,000", value: "Under ₹20,000" },
                    { label: "₹20,000 – ₹60,000", value: "₹20,000 – ₹60,000" },
                    { label: "₹60,000 – ₹1,00,000", value: "₹60,000 – ₹1,00,000" },
                    { label: "Above ₹1,00,000", value: "Above ₹1,00,000" },
                    { label: "Prefer to discuss with the manager", value: "Prefer to discuss with the manager" }
                ]);
            } else {
                enquiry.status = "STEP_8_HANDOFF";
                await handleStep8Handoff(enquiry, sendMessage, syncEnquiryToChat);
            }
            return;
        }

        // STEP 7b: Budget Range -> Step 8 (Handoff)
        if (enquiry.status === "COLLECTING_BUDGET_RANGE") {
            enquiry.budget_range = normalizedContent;
            enquiry.status = "STEP_8_HANDOFF";
            await enquiry.save();
            await syncEnquiryToChat();
            await handleStep8Handoff(enquiry, sendMessage, syncEnquiryToChat);
            return;
        }

        // STEP 9: Contact Name
        if (enquiry.status === "COLLECTING_NAME") {
            enquiry.customer_name = normalizedContent;
            enquiry.status = "COLLECTING_PHONE";
            await enquiry.save();
            await syncEnquiryToChat();
            await sendMessage("Your phone number?");
            return;
        }

        // STEP 9b: Phone -> Call Time
        if (enquiry.status === "COLLECTING_PHONE") {
            // Validate: must be exactly 10 digits and start with 6, 7, 8, or 9
            const digitsOnly = normalizedContent.replace(/\D/g, "");
            if (digitsOnly.length !== 10 || /^[0-5]/.test(digitsOnly)) {
                await sendMessage("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
                return;
            }

            enquiry.phone_number = digitsOnly;
            enquiry.status = "COLLECTING_CALL_TIME";
            await enquiry.save();
            await syncEnquiryToChat();
            await sendMessage("Best time to call? (Optional but helpful)", "options", [
                { label: "Morning (9am–12pm)", value: "Morning (9am–12pm)" },
                { label: "Afternoon (12pm–4pm)", value: "Afternoon (12pm–4pm)" },
                { label: "Evening (4pm–8pm)", value: "Evening (4pm–8pm)" },
                { label: "Anytime works!", value: "Anytime works!" }
            ]);
            return;
        }

        // STEP 9c: Call Time -> Confirmation (Step 10) -> Inspo (Step 11)
        if (enquiry.status === "COLLECTING_CALL_TIME") {
            enquiry.best_time_to_call = normalizedContent;
            enquiry.status = "FLOW_COMPLETE";
            await enquiry.save();
            await syncEnquiryToChat();

            const name = enquiry.customer_name || "there";
            const phone = enquiry.phone_number || "the provided number";

            // STEP 10: Confirmation
            await sendMessage(`Wonderful, ${name}! Your event brief is with us. One of our Event Managers will call you shortly at ${phone}.`, "text");
            
            await sendMessage("While you wait - here's what our clients say about us.", "options", [
                { label: "Read Reviews", value: "CHECK_REVIEWS_ACTION" },
                { label: "Back to Home", value: "BACK_TO_HOME_ACTION" }
            ]);

            // STEP 11: Inspo & Unlock
            await sendMessage("Thanks for sharing! Feel free to share more about your event plans and ideas. Our team will review and suggest personalised options.", "flow_complete");
            
            return;
        }

    } catch (error) {
        console.error("CRITICAL ERROR in handleInteractiveMessage:", error);
    }
};

// HELPER FOR STEP 8 HANDOFF TEXT
const handleStep8Handoff = async (enquiry, sendMessage, syncEnquiryToChat) => {
    enquiry.status = "COLLECTING_NAME";
    await enquiry.save();
    if (syncEnquiryToChat) await syncEnquiryToChat();
    
    await sendMessage("This already sounds exciting! Here’s how we’ll help you:", "text", null, null, 50);
    
    const mgrText = `A dedicated Event Manager (FREE) will:
• Share curated options
• Suggest themes & ideas
• Help you plan within your budget
• Handle the entire coordination

So you can enjoy the event stress-free! To make sure they can reach you quickly, could you share a couple of details?`;
    
    await sendMessage(mgrText, "text", null, null, 1000);
    
    await sendMessage("Your name? (First name works just fine!)", "text", null, null, 1000);
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
