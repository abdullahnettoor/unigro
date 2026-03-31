/**
 * Web Contact Picker API Utility
 * Provides a unified way to select contacts and sanitize phone numbers.
 */

export interface ContactResult {
  name: string;
  phone: string;
}

/**
 * Checks if the Web Contact Picker API is supported in the current browser.
 */
export const isContactPickerSupported = (): boolean => {
  return typeof window !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
};

/**
 * Triggers the native contact picker and returns a single contact.
 * Sanitizes the phone number to E.164-like format, defaulting to +91 if country code is missing.
 */
export async function selectContact(): Promise<ContactResult | null> {
  if (!isContactPickerSupported()) {
    console.warn("Contact Picker API not supported");
    return null;
  }

  try {
    const props = ["name", "tel"];
    const opts = { multiple: false };

    // @ts-ignore - Navigator.contacts is a relatively new API and might not be in all type definitions
    const contacts = await (navigator as any).contacts.select(props, opts);

    if (!contacts || !contacts.length) return null;

    const contact = contacts[0];
    const name = contact.name?.[0] || "";
    let rawPhone = contact.tel?.[0] || "";

    if (!rawPhone) return { name, phone: "" };

    // 1. Strip all non-numeric characters except '+'
    let phone = rawPhone.replace(/[^\d+]/g, "");

    // 2. Handle missing country code (Default to +91 as requested)
    if (phone && !phone.startsWith("+")) {
      // Remove leading zero if present
      if (phone.startsWith("0")) {
        phone = phone.substring(1);
      }

      // If it looks like a standard 10-digit mobile number, add +91
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else if (phone.length > 5) {
        // Fallback for other lengths: just ensure it has a '+' if it's likely a number
        phone = `+${phone}`;
      }
    }

    return { name, phone };
  } catch (error) {
    // User might have cancelled or denied permission
    console.debug("Contact picker interaction ended:", error);
    return null;
  }
}
