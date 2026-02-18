import AnonCustomerOrder from "../models/anonCustomerOrder.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import CustomerNotification from "../models/customerNotifications.js";

/**
 * Create OR Update anonymous customer order
 * @route POST /api/anon-orders
 */
export const createOrUpdateAnonOrder = async (req, res) => {
  try {
    const {
      anon_order_id, 
      chat_id,
      anon_user_id,
      em_id,
      service_id,
      vendor_id,
      vendor_name,
      customer_name,
      customer_contact_number,
      customer_contact_email,
      event_type,
      event_start,
      event_end,
      event_time,
      event_location,
      location_type,
      guest_count,
      budget,
      final_order_items,
      final_amount,
      advance_amount_requested,
      paymentDetails,
      specificTerms,
      order_status,
      priority,
      em_notes,
      customer_requirements,
      source_info
    } = req.body;

    console.log(`[ORDER_DEBUG] Request for anon_order_id: ${anon_order_id}, chat_id: ${chat_id}`);
    console.log(`[ORDER_DEBUG] incoming advance_amount_requested: ${advance_amount_requested} (type: ${typeof advance_amount_requested})`);

    if (!chat_id) {
      return res.status(400).json({
        success: false,
        message: "chat_id is required"
      });
    }
    
    // Ensure chat_id is trimmed to avoid lookup failures
    const trimmedChatId = chat_id.trim();

    // Fetch chat to get correct chat_type
    console.log(`[ORDER] Fetching chat details for chat_id: '${trimmedChatId}'`);
    const chat = await Chat.findOne({ chat_id: trimmedChatId });
    
    if (!chat) {
         console.log(`[ORDER] WARNING: Chat with id '${chat_id}' NOT FOUND in DB during order creation/update.`);
    } else {
         console.log(`[ORDER] Chat found. Database chat_type: '${chat.chat_type}'`);
    }

    const chatType = chat ? chat.chat_type : "anon_customer-admin";
    console.log(`[ORDER] Resolved chatType for Message creation: '${chatType}'`);

    let order;
    if (anon_order_id) {
      const existingOrder = await AnonCustomerOrder.findOne({ anon_order_id });
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      console.log(`[ORDER_DEBUG] existingOrder.advance_amount_requested: ${existingOrder.advance_amount_requested}`);


      let paymentDetailsToUse = paymentDetails !== undefined ? paymentDetails : existingOrder.paymentDetails;
      let finalAmountToStore = final_amount !== undefined ? final_amount : existingOrder.final_amount;
      if (paymentDetailsToUse && paymentDetailsToUse.customerPayable && typeof paymentDetailsToUse.customerPayable.total === 'number') {
        finalAmountToStore = paymentDetailsToUse.customerPayable.total;
      }

      let updatedFields = {};
      let checkout_url = existingOrder.checkout_url;
      if (order_status === 'approved') {
        const Orders = (await import('../models/orders.js')).default;
        const anonOrderId = anon_order_id || existingOrder.anon_order_id;
        const anonUserId = anon_user_id || existingOrder.anon_user_id;
        const vendorId = vendor_id || existingOrder.vendor_id;
        let vendor_manager_name = vendor_name || existingOrder.vendor_name || "";
        let vendor_manager_contact_number = "";
        let vendor_manager_contact_email = "";
        try {
          const prefix = (service_id || existingOrder.service_id || "").toUpperCase();
          let serviceModel = null;
          if (prefix.startsWith("CAT")) {
            const mod = await import('../models/caterer.js');
            serviceModel = mod.default || mod.Caterer;
          } else if (prefix.startsWith("DECO")) {
            const mod = await import('../models/decorator.js');
            serviceModel = mod.default || mod.Decorator;
          } else if (prefix.startsWith("VNP")) {
            const mod = await import('../models/venueProvider.js');
            serviceModel = mod.default || mod.VenueProvider;
          } else if (prefix.startsWith("PAV")) {
            const mod = await import('../models/photographerVideographer.js');
            serviceModel = mod.default || mod.PhotographerVideographer;
          } else if (prefix.startsWith("MKA")) {
            const mod = await import('../models/makeupArtist.js');
            serviceModel = mod.default || mod.MakeupArtist;
          } else if (prefix.startsWith("DJS")) {
            const mod = await import('../models/djArtist.js');
            serviceModel = mod.default || mod.DjArtist;
          }
          if (serviceModel) {
            const serviceDoc = await serviceModel.findOne({ service_id: service_id || existingOrder.service_id });
            if (serviceDoc && serviceDoc.basic_details) {
              vendor_manager_name = serviceDoc.basic_details.point_of_contact || vendor_manager_name;
              vendor_manager_contact_number = serviceDoc.basic_details.service_contact_number || "";
            }
          }
          const vendorMod = await import('../models/vendor.js');
          const Vendor = vendorMod.default || vendorMod.Vendor;
          const vendorDoc = await Vendor.findOne({ vendor_id: vendorId });
          if (vendorDoc && vendorDoc.email_address) {
            vendor_manager_contact_email = vendorDoc.email_address;
          } else {
            vendor_manager_contact_email = "no-reply@eventory.com";
          }
        } catch (err) {
          vendor_manager_contact_email = "no-reply@eventory.com";
          console.error("Failed to fetch service/vendor details for final order mapping:", err);
        }
        const newOrder = await Orders.create({
          em_id: em_id !== undefined ? em_id : (existingOrder.em_id || 'EM_SYSTEM'),
          service_id: service_id !== undefined ? service_id : (existingOrder.service_id || 'SERVICE_UNKNOWN'),
          vendor_id: vendorId !== undefined ? vendorId : (existingOrder.vendor_id || 'VENDOR_UNKNOWN'),
          quotation_id: anonOrderId || existingOrder.anon_order_id || 'QUO_UNKNOWN',
          vendor_manager_name: vendor_manager_name || 'Not Assigned',
          customer_name: customer_name !== undefined ? customer_name : (existingOrder.customer_name || 'Anonymous Customer'),
          customer_id: anonUserId !== undefined ? anonUserId : (existingOrder.anon_user_id || 'CUSTOMER_UNKNOWN'),
          event_start: event_start !== undefined ? event_start : (existingOrder.event_start || new Date()),
          event_end: event_end !== undefined ? event_end : (existingOrder.event_end || new Date(Date.now() + 2 * 60 * 60 * 1000)),
          event_type: event_type !== undefined ? event_type : (existingOrder.event_type || 'General Event'),
          final_guest_count: guest_count !== undefined ? guest_count : (existingOrder.guest_count || 0),
          location_type: location_type !== undefined ? location_type : (existingOrder.location_type || 'outdoor'),
          event_location: event_location !== undefined ? event_location : (existingOrder.event_location || 'Location Not Provided'),
          final_amount: finalAmountToStore !== undefined ? finalAmountToStore : 0,
          advance_amount_requested: advance_amount_requested !== undefined ? advance_amount_requested : (existingOrder.advance_amount_requested || 0),
          vendor_approval: true,
          customer_approval: true,
          original_ask_by_customer: customer_requirements !== undefined ? customer_requirements : (existingOrder.customer_requirements || ''),
          order_status: 'approved',
          vendor_manager_contact_number: vendor_manager_contact_number || '0000000000',
          vendor_manager_contact_email: vendor_manager_contact_email || 'no-reply@eventory.com',
          customer_contact_number: customer_contact_number !== undefined ? customer_contact_number : (existingOrder.customer_contact_number || ''),
          customer_contact_email: customer_contact_email !== undefined ? customer_contact_email : (existingOrder.customer_contact_email || 'no-reply@eventory.com'),
          final_order_items: final_order_items !== undefined ? final_order_items : (existingOrder.final_order_items || []),
          paymentDetails: paymentDetailsToUse || {},
          specificTerms: specificTerms !== undefined ? specificTerms : (existingOrder.specificTerms || []),
        });
        console.log(`[ORDER_DEBUG] Orders.create payload advance_amount_requested: ${newOrder.advance_amount_requested}`);
        newOrder.final_checkout_url = `/checkout?amount=${finalAmountToStore}&vendor_id=${vendorId}&user_id=${anonUserId}&orderId=${newOrder.order_id}`;
        await newOrder.save();
        updatedFields.converted_to_order_id = newOrder.order_id;
        updatedFields.converted_at = new Date();
        updatedFields.order_status = 'approved';
        checkout_url = newOrder.final_checkout_url;
      } else if (order_status === 'sent_to_customer') {
        const anonOrderId = anon_order_id || existingOrder.anon_order_id;
        const anonUserId = anon_user_id || existingOrder.anon_user_id;
        const vendorId = vendor_id || existingOrder.vendor_id;
        checkout_url = `/checkout?amount=${finalAmountToStore}&vendor_id=${vendorId}&user_id=${anonUserId}&orderId=${anonOrderId}`;
      }

      updatedFields = {
        ...updatedFields,
        service_id: service_id !== undefined ? service_id : existingOrder.service_id,
        vendor_id: vendor_id !== undefined ? vendor_id : existingOrder.vendor_id,
        vendor_name: vendor_name !== undefined ? vendor_name : existingOrder.vendor_name,
        customer_name: customer_name !== undefined ? customer_name : existingOrder.customer_name,
        customer_contact_number: customer_contact_number !== undefined ? customer_contact_number : existingOrder.customer_contact_number,
        customer_contact_email: customer_contact_email !== undefined ? customer_contact_email : existingOrder.customer_contact_email,
        event_type: event_type !== undefined ? event_type : existingOrder.event_type,
        event_start: event_start !== undefined ? event_start : existingOrder.event_start,
        event_end: event_end !== undefined ? event_end : existingOrder.event_end,
        event_time: event_time !== undefined ? event_time : existingOrder.event_time,
        event_location: event_location !== undefined ? event_location : existingOrder.event_location,
        location_type: location_type !== undefined ? location_type : existingOrder.location_type,
        guest_count: guest_count !== undefined ? guest_count : existingOrder.guest_count,
        budget: budget !== undefined ? budget : existingOrder.budget,
        final_order_items: final_order_items !== undefined ? final_order_items : existingOrder.final_order_items,
        final_amount: finalAmountToStore,
        advance_amount_requested: advance_amount_requested !== undefined ? advance_amount_requested : existingOrder.advance_amount_requested,
        paymentDetails: paymentDetailsToUse,
        specificTerms: specificTerms !== undefined ? specificTerms : existingOrder.specificTerms,
        order_status: order_status !== undefined ? order_status : existingOrder.order_status,
        priority: priority !== undefined ? priority : existingOrder.priority,
        em_notes: em_notes !== undefined ? em_notes : existingOrder.em_notes,
        customer_requirements: customer_requirements !== undefined ? customer_requirements : existingOrder.customer_requirements,
        checkout_url,
        updated_at: new Date()
      };

      console.log(`[ORDER_DEBUG] final advance_amount_requested to save (AnonCustomerOrder): ${updatedFields.advance_amount_requested}`);

      order = await AnonCustomerOrder.findOneAndUpdate(
        { anon_order_id },
        { $set: updatedFields },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      try {
        let updateMessage = `Order updated! Order ID: ${order.anon_order_id}`;
        
        if (order_status === 'sent_to_customer') {
          updateMessage = 'Your order quotation has been sent! Please review the details.';
        } else if (order_status === 'approved') {
          updateMessage = 'Order approved! We will proceed with your booking.';
        } else if (order_status === 'rejected') {
          updateMessage = 'Order has been declined. Please contact us for more details.';
        } else if (order_status === 'cancelled') {
          updateMessage = 'Order has been cancelled.';
        }

        const systemMessage = await Message.create({
          chat_id,
          chat_type: chatType,
          sender: "em",
          sender_id: em_id || "system",
          message_type: "system",
          message_content: updateMessage,
        });

        console.log(`[ORDER] System message created: ${systemMessage._id}`);

        const servicesMap = new Map();
        if (order.final_order_items && Array.isArray(order.final_order_items)) {
          order.final_order_items.forEach((item) => {
            if (!item) return;
            const serviceName = item.name_of_service?.split(" - ")[0] || item.name_of_service || "Service";
            if (!servicesMap.has(serviceName)) {
              servicesMap.set(serviceName, {
                name: serviceName,
                items: [],
              });
            }
            servicesMap.get(serviceName).items.push({
              name: item.name_of_service || "Unknown Item",
              description: item.description || "",
              quantity: item.quantity || 1,
              price: item.price || 0,
              tax_rate: item.tax_rate || 0,
              tax_type: item.tax_type || "GST",
              tax_amount: item.tax_amount || 0,
              total_amount: item.total_amount || 0,
            });
          });
        }

        // Check if we should send a new order card or update an existing one? 
        // For now, consistent with previous behavior, we send a new card on update to show latest state.
        
        const cardData = {
            anon_order_id: order.anon_order_id,
            order_status: order.order_status,
            manager_name: "Event Manager",
            created_at: order.updated_at || order.created_at,
            event_type: order.event_type || "",
            event_date: order.event_start,
            event_time: order.event_time || "",
            location: order.event_location || "",
            guests: `${order.guest_count || 0} guests`,
            services: Array.from(servicesMap.values()),
            payment_breakdown: order.paymentDetails?.customerPayable || {},
            advance_amount_requested: order.advance_amount_requested || 0,
            checkout_url: order.checkout_url || checkout_url || null,
        };

        const orderCardMessage = await Message.create({
          chat_id,
          chat_type: chatType,
          sender: "em",
          sender_id: em_id || "system",
          message_type: "order_summary",
          message_content: "Order Summary",
          card_data: cardData,
        });

        console.log(`[ORDER] Order card message created: ${orderCardMessage._id}`);

        await Chat.updateOne(
          { chat_id, chat_type: chatType },
          { 
            $set: { 
              last_message_updated_at: new Date(),
              chat_updated_at: new Date()
            } 
          }
        );

        if (req.io) {
          // Re-fetch chat logic to ensures we have the absolute latest state
          // But 'Dual-Cast' is safer: emit to all potential rooms for this chat ID
          const rooms = [
              `${chat_id}-${chatType}`, // The database's current type
              `${chat_id}-anon_customer-admin`, // Where the legacy/initial frontend might be
              `${chat_id}-customer-admin`   // Where the upgraded/known frontend might be
          ];
          // Deduplicate rooms
          const uniqueRooms = [...new Set(rooms)];
          
          console.log(`[ORDER] Emitting socket events to rooms: ${uniqueRooms.join(', ')}`);

          uniqueRooms.forEach(roomId => {
              req.io.to(roomId).emit("new_message", {
                _id: systemMessage._id,
                chat_id: systemMessage.chat_id,
                chat_type: systemMessage.chat_type,
                sender: systemMessage.sender,
                sender_id: systemMessage.sender_id,
                message_content: systemMessage.message_content,
                message_type: systemMessage.message_type,
                message_sent_at: systemMessage.message_sent_at,
              });
              
              req.io.to(roomId).emit("new_message", {
                _id: orderCardMessage._id,
                chat_id: orderCardMessage.chat_id,
                chat_type: orderCardMessage.chat_type,
                sender: orderCardMessage.sender,
                sender_id: orderCardMessage.sender_id,
                message_content: orderCardMessage.message_content,
                message_type: orderCardMessage.message_type,
                card_data: orderCardMessage.card_data,
                message_sent_at: orderCardMessage.message_sent_at,
              });
          });
        }

        // Create persistent notification for Customer
        try {
          if (!order.anon_user_id) {
            console.error("❌ Failed to create notification: anon_user_id is missing in anon order");
          } else {
            console.log(`📝 Attempting to create persistent notification for customer ${order.anon_user_id} and order ${order.anon_order_id}`);
            const notif = await CustomerNotification.findOneAndUpdate(
              {
                customer_id: order.anon_user_id,
                order_id: order.anon_order_id,
                notification_type: "message_reminder",
              },
              {
                $set: {
                  message: `New order created: ${order.anon_order_id}. Please check in chat.`,
                  chat_id: chat_id,
                  quotation_id: chat_id, // chat_id is often the quotation_id for anon orders
                  read: false,
                  updated_at: new Date().toISOString()
                },
              },
              { new: true, upsert: true }
            );
            console.log(`✅ Persistent notification created/updated for anon order:`, notif._id);
          }
        } catch (notifErr) {
          console.error("❌ Failed to create persistent customer notification for anon order:", notifErr.message);
        }

      } catch (msgError) {
        console.error("Failed to send update notification:", msgError);
      }
    } else {
      const existingOrder = await AnonCustomerOrder.findOne({ chat_id });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: "Order already exists for this chat. Use update instead.",
          data: existingOrder
        });
      }

      let sourceData = source_info;
      if (!sourceData) {
        try {
          const chat = await Chat.findOne({ chat_id });
          if (chat && chat.metadata) {
            sourceData = {
              utm_source: chat.metadata.utm_source,
              utm_medium: chat.metadata.utm_medium,
              utm_campaign: chat.metadata.utm_campaign,
              referrer: chat.metadata.referrer,
              landing_page: chat.metadata.landing_page,
              device_info: chat.metadata.device_info
            };
          }
        } catch (err) {
          console.log("Could not fetch chat metadata:", err);
        }
      }

      order = await AnonCustomerOrder.create({
        chat_id,
        anon_user_id,
        em_id: em_id || 'EM_SYSTEM',
        service_id,
        vendor_id,
        vendor_name,
        customer_name: customer_name || "Anonymous Customer",
        customer_contact_number,
        customer_contact_email,
        event_type,
        event_start,
        event_end,
        event_time,
        event_location,
        location_type,
        guest_count,
        budget,
        final_order_items: final_order_items || [],
        final_amount: final_amount || 0,
        advance_amount_requested: advance_amount_requested || 0,
        paymentDetails: paymentDetails || {},
        specificTerms: specificTerms || [],
        order_status: order_status || 'draft',
        priority: priority || 'medium',
        em_notes: em_notes || '',
        customer_requirements: customer_requirements || '',
        source_info: sourceData || {}
      });

      try {
        const systemMessage = await Message.create({
          chat_id,
          chat_type: chatType,
          sender: "em",
          sender_id: em_id || "system",
          message_type: "system",
          message_content: `📋 Order draft created! Order ID: ${order.anon_order_id}`,
        });

        console.log(`[ORDER] System message created (New Order): ${systemMessage._id}`);

        const servicesMap = new Map();
        if (order.final_order_items && Array.isArray(order.final_order_items)) {
          order.final_order_items.forEach((item) => {
             if (!item) return;
            const serviceName = item.name_of_service?.split(" - ")[0] || item.name_of_service || "Service";
            if (!servicesMap.has(serviceName)) {
              servicesMap.set(serviceName, {
                name: serviceName,
                items: [],
              });
            }
            servicesMap.get(serviceName).items.push({
              name: item.name_of_service || "Unknown Item",
              description: item.description || "",
              quantity: item.quantity || 1,
              price: item.price || 0,
              tax_rate: item.tax_rate || 0,
              tax_type: item.tax_type || "GST",
              tax_amount: item.tax_amount || 0,
              total_amount: item.total_amount || 0,
            });
          });
        }

        const cardData = {
            anon_order_id: order.anon_order_id,
            order_status: order.order_status,
            manager_name: "Event Manager",
            created_at: order.created_at,
            event_type: order.event_type || "",
            event_date: order.event_start,
            event_time: order.event_time || "",
            location: order.event_location || "",
            guests: `${order.guest_count || 0} guests`,
            services: Array.from(servicesMap.values()),
            payment_breakdown: order.paymentDetails?.customerPayable || {},
            advance_amount_requested: order.advance_amount_requested || 0,
        };

        const orderCardMessage = await Message.create({
          chat_id,
          chat_type: chatType,
          sender: "em",
          sender_id: em_id || "system",
          message_type: "order_summary",
          message_content: "Order Summary",
          card_data: cardData,
        });

        console.log(`[ORDER] Order card message created (New Order): ${orderCardMessage._id}`);

        await Chat.updateOne(
          { chat_id, chat_type: chatType },
          { 
            $set: { 
              last_message_updated_at: new Date(),
              chat_updated_at: new Date()
            } 
          }
        );

        if (req.io) {
          console.log(`[ORDER] Emitting socket events for chat ${chat_id}`);
          
          const rooms = [
              `${chat_id}-${chatType}`, 
              `${chat_id}-anon_customer-admin`, 
              `${chat_id}-customer-admin`
          ];
          const uniqueRooms = [...new Set(rooms)];
          
          uniqueRooms.forEach(roomId => {
              req.io.to(roomId).emit("new_message", {
                _id: systemMessage._id,
                chat_id: systemMessage.chat_id,
                chat_type: systemMessage.chat_type,
                sender: systemMessage.sender,
                sender_id: systemMessage.sender_id,
                message_content: systemMessage.message_content,
                message_type: systemMessage.message_type,
                message_sent_at: systemMessage.message_sent_at,
              });
              
              req.io.to(roomId).emit("new_message", {
                _id: orderCardMessage._id,
                chat_id: orderCardMessage.chat_id,
                chat_type: orderCardMessage.chat_type,
                sender: orderCardMessage.sender,
                sender_id: orderCardMessage.sender_id,
                message_content: orderCardMessage.message_content,
                message_type: orderCardMessage.message_type,
                card_data: orderCardMessage.card_data,
                message_sent_at: orderCardMessage.message_sent_at,
              });
          });
        }

        // Create persistent notification for Customer
        try {
          if (!order.anon_user_id) {
            console.error("❌ Failed to create notification: anon_user_id is missing in new anon order");
          } else {
            console.log(`📝 Attempting to create persistent notification for customer ${order.anon_user_id} and order ${order.anon_order_id}`);
            const notif = await CustomerNotification.findOneAndUpdate(
              {
                customer_id: order.anon_user_id,
                order_id: order.anon_order_id,
                notification_type: "message_reminder",
              },
              {
                $set: {
                  message: `New order created: ${order.anon_order_id}. Please check in chat.`,
                  chat_id: chat_id,
                  quotation_id: chat_id,
                  read: false,
                  updated_at: new Date().toISOString()
                },
              },
              { new: true, upsert: true }
            );
            console.log(`✅ Persistent notification created/updated for NEW anon order:`, notif._id);
          }
        } catch (notifErr) {
          console.error("❌ Failed to create persistent customer notification for new anon order:", notifErr.message);
        }

      } catch (msgError) {
        console.error("Failed to send chat notification:", msgError);
      }
    }

    return res.status(anon_order_id ? 200 : 201).json({
      success: true,
      message: anon_order_id ? "Order updated successfully" : "Order created successfully",
      data: order
    });

  } catch (error) {
    console.error("Error creating/updating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process order",
      error: error.message
    });
  }
};

