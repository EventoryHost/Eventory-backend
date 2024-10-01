import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
import { cognito } from "../config/awsConfig.js";

import axios from "axios";
import jwt from "jsonwebtoken";

import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  ConfirmSignUpCommand,
  ListUsersCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Vendor as User } from "../models/users.js";

const createVendor = async (req, res) => {
  try {
    const { name, email } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getVendor = async (req, res) => {
  try {
    let { email, vendorId, mobile } = req.body;

    if (!email && !mobile && !vendorId) {
      return res
        .status(400)
        .json({ message: "Please provide at least one detail to get vendor." });
    }

    let user;
    if (vendorId) {
      user = await User.findOne({ id: vendorId });
    } else if (email) {
      user = await User.findOne({ email });
    } else if (mobile) {
      mobile = "+91" + mobile;
      user = await User.findOne({ mobile });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const signUp = async (req, res) => {
  const { mobile } = req.body;

  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,

    Username: `+91${mobile}`,
    Password: "123456",
    UserAttributes: [{ Name: "phone_number", Value: `+91${mobile}` }],
  };

  try {
    var user = await userExists(`${mobile}`);

    if (user !== null) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = await isNewUser(mobile);

    if (user) {
      const deleteCommand = new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: `+91${mobile}`,
      });
      await cognito.send(deleteCommand);
    }
    const command = new SignUpCommand(params);
    await cognito.send(command);
    login(req, res);
  } catch (error) {
    if (error.name === "UserNotFoundException") {
      console.log("New User");
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

const login = async (req, res) => {
  const { mobile } = req.body;
  const params = {
    AuthFlow: "CUSTOM_AUTH",
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: `+91${mobile}`,

    AuthParameters: {
      USERNAME: `+91${mobile}`,
    },
  };

  try {
    const command = new AdminInitiateAuthCommand(params);
    const userExists = isNewUser(mobile)
    if (userExists) {
      const data = await cognito.send(command);
      return res.status(200).json({ message: "OTP sent", data })
    }
    return res.status(400).json({ message: "User does not exist" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyLoginOtp = async (req, res) => {
  const { mobile, code, session, name } = req.body;

  const params = {
    ChallengeName: "CUSTOM_CHALLENGE",
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: `+91${mobile}`,
    Password: "123456",

    ChallengeResponses: {
      USERNAME: `+91${mobile}`,
      ANSWER: code,
    },
    Session: session,
  };

  try {
    const command = new AdminRespondToAuthChallengeCommand(params);
    var data = await cognito.send(command);
    const user = await User.findOne({ mobile: `+91${mobile}` });
    if (!user) {
      const newUser = new User({
        name,
        mobile,
      });
      var userData = await newUser.save();
      data = { ...data, userData };
      return res.status(200).json({ message: "Vendor registered", data });
    }
    res.status(200).json({ message: "Login Success", data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifySignUpOtp = async (req, res) => {
  const { name, otp, mobile } = req.body;

  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: `+91${mobile}`,
    ConfirmationCode: otp,
  };

  try {
    const command = new ConfirmSignUpCommand(params);
    await cognito.send(command);
    const newUser = new User({
      name,
      mobile,
    });
    const data = await newUser.save();
    res.status(200).json({ message: "Vendor registered", data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const authWithGoogle = async (req, res) => {
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const redirectUri = process.env.REDIRECT_URI;

  const clientId = process.env.COGNITO_APP_CLIENT_ID;
  const scope = "openid email profile";

  const responseType = "code";

  const authUrl = `${cognitoDomain}/oauth2/authorize?identity_provider=Google&redirect_uri=${redirectUri}&response_type=${responseType}&client_id=${clientId}&scope=${scope}`;
  console.log(authUrl);
  res.redirect(authUrl);
};

const googleCallback = async (req, res) => {
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const { code } = req.query;
  console.log(code);
  const clientId = process.env.COGNITO_APP_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  const tokenURL = `${cognitoDomain}/oauth2/token`;

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code: code,
  });
  console.log(params);

  try {
    const tokenResponse = await axios.post(tokenURL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Exchange token post google signup
    const { id_token, access_token, refresh_token } = tokenResponse.data;
    const decoded = jwt.decode(id_token);
    const { email, name } = decoded;

    // Check if user exists in db
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name });
      user = await user.save();
    }

    // Create session token
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.redirect(
      `${process.env.GOOGLE_POST_REDIRECT}?session_token=${sessionToken}`,
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const userExists = async (credential) => {
  const user = await User.findOne({
    $or: [{ email: credential }, { mobile: credential }],
  });
  return user;
};

const addBusinessDetails = async (req, res) => {
  const { id, details } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.businessDetails = details;
    const data = await user.save();
    res.status(200).json({ message: "Business details added", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const isNewUser = async (mobile) => {
  try {
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: `+91${mobile}`,
    });
    var user = await cognito.send(getUserCommand);
    return true;
  } catch (error) {
    if (error.name === "UserNotFoundException") {
      return false;
    }
    return error;
  }
};

export default {
  login,
  signUp,
  verifySignUpOtp,
  verifyLoginOtp,
  authWithGoogle,
  googleCallback,
  addBusinessDetails,
  createVendor,
  getVendor,
};
