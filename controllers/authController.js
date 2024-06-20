const cognito = require("../config/awsConfig");
require("dotenv").config();
const User = require("../models/users");

const signUp = async (req, res) => {
  const { email, password, name } = req.body;
  let { mobile } = req.body;
  phone = "+91" + mobile;

  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "phone_number", Value: phone },
      { Name: "name", Value: name },
    ],
  };

  try {
    const user = await userExists(email);
    if (!user) {
      let data = await cognito.signUp(params).promise();
      const newUser = new User({
        name,
        phone,
        password,
        email,
      });
      await newUser.save();
      data = await confirmUser(email)
      res.status(200).json({ message: "Vendor registered", data });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const data = await cognito.initiateAuth(params).promise();

    console.log("Login success:", data);
    res.status(200).json({message: "Login success",data});
  } catch (error) {
    res.status(500).json({error: error.message});
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

const confirmUser = async (email) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
  };

  try {
    await cognito.adminConfirmSignUp(params).promise();
  } catch (error) {
    throw error;
  }
};

module.exports = { signUp, login, verifyOtp };
