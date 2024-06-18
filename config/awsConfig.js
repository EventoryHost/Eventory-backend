const AWS = require('aws-sdk')
require("dotenv").config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET,
  })
  
  const cognito = new AWS.CognitoIdentityServiceProvider();
  module.exports = cognito;