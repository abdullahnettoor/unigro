import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "ar-AE",
  SAR: "ar-SA",
  QAR: "ar-QA",
  OMR: "ar-OM",
  KWD: "ar-KW",
  BHD: "ar-BH",
  JPY: "ja-JP",
  CNY: "zh-CN",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
};

export function getLocaleForCurrency(currency: string): string {
  return CURRENCY_LOCALE_MAP[currency] || "en-US";
}

export function formatCurrency(amount: number, currencyCode: string = "INR") {
  const locale = getLocaleForCurrency(currencyCode);

  try {
    // 1. Get symbol using en-US for stable western representation (e.g., "SAR" instead of "ر.س.")
    const symbolFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    });
    const parts = symbolFormatter.formatToParts(0);
    const symbol = parts.find(p => p.type === 'currency')?.value || currencyCode;
    const isCode = symbol === currencyCode;

    // 2. Format number using target locale (for , or . logic)
    // We use a numbering system that ensures western numerals (123 instead of ١٢٣)
    const numberLocale = locale.includes('ar-') ? `${locale}-u-nu-latn` : locale;
    const formattedNumber = new Intl.NumberFormat(numberLocale, {
      maximumFractionDigits: 0,
    }).format(amount);

    // 3. Construct result: Code with space, Symbol without space (standard western convention)
    return isCode ? `${symbol} ${formattedNumber}` : `${symbol}${formattedNumber}`;
  } catch {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
}

export function getCurrencySymbol(currencyCode: string, fallbackToCode: boolean = false) {
  try {
    // Always use en-US to get the symbol to ensure we get "$" or "SAR" 
    // instead of localized variations like "US$" or "ر.س."
    const symbol = new Intl.NumberFormat('en-US', { style: "currency", currency: currencyCode })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || "";

    if (symbol === currencyCode) {
      return fallbackToCode ? currencyCode : "";
    }
    return symbol;
  } catch {
    return fallbackToCode ? currencyCode : "";
  }
}