/**
 * Get all anonymous orders with filters
 * @route GET /api/anon-orders
 */
export const getAllAnonOrders = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (status) filter.order_status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { anon_order_id: { $regex: search, $options: 'i' } },
        { anon_user_id: { $regex: search, $options: 'i' } },
        { customer_name: { $regex: search, $options: 'i' } },
        { customer_contact_number: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AnonCustomerOrder.countDocuments(filter);

    const orders = await AnonCustomerOrder.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/anon-orders/:anon_order_id
 */
export const getAnonOrderById = async (req, res) => {
  try {
    const { anon_order_id } = req.params;

    const order = await AnonCustomerOrder.findOne({ anon_order_id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    });
  }
};

/**
 * Get order by chat_id
 * @route GET /api/anon-orders/by-chat/:chat_id
 */
export const getAnonOrderByChatId = async (req, res) => {
  try {
    const { chat_id } = req.params;

    const order = await AnonCustomerOrder.findOne({ chat_id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found for this chat"
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    });
  }
};

/**
 * Delete order
 * @route DELETE /api/anon-orders/:anon_order_id
 */
export const deleteAnonOrder = async (req, res) => {
  try {
    const { anon_order_id } = req.params;

    const deleted = await AnonCustomerOrder.findOneAndDelete({ anon_order_id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: deleted
    });

  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message
    });
  }
};

