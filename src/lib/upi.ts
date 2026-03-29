import type { PoolPaymentDetails } from "@/components/pool-detail/types";

export type UpiPlatform = "android" | "ios" | "other";
export type UpiAppSlug = "phonepe" | "gpay" | "paytm" | "bhim";

export interface UpiPayload {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  currency: string;
}

export interface UpiAppOption {
  id: UpiAppSlug;
  label: string;
  deepLink: string;
}

export function detectUpiPlatform(): UpiPlatform {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/android/.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  return "other";
}

export function isValidUpiId(value: string) {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

function buildQuery(payload: UpiPayload) {
  return new URLSearchParams({
    pa: payload.payeeVpa,
    pn: payload.payeeName,
    am: payload.amount.toFixed(2),
    cu: payload.currency,
    tn: payload.transactionNote,
  }).toString();
}

export function createUpiPayload({
  paymentDetails,
  amount,
  poolTitle,
  roundIndex,
  currency = "INR",
}: {
  paymentDetails: PoolPaymentDetails;
  amount: number;
  poolTitle: string;
  roundIndex: number;
  currency?: string;
}): UpiPayload | null {
  const payeeVpa = paymentDetails.upiId?.trim();
  if (!payeeVpa) return null;

  return {
    payeeVpa,
    payeeName: paymentDetails.accountName?.trim() || poolTitle,
    amount,
    currency,
    transactionNote: [poolTitle, `Round ${roundIndex}`, paymentDetails.note?.trim()].filter(Boolean).join(" · "),
  };
}

export function buildGenericUpiLink(payload: UpiPayload) {
  return `upi://pay?${buildQuery(payload)}`;
}

export function buildIosUpiOptions(payload: UpiPayload): UpiAppOption[] {
  const query = buildQuery(payload);
  return [
    { id: "phonepe", label: "PhonePe", deepLink: `phonepe://pay?${query}` },
    { id: "gpay", label: "Google Pay", deepLink: `gpay://upi/pay?${query}` },
    { id: "paytm", label: "Paytm", deepLink: `paytmmp://pay?${query}` },
    { id: "bhim", label: "BHIM", deepLink: `bhim://upi/pay?${query}` },
  ];
}

export function launchUpiLink(deepLink: string) {
  window.location.href = deepLink;
}
