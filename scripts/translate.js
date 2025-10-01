import { readFileSync, writeFileSync } from "fs";
import { v2 as Translate } from "@google-cloud/translate";

const translate = new Translate.Translate();

// 👇 Fix the path so it points to scripts/languages.json
const languages = JSON.parse(
  readFileSync("./scripts/languages.json", "utf8")
);

// Your English messages
const baseMessages = {
  no_internet_storage: "No internet connection. Please try again when online.",
  storage_failed: "Failed to save data. Please try again.",
  google_invalid_credential: "Invalid Google credentials. Please try again.",
  google_play_services_missing: "Google Play Services is not available on this device.",
  google_play_services_update_required: "Please update Google Play Services to use Google Sign-In.",
  auth_init_failed: "Failed to initialize authentication. Please try again.",
  signout_failed: "Failed to sign out. Please try again.",
  password_reset_email_sent: "Password reset email sent successfully.",
  password_changed: "Password changed successfully.",
  network_error: "No internet connection. Please try again."
};

async function main() {
  const translations = {};
  for (const lang of languages) {
    translations[lang] = {};
    for (const key in baseMessages) {
      const [translated] = await translate.translate(baseMessages[key], lang);
      translations[lang][key] = translated;
    }
    console.log(`✅ Translated: ${lang}`);
  }

  // Save into src/locales
  writeFileSync(
    "./src/locales/translations.json",
    JSON.stringify(translations, null, 2),
    "utf8"
  );

  console.log("🎉 All translations saved to src/locales/translations.json");
}

main().catch(console.error);
