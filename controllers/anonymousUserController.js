import AnonymousUser from "../models/anonymousUser.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import generateUniqueId from "../utils/generateId.js";
import crypto from 'crypto';

// Helper to hash IP
const hashIp = (ip) => {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
};

export const initializeAnonymousUser = async (req, res) => {
  try {
    const { 
      fbclid, 
      utm_source, 
      utm_medium, 
      utm_campaign, 
      utm_adset, 
      utm_ad, 
      landing_page, 
      referrer,
      device_info,
      anon_id // NEW: Accept anon_id
    } = req.body;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    let user;
    let isNewUser = true;

    // 1. Try to find existing user if anon_id provided
    if (anon_id) {
      user = await AnonymousUser.findOne({ anon_id });
      
      if (user) {
        isNewUser = false;
        // Update existing user with new tracking data
        user.last_seen_at = new Date();
        user.acquisition = {
          ...user.acquisition, // Keep existing fields if not overwritten? Or overwrite all? 
                               // Requirement says "update the user's record with the new tracking data"
                               // We'll overwrite the specific fields provided, but maybe keep 'first_seen' stuff effectively by not touching it.
                               // Actually, let's just update the acquisition object with new values.
          source: fbclid ? 'meta' : (utm_source || user.acquisition.source), // Update source if new one present
          fbclid: fbclid || user.acquisition.fbclid,
          utm_source: utm_source || user.acquisition.utm_source,
          utm_medium: utm_medium || user.acquisition.utm_medium,
          utm_campaign: utm_campaign || user.acquisition.utm_campaign,
          utm_adset: utm_adset || user.acquisition.utm_adset,
          utm_ad: utm_ad || user.acquisition.utm_ad,
          landing_page: landing_page || user.acquisition.landing_page,
          referrer: referrer || user.acquisition.referrer
        };
        
        // Update device info if provided
        if (device_info) {
             user.device = {
                ...user.device,
                platform: device_info.platform || user.device.platform,
                screen_width: device_info.screen_width || user.device.screen_width,
                screen_height: device_info.screen_height || user.device.screen_height,
                ip_hash: hashIp(ip), // Update IP hash on new visit
                user_agent: userAgent // Update UA
             };
        }

        await user.save();
      }
    }

    // 2. If no user found (or no anon_id), create new one
    if (isNewUser) {
        user = new AnonymousUser({
            first_seen_at: new Date(),
            last_seen_at: new Date(),
            acquisition: {
                source: fbclid ? 'meta' : (utm_source || 'direct'),
                fbclid,
                utm_source,
                utm_medium,
                utm_campaign,
                utm_adset,
                utm_ad,
                landing_page,
                referrer
            },
            device: {
                ip_hash: hashIp(ip),
                user_agent: userAgent,
                platform: device_info?.platform || 'unknown',
                screen_width: device_info?.screen_width,
                screen_height: device_info?.screen_height
            }
        });
        await user.save();

        // Create ACTIVE chat session immediately for NEW users
        const chatId = generateUniqueId("CHAT");
        await Chat.create({
            chat_id: chatId,
            anon_customer_id: user.anon_id,
            chat_type: "anon_customer-admin",
            chat_status: "ACTIVE"
        });

        // Send default welcome message
        await Message.create({
            chat_id: chatId,
            chat_type: "anon_customer-admin",
            sender: "admin",
            sender_id: "admin",
            message_content: "Hey there! Thanks for choosing Eventory. We're here to make your event planning simple and stress-free.",
            message_type: "text"
        });

        // Send Event Type Options
        await Message.create({
            chat_id: chatId,
            chat_type: "anon_customer-admin",
            sender: "admin",
            sender_id: "admin",
            message_content: "Please select your event type",
            message_type: "options",
            options: [
                { label: "Birthday Party", value: "Birthday Party" },
                { label: "Anniversary", value: "Anniversary" },
                { label: "Corporate Event", value: "Corporate Event" },
                { label: "Society Party", value: "Society Party" },
                { label: "Other", value: "Other" }
            ]
        });
    }

    // Set HTTP-only cookie (refresh it)
    res.cookie('anon_user_id', user.anon_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      anon_user_id: user.anon_id,
      message: isNewUser ? "Anonymous user initialized" : "Anonymous user updated"
    });

  } catch (error) {
    console.error("Error initializing anonymous user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAnonymousUserActivity = async (req, res) => {
    try {
        const { anon_user_id } = req.params;
        if (!anon_user_id) return res.status(400).json({ error: "ID required" });

        await AnonymousUser.findOneAndUpdate({ anon_id: anon_user_id }, {
            last_seen_at: new Date()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error updating anonymous user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
