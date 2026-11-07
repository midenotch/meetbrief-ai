# MeetBrief AI — Chrome Extension

A meeting companion that records audio, transcribes in real-time, and generates post-meeting intelligence.

## Setup

### 1. Generate icons
Open `icons/generate-icons.html` in Chrome and click **Generate & Download Icons**.  
Save the three downloaded files (`icon16.png`, `icon48.png`, `icon128.png`) into the `icons/` folder.

### 2. Configure endpoints
In `sidepanel/sidepanel.js`, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to match your Supabase project (from your `.env`), or store them in `chrome.storage.local`.

### 3. Load the extension in Chrome
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder (this directory)

### 4. Sign in
Click the MeetBrief AI icon in the toolbar → the side panel opens.  
Sign in with the same email/password as your MeetBrief web app.

## Usage

1. **Before the meeting**: create the meeting in the web app (`localhost:3000`) and prepare the AI briefing.
2. **During the meeting**: open Google Meet / Zoom / Teams. The side panel opens automatically.
   - Select the matching meeting from the dropdown.
   - Click **Start Recording** (you'll be prompted for microphone access).
   - The live transcript appears in real time.
3. **After the meeting**: click **Stop Recording** then **Generate Post-Meeting Intelligence**.
   - The extension saves the transcript and calls the backend to analyse it with Gemini.
   - You'll see: summary, decisions, action items, unresolved questions, follow-up email, and next steps.
4. **In the web app**: open the meeting → **Post-Meeting** tab to review the intelligence.

## Notes
- The backend must be running at `http://localhost:8000`.
- Transcription uses the browser's built-in Web Speech API (requires internet, Chrome only).
- Recording captures your microphone only — tab audio is not captured (browser limitation in Manifest V3 without additional permissions).
- Always inform all meeting participants that the meeting is being recorded.
