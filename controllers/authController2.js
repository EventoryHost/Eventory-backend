import "dotenv/config.js";
import {
  PinpointClient,
  PhoneNumberValidateCommand,
  SendMessagesCommand,
} from "@aws-sdk/client-pinpoint";
const pinClient = new PinpointClient({
  region: process.env.AWS_REGION,
});

var projectId = process.env.PINPOINT_PROJECT_ID;

// OTP generation
const otpStore = {};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const otp = generateOTP();
var message =
  `Your Eventory OTP is ${otp}. Please enter this OTP to verify your account.`;

var messageType = "TRANSACTIONAL";

const OTP = async (event, res) => {
  console.log("Received event:", event);
  await validateNumber(event, res);
};

async function validateNumber(event, res) {
  var destinationNumber = event.body.destinationNumber;
  console.log("destinationNumber: ", destinationNumber);
  if (destinationNumber.length == 10) {
    destinationNumber = "+91" + destinationNumber;
    console.log("destinationNumber: ", destinationNumber);
  }
  var params = {
    NumberValidateRequest: {
      IsoCountryCode: "IN",
      PhoneNumber: destinationNumber,
    },
  };
  try {
    const PhoneNumberValidateresponse = await pinClient.send(
      new PhoneNumberValidateCommand(params)
    );
    console.log(PhoneNumberValidateresponse);
    if (
      PhoneNumberValidateresponse["NumberValidateResponse"]["PhoneTypeCode"] ==
      0
    ) {
      console.log("Received a phone number capable of receiving SMS messages.");
      var data = PhoneNumberValidateresponse;
      var destinationNumber =
        data["NumberValidateResponse"]["CleansedPhoneNumberE164"];
      otpStore[destinationNumber] = { otp, timestamp: Date.now() };
      console.log("destinationNumber: ", destinationNumber);
      // await sendConfirmation(destinationNumber, res);
      console.log(message);
      res
        .status(200)
        .send({ success: true, message: "OTP sent successfully." });
    } else {
      console.log(
        "Received a phone number that isn't capable of receiving " +
          "SMS messages. No endpoint created."
      );
    }
  } catch (err) {
    console.log(err);
  }
}

async function sendConfirmation(destinationNumber, res) {
  var params = {
    ApplicationId: projectId,
    MessageRequest: {
      Addresses: {
        [destinationNumber]: {
          ChannelType: "SMS",
        },
      },
      MessageConfiguration: {
        SMSMessage: {
          Body: message,
          MessageType: messageType,
        },
      },
    },
  };
  try {
    const SendMessagesCommandresponse = await pinClient.send(
      new SendMessagesCommand(params)
    );
    console.log(
      "Message sent! " +
        SendMessagesCommandresponse["MessageResponse"]["Result"][
          destinationNumber
        ]["StatusMessage"]
    );
  } catch (err) {
    console.log(err);
  }
}

function verifyOTP(event, res) {
  console.log(otpStore);
  const destinationNumber = event.body.destinationNumber;
  const userOtp = event.body.otp;
  console.log("destinationNumber: ", destinationNumber);
  console.log("userOtp: ", userOtp);
  const storedOtpData = otpStore[destinationNumber];

  if (!storedOtpData) {
    return res.status(400).send({ success: false, message: "OTP not found or expired." });
  }

  const { otp, timestamp } = storedOtpData;
  const currentTime = Date.now();
  const otpValidityPeriod = 5 * 60 * 1000; // 5 minutes

  if (currentTime - timestamp > otpValidityPeriod) {
    delete otpStore[destinationNumber]; // Clean up expired OTP
    return res.status(400).send({ success: false, message: "OTP expired." });
  }

  if (userOtp === otp) {
    delete otpStore[destinationNumber]; // Clean up used OTP
    return res.status(200).send({ success: true, message: "OTP verified successfully." });
  } else {
    return res.status(400).send({ success: false, message: "Invalid OTP." });
  }
}

export default { OTP, verifyOTP };
