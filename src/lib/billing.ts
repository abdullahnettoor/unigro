export type UpgradeChannel = "whatsapp" | "email";

export const UPGRADE_EMAIL = "hi@abdullahnettoor.com";
export const UPGRADE_PHONE_E164 = "919061904860";

export function startUpgrade(channel: UpgradeChannel) {
  if (channel === "whatsapp") {
    window.open(
      `https://wa.me/${UPGRADE_PHONE_E164}?text=${encodeURIComponent("Hi UniGro, I want to upgrade to the Pro organizer plan.")}`,
      "_blank",
      "noopener,noreferrer"
    );
    return;
  }

  window.location.href = `mailto:${UPGRADE_EMAIL}?subject=${encodeURIComponent(
    "UniGro Pro upgrade"
  )}&body=${encodeURIComponent("Hi UniGro team,\n\nI want to upgrade to the Pro organizer plan.\n")}`;
}
