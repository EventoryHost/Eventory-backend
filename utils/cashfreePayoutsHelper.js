import dotenv from "dotenv";
import { generateSignature } from "./generateId.js";

dotenv.config();

export function buildPayoutsHeaders() {
  const payoutsClientId = process.env.CASHFREE_CLIENT_ID;
  const payoutsSecret = process.env.CASHFREE_CLIENT_SECRET;
  const publicKey = `-----BEGIN PUBLIC KEY-----\n${process.env.CASHFREE_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(payoutsClientId, publicKey, timestamp);

  return {
    "Content-Type": "application/json",
    "x-api-version": "2024-01-01",
    "x-client-id": `${payoutsClientId}`,
    "x-client-secret": `${payoutsSecret}`,
    "x-cf-signature": `${signature}`,
  };
}

export function getPayoutsBaseUrl() {
  return process.env.IS_DEV === "true"
    ? "https://sandbox.cashfree.com/payout"
    : "https://api.cashfree.com/payout";
}

// Valid UPI handle suffixes for heuristic VPA validation
export const VALID_VPA_HANDLES = [
  "upi",
  "sbi",
  "axisbank",
  "hdfcbank",
  "icici",
  "kotak",
  "kotak811",
  "yesbank",
  "pnb",
  "barodampay",
  "allbank",
  "indianbank",
  "unionbank",
  "centralbank",
  "canara",
  "cnrb",
  "uco",
  "iob",
  "idbi",
  "rbl",
  "indus",
  "federal",
  "dbs",
  "hsbc",
  "citi",
  "citigold",
  "bandhan",
  "aubank",
  "equitas",
  "fincarebank",
  "dlb",
  "kbl",
  "sib",
  "boi",
  "mahb",
  "jkb",
  "okaxis",
  "okhdfcbank",
  "okicici",
  "oksbi",
  "ybl",
  "ibl",
  "axl",
  "paytm",
  "ptaxis",
  "ptyes",
  "ptsbi",
  "pthdfc",
  "apl",
  "yapl",
  "rapl",
  "sliceaxis",
  "slicepay",
  "slc",
  "axisb",
  "yescred",
  "yescurie",
  "fam",
  "yesfam",
  "inhdfc",
  "jupiteraxis",
  "naviaxis",
  "mvhdfc",
  "oneyes",
  "fifederal",
  "kphdfc",
  "seyes",
  "abcdicici",
  "jarunity",
  "rmrbl",
  "kbaxis",
  "freecharge",
  "ikwik",
  "airtel",
  "jio",
  "payu",
  "trans",
  "timecosmos",
  "yespay",
  "yespop",
  "bpunity",
  "paulpay",
  "finobank",
  "pingpay",
  "fkaxis",
  "zoicici",
  "shriramhdfcbank",
  "mboi",
  "axb",
  "waicici",
  "pz",
  "indie",
  "yesg",
];

/**
 * Heuristic VPA validation: checks format and handle suffix against known list.
 * @param {string} vpa - The UPI VPA to validate (e.g. "name@upi")
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateVPA(vpa) {
  if (!vpa || typeof vpa !== "string") {
    return { valid: false, error: "UPI ID is required" };
  }

  const trimmed = vpa.trim().toLowerCase();

  // Basic format: username@handle
  const formatRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  if (!formatRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid UPI ID format. Expected format: username@bank",
    };
  }

  const handle = trimmed.split("@")[1];
  if (!VALID_VPA_HANDLES.includes(handle)) {
    return {
      valid: false,
      error: `Invalid UPI handle '@${handle}'. Please enter a valid UPI ID.`,
    };
  }

  return { valid: true };
}
