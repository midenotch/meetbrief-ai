
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const configPath = path.join(rootDir, "extension", "config.js");

let env = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
}

const apiUrl = env.NEXT_PUBLIC_API_URL || env.API_URL || "http://localhost:8000";
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "https://your-project-id.supabase.co";
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "your-supabase-anon-key";

const output = `// Auto-generated from .env by scripts/sync-extension-env.js
// DO NOT commit this file to version control.
window.__MEETBRIEF_CONFIG__ = {
  API_URL: ${JSON.stringify(apiUrl)},
  SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
  SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
};
`;

fs.writeFileSync(configPath, output, "utf-8");
console.log(`[MeetBrief AI] Successfully generated extension/config.js from .env`);
console.log(`  API_URL:          ${apiUrl}`);
console.log(`  SUPABASE_URL:     ${supabaseUrl}`);
console.log(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? (supabaseAnonKey.slice(0, 10) + "...") : "none"}`);
