import initializeFirebase from '../config/firebaseConfig.js';

/**
 * Send FCM notification using Firebase Admin SDK
 * @param {Object} messageOptions - All parameters for the FCM message
 * @param {string|string[]} messageOptions.token - Registration token(s) to send the message to
 * @param {string} messageOptions.topic - Topic name to send the message to
 * @param {string} messageOptions.condition - Condition to send the message to multiple topics
 * @param {Object} messageOptions.notification - Notification payload
 * @param {string} messageOptions.notification.title - Title of the notification
 * @param {string} messageOptions.notification.body - Body of the notification
 * @param {string} messageOptions.notification.image - Image URL for the notification icon
 * @param {Object} messageOptions.data - Custom data payload
 * @param {Object} messageOptions.android - Android-specific options
 * @param {Object} messageOptions.android.notification - Android notification options
 * @param {string} messageOptions.android.notification.channelId - Android notification channel ID
 * @param {string} messageOptions.android.notification.icon - Android notification icon
 * @param {string} messageOptions.android.notification.color - Android notification color
 * @param {Object} messageOptions.apns - APNs (iOS) specific options
 * @param {Object} messageOptions.apns.payload - APNs payload
 * @param {Object} messageOptions.fcmOptions - FCM SDK features options
 * @param {string} messageOptions.fcmOptions.analyticsLabel - Analytics label
 * @returns {Promise<Object>} Response from Firebase messaging service
 */
async function sendFCMNotification(messageOptions) {
  try {
    // Initialize Firebase if not already done
    const admin = initializeFirebase();

    // Validate required parameters
    if (!messageOptions.token && !messageOptions.topic && !messageOptions.condition) {
      throw new Error('Either token, topic, or condition is required');
    }

    // Construct the message payload
    const message = {};

    // Add target (token, topic, or condition)
    if (messageOptions.token) {
      message.token = messageOptions.token;
    } else if (messageOptions.topic) {
      message.topic = messageOptions.topic;
    } else if (messageOptions.condition) {
      message.condition = messageOptions.condition;
    }

    // Add notification payload if provided
    if (messageOptions.notification) {
      message.notification = {};
      if (messageOptions.notification.title) {
        message.notification.title = messageOptions.notification.title;
      }
      if (messageOptions.notification.body) {
        message.notification.body = messageOptions.notification.body;
      }
      if (messageOptions.notification.image) {
        message.notification.image = messageOptions.notification.image;
      }
    }

    // Add data payload if provided
    if (messageOptions.data) {
      message.data = messageOptions.data;
    }

    // Add Android-specific options
    if (messageOptions.android) {
      message.android = messageOptions.android;
    }

    // Add APNs-specific options
    if (messageOptions.apns) {
      message.apns = messageOptions.apns;
    }

    // Add FCM options
    if (messageOptions.fcmOptions) {
      message.fcmOptions = messageOptions.fcmOptions;
    }

    // Send the message
    const response = await admin.messaging().send(message);

    console.log('Successfully sent FCM notification:', response);
    return {
      success: true,
      messageId: response,
      response
    };

  } catch (error) {
    console.error('Error sending FCM notification:', error);

    // Handle specific Firebase errors
    if (error.code === 'messaging/invalid-registration-token') {
      return {
        success: false,
        error: 'Invalid registration token',
        details: error.message
      };
    } else if (error.code === 'messaging/registration-token-not-registered') {
      return {
        success: false,
        error: 'Registration token not registered',
        details: error.message
      };
    }

    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

/**
 * Send FCM notification to multiple tokens
 * @param {Object} messageOptions - Base message options
 * @param {string[]} messageOptions.tokens - Array of registration tokens
 * @param {Object} messageOptions.notification - Notification payload
 * @param {Object} messageOptions.data - Custom data payload
 * @param {Object} messageOptions.android - Android-specific options
 * @param {Object} messageOptions.apns - APNs specific options
 * @param {Object} messageOptions.fcmOptions - FCM SDK features options
 * @returns {Promise<Object>} Response from Firebase messaging service
 */
async function sendFCMNotifications(messageOptions) {
  try {
    if (!messageOptions.tokens || !Array.isArray(messageOptions.tokens)) {
      throw new Error('tokens array is required');
    }

    const admin = initializeFirebase();

    // Create multicast message
    const multicastMessage = {};

    // Set tokens
    multicastMessage.tokens = messageOptions.tokens;

    // Add notification if provided
    if (messageOptions.notification) {
      multicastMessage.notification = messageOptions.notification;
    }

    // Add data if provided
    if (messageOptions.data) {
      multicastMessage.data = messageOptions.data;
    }

    // Add platform-specific options
    if (messageOptions.android) {
      multicastMessage.android = messageOptions.android;
    }
    if (messageOptions.apns) {
      multicastMessage.apns = messageOptions.apns;
    }
    if (messageOptions.fcmOptions) {
      multicastMessage.fcmOptions = messageOptions.fcmOptions;
    }

    const response = await admin.messaging().sendMulticast(multicastMessage);

    console.log('Successfully sent FCM notifications:', response);

    return {
      success: true,
      responses: response.responses,
      successCount: response.successCount,
      failureCount: response.failureCount,
      response
    };

  } catch (error) {
    console.error('Error sending FCM notifications:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

/**
 * Send FCM notification to a topic
 * @param {Object} messageOptions - Message options
 * @param {string} messageOptions.topic - Topic name
 * @param {Object} messageOptions.notification - Notification payload
 * @param {Object} messageOptions.data - Custom data payload
 * @param {Object} messageOptions.android - Android-specific options
 * @param {Object} messageOptions.apns - APNs specific options
 * @param {Object} messageOptions.fcmOptions - FCM SDK features options
 * @returns {Promise<Object>} Response from Firebase messaging service
 */
async function sendFCMNotificationToTopic(messageOptions) {
  return sendFCMNotification({
    ...messageOptions,
    topic: messageOptions.topic
  });
}

export {
  sendFCMNotification,
  sendFCMNotifications,
  sendFCMNotificationToTopic
};
