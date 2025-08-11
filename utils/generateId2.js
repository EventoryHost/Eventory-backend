import crypto from "crypto";

const generateUniqueId = (type) => {
  const now = new Date();
  const { year, month, day, hours, minutes, seconds, milliseconds } = {
    year: now.getFullYear().toString().padStart(4, "0"),
    month: (now.getMonth() + 1).toString().padStart(2, "0"),
    day: now.getDate().toString().padStart(2, "0"),
    hours: now.getHours().toString().padStart(2, "0"),
    minutes: now.getMinutes().toString().padStart(2, "0"),
    seconds: now.getSeconds().toString().padStart(2, "0"),
    milliseconds: now.getMilliseconds().toString().padStart(3, "0"),
  };

  return `${type}${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
};

// Export the main function as default and named export
// Usage: generateUniqueId("VEN"), generateUniqueId("CAT"), generateUniqueId("DEC"), etc.

// Payment ID generation (keeping existing function)
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

// Signature generation (keeping existing function)
export function generateSignature(clientId, key, timestamp) {
  const publicKey = crypto.createPublicKey({
    key: key,
    format: "pem",
  });
  const data = `${clientId}.${timestamp}`;

  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(data, "utf8"),
  );

  const signature = encryptedData.toString("base64");
  return signature;
}

export default generateUniqueId;
