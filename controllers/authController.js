const cognito = require("../config/awsConfig");
require("dotenv").config();

const signUp = async (req, res) => {
  const { phone } = req.body;

  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    Username: phone,
    Password: "123456",
    UserAttributes: [
      {
        Name: "phone_number",
        Value: phone,
      },
    ],
  };

  try {
    const user = await userExists(phone);
    const data = {};
    if (!user) {
      data = await cognito.signUp(params).promise();
    }
    await initiateAuth(phone);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(error);
  }
};

const login = async (req, res) => {
  const { phone } = req.body;

  try {
    const initData = await initiateAuth(phone);

    console.log("Login success:", data);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(error);
  }
};

const verifyOtp = async (req, res) => {
  const { phone, session, otp } = req.body;

  try {
    const data = await respondToAuthChallenge(phone, session, otp);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const initiateAuth = async (phoneNumber) => {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    AuthParameters: {
      USERNAME: phoneNumber,
      PASSWORD: "123456",
    },
  };

  try {
    const data = await cognito.initiateAuth(params).promise();
    console.log("Login success:", data);
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

const respondToAuthChallenge = async (phoneNumber, session, otp) => {
  const params = {
    ChallengeName: "SMS_MFA",
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    ChallengeResponses: {
      USERNAME: phoneNumber,
      SMS_MFA_CODE: otp,
    },
    Session: session,
  };

  try {
    const data = await cognito.respondToAuthChallenge(params).promise();
    console.log("OTP verification success:", data);
    return data;
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
};

const userExists = async (phoneNumber) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Filter: `phone_number="${phoneNumber}"`,
  };

  try {
    const data = await cognito.listUsers(params).promise();
    return data.Users && data.Users.length > 0;
  } catch (error) {
    throw error;
  }
};

const confirmUser = async (phoneNumber) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: phoneNumber,
  };

  try {
    await cognito.adminConfirmSignUp(params).promise();
  } catch (error) {
    throw error;
  }
};

module.exports = { signUp, login, verifyOtp };
