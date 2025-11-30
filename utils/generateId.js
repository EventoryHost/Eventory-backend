import crypto from "crypto";

const generateUniqueId = (type) => {
  const now = new Date();
  const { year, month, day, hours, minutes, seconds, miliseconds } = {
    year: now.getFullYear().toString().padStart(4, "0"),
    month: (now.getMonth() + 1).toString().padStart(2, "0"),
    day: now.getDate().toString().padStart(2, "0"),
    hours: now.getHours().toString().padStart(2, "0"),
    minutes: now.getMinutes().toString().padStart(2, "0"),
    seconds: now.getSeconds().toString().padStart(2, "0"),
    miliseconds: now.getMilliseconds().toString().padStart(3, "0"),
  };

  return `${type}${year}${month}${day}${hours}${minutes}${seconds}${miliseconds}`;
};

export function generatePaymentId() {
  const upperDigits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const allChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const randomChars = (length, chars) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return "pay_" + randomChars(6, upperDigits) + randomChars(8, allChars);
}

export function generateSignature(clientId, rawKey, timestamp) {
  // Clean & normalize key
  const cleaned = rawKey
    .trim()
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\r/g, "")
    .replace(/\s+/g, "");

  const pemKey =
    `-----BEGIN PUBLIC KEY-----\n${cleaned}\n-----END PUBLIC KEY-----`;

  const keyObj = crypto.createPublicKey({
    key: pemKey,
    format: "pem",
  });

  const data = `${clientId}.${timestamp}`;

  const encrypted = crypto.publicEncrypt(
    {
      key: keyObj,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(data, "utf8")
  );

  return encrypted.toString("base64");
}

export default generateUniqueId;