/**
 * Update anonymous order
 * @route PUT /api/anon-orders/:anon_order_id
 */
export const updateAnonOrder = async (req, res) => {
  try {
    const { anon_order_id } = req.params;
    const updateData = req.body;

    delete updateData.anon_order_id;
    delete updateData.chat_id;
    delete updateData.anon_user_id;
    delete updateData.created_at;

    const updatedOrder = await AnonCustomerOrder.findOneAndUpdate(
      { anon_order_id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder
    });

  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message
    });
  }
};

/**
 * Convert to regular order
 * @route POST /api/anon-orders/:anon_order_id/convert
 */
export const convertAnonOrder = async (req, res) => {
  try {
    const { anon_order_id } = req.params;
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "order_id is required"
      });
    }

    const order = await AnonCustomerOrder.findOneAndUpdate(
      { anon_order_id },
      {
        $set: {
          order_status: 'converted',
          converted_to_order_id: order_id,
          converted_at: new Date()
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order converted successfully",
      data: order
    });

  } catch (error) {
    console.error("Error converting order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to convert order",
      error: error.message
    });
  }
};

export default {
  createOrUpdateAnonOrder,
  getAllAnonOrders,
  getAnonOrderById,
  getAnonOrderByChatId,
  updateAnonOrder,
  deleteAnonOrder,
  convertAnonOrder
};
