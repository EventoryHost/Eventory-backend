import "dotenv/config.js";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProvider({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET,
});
export default cognito;
