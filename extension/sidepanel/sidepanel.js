/**
 * MeetBrief AI Companion — Side Panel
 * Handles: auth, meeting selection, audio recording, live transcription, post-meeting intelligence.
 */

let API_URL = "http://localhost:8000";
let SUPABASE_URL = "https://your-project-id.supabase.co";
let SUPABASE_ANON_KEY = "your-supabase-anon-or-publishable-key";

// Load user-configured endpoints from local storage if available
chrome.storage.local.get(["apiUrl", "supabaseUrl", "supabaseAnonKey"], (stored) => {
  if (stored.apiUrl) API_URL = stored.apiUrl;
  if (stored.supabaseUrl) SUPABASE_URL = stored.supabaseUrl;
  if (stored.supabaseAnonKey) SUPABASE_ANON_KEY = stored.supabaseAnonKey;
});

// ── State ──────────────────────────────────────────────────────
let accessToken = null;
let selectedMeetingId = null;
let isRecording = false;
let segments = [];
let recordingStart = null;
let timerInterval = null;
let savedTranscriptId = null;

// ── DOM refs ────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const screens = {
  login: $("screen-login"),
  main: $("screen-main"),
  postmeeting: $("screen-postmeeting"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ── Auth ────────────────────────────────────────────────────────
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
  return data.access_token;
}

async function restoreSession() {
  const stored = await chrome.storage.local.get("access_token");
  if (stored.access_token) {
    accessToken = stored.access_token;
    return true;
  }
  return false;
}

// ── Meetings ─────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function loadMeetings() {
  try {
    const meetings = await apiFetch("/api/meetings");
    const sel = $("meeting-select");
    sel.innerHTML = '<option value="">Link to a meeting…</option>';
    meetings.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.title} — ${m.company_or_person || ""}`;
      sel.appendChild(opt);
    });

    // Restore last-selected meeting, or auto-select if only one
    const stored = await chrome.storage.local.get("last_meeting_id");
    const lastId = stored.last_meeting_id;
    if (lastId && meetings.some((m) => m.id === lastId)) {
      sel.value = lastId;
      selectedMeetingId = lastId;
    } else if (meetings.length === 1) {
      sel.value = meetings[0].id;
      selectedMeetingId = meetings[0].id;
    }
  } catch (e) {
    console.error("loadMeetings failed:", e);
  }
}

// ── Status dot ────────────────────────────────────────────────────
function setStatus(state) {
  const dot = $("status-dot");
  dot.className = `status-dot ${state}`;
}

// ── Platform badge ───────────────────────────────────────────────
function updatePlatformBadge(info) {
  const el = $("platform-badge");
  if (info?.platform && info.platform !== "unknown") {
    el.textContent = `📹 ${info.platform} detected`;
    el.classList.remove("hidden");
  }
}

// ── Timer ─────────────────────────────────────────────────────────
function startTimer() {
  recordingStart = Date.now();
  $("recording-timer").classList.remove("hidden");
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStart) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    $("recording-timer").textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  $("recording-timer").classList.add("hidden");
}

function elapsedSeconds() {
  return recordingStart ? Math.floor((Date.now() - recordingStart) / 1000) : 0;
}

// ── Transcript ────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function appendSegment(text, isFinal, speakerLabel = "You") {
  const container = $("transcript-container");

  // Remove empty state
  const empty = container.querySelector(".empty-state");
  if (empty) empty.remove();

  if (!isFinal) {
    // Update or create interim segment
    let interim = container.querySelector(".segment-interim");
    if (!interim) {
      interim = document.createElement("div");
      interim.className = "segment segment-interim";
      container.appendChild(interim);
    }
    interim.innerHTML = `<span class="segment-text">${escapeHtml(text)}</span>`;
  } else {
    // Remove interim
    const interim = container.querySelector(".segment-interim");
    if (interim) interim.remove();

    if (!text.trim()) return;

    const elapsed = elapsedSeconds();
    const seg = { speaker: speakerLabel, text: text.trim(), timestamp: elapsed };
    segments.push(seg);

    const el = document.createElement("div");
    el.className = "segment";
    el.innerHTML = `
      <div class="segment-meta">
        <span class="speaker-label">${escapeHtml(speakerLabel)}</span>
        <span class="segment-time">${formatTime(elapsed)}</span>
      </div>
      <div class="segment-text">${escapeHtml(text.trim())}</div>
    `;
    container.appendChild(el);

    $("segment-count").textContent = segments.length;
  }

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Mic error UI ─────────────────────────────────────────────────
function showMicError(msg) {
  const el = $("mic-error");
  if (msg) el.innerHTML = `<strong>${escapeHtml(msg)}</strong>`;
  el.classList.remove("hidden");
}
function hideMicError() {
  $("mic-error").classList.add("hidden");
}

// ── Meeting link error UI ─────────────────────────────────────────
function showMeetingError() {
  const sel = $("meeting-select");
  sel.style.borderColor = "var(--danger)";
  sel.focus();
  $("meeting-hint").classList.remove("hidden");
}
function hideMeetingError() {
  $("meeting-select").style.borderColor = "";
  $("meeting-hint").classList.add("hidden");
}

// ── Find meeting tab (active first, then any in window) ───────────
const MEETING_PATTERNS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
];

function isMeetingUrl(url) {
  if (!url) return false;
  return MEETING_PATTERNS.some((p) => url.includes(p));
}

async function getActiveMeetingTab() {
  // Check active tab first
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active && isMeetingUrl(active.url)) return active;

  // Fall back: find any meeting tab in this window
  const all = await chrome.tabs.query({ currentWindow: true });
  return all.find((t) => isMeetingUrl(t.url)) || null;
}

async function ensureContentScript(tabId) {
  // Try pinging first; if no response, inject the script dynamically
  try {
    const pong = await chrome.tabs.sendMessage(tabId, { type: "PING" });
    if (pong?.ok) return true;
  } catch (_) {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/meeting-detector.js"],
    });
    // Give it a moment to initialise
    await new Promise((r) => setTimeout(r, 300));
    return true;
  } catch (e) {
    console.error("Could not inject content script:", e);
    return false;
  }
}

// ── Start / stop recording (delegates to content script) ─────────
async function startRecording() {
  if (!selectedMeetingId) {
    showMeetingError();
    return;
  }
  hideMeetingError();

  hideMicError();

  const tab = await getActiveMeetingTab();
  if (!tab) {
    showMicError("No meeting tab found. Make sure Google Meet, Zoom, or Teams is open in this browser window.");
    return;
  }

  // Inject content script if not already there
  const ready = await ensureContentScript(tab.id);
  if (!ready) {
    showMicError("Could not connect to the meeting tab. Try reloading the meeting page.");
    return;
  }

  // Tell content script to start recognition — it has mic permission from the meeting page
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "START_RECORDING" });
  } catch (e) {
    showMicError("Could not start recording: " + e.message);
    return;
  }

  isRecording = true;
  segments = [];
  savedTranscriptId = null;

  const btn = $("btn-record");
  btn.classList.add("recording");
  btn.innerHTML = '<span class="rec-dot"></span> Stop Recording';
  $("btn-generate").classList.add("hidden");
  setStatus("recording");
  startTimer();
}

async function stopRecording() {
  isRecording = false;

  // Tell content script to stop recognition
  try {
    const tab = await getActiveMeetingTab();
    if (tab) await chrome.tabs.sendMessage(tab.id, { type: "STOP_RECORDING" });
  } catch (_) {}

  stopTimer();
  setStatus("processing");

  const btn = $("btn-record");
  btn.classList.remove("recording");
  btn.innerHTML = '<span class="rec-dot"></span> Start Recording';

  // Remove any trailing interim segment
  const interim = $("transcript-container").querySelector(".segment-interim");
  if (interim) interim.remove();

  if (segments.length === 0) {
    setStatus("idle");
    return;
  }

  const rawFullText = segments.map((s) => `[${formatTime(s.timestamp)}] ${s.speaker}: ${s.text}`).join("\n");
  let finalText = rawFullText;
  let finalSegments = segments;

  // Run Gemini cleanup pass if logged in
  if (accessToken) {
    $("cleanup-status").classList.remove("hidden");
    try {
      const cleaned = await apiFetch("/api/transcripts/cleanup", {
        method: "POST",
        body: JSON.stringify({ text: rawFullText }),
      });
      if (cleaned?.cleaned_text) {
        finalText = cleaned.cleaned_text;
        // Rebuild segments from cleaned text so the display matches
        finalSegments = parseCleanedText(finalText, segments);
        renderSegmentsFromCleaned(finalSegments);
      }
    } catch (e) {
      console.warn("Cleanup failed, using raw transcript:", e);
    } finally {
      $("cleanup-status").classList.add("hidden");
    }
  }

  // Save transcript to backend
  try {
    const result = await apiFetch("/api/transcripts", {
      method: "POST",
      body: JSON.stringify({
        meeting_id: selectedMeetingId,
        segments: finalSegments,
        full_text: finalText,
        duration_seconds: elapsedSeconds(),
      }),
    });
    savedTranscriptId = result.id;
    setStatus("done");
    $("btn-generate").classList.remove("hidden");
  } catch (e) {
    console.error("Failed to save transcript:", e);
    setStatus("idle");
    alert("Could not save transcript: " + e.message);
  }
}

function parseCleanedText(cleanedText, originalSegments) {
  // Try to match cleaned lines back to original segments by timestamp prefix
  const lines = cleanedText.split("\n").filter((l) => l.trim());
  const result = [];
  for (const line of lines) {
    const m = line.match(/^\[(\d+:\d+)\]\s+(.+?):\s+(.*)$/);
    if (m) {
      const timeStr = m[1];
      const speaker = m[2];
      const text = m[3];
      const [min, sec] = timeStr.split(":").map(Number);
      const timestamp = min * 60 + sec;
      result.push({ speaker, text, timestamp, confidence: null });
    }
  }
  return result.length > 0 ? result : originalSegments;
}

function renderSegmentsFromCleaned(segs) {
  const container = $("transcript-container");
  container.innerHTML = "";
  for (const s of segs) {
    const div = document.createElement("div");
    div.className = "segment";
    div.innerHTML = `
      <div class="segment-meta">
        <span class="speaker-label">${s.speaker || "You"}</span>
        <span class="segment-time">${formatTime(s.timestamp)}</span>
      </div>
      <div class="segment-text">${s.text}</div>`;
    container.appendChild(div);
  }
  $("segment-count").textContent = segs.length;
}

// ── Post-meeting intelligence ──────────────────────────────────────
async function generatePostMeeting() {
  if (!selectedMeetingId || !savedTranscriptId) return;

  showScreen("postmeeting");
  $("pm-loading").classList.remove("hidden");
  $("pm-content").classList.add("hidden");
  setStatus("processing");

  try {
    const result = await apiFetch(`/api/post-meeting/generate/${selectedMeetingId}`, {
      method: "POST",
      body: JSON.stringify({
        meeting_id: selectedMeetingId,
        transcript_id: savedTranscriptId,
      }),
    });
    renderPostMeeting(result.content);
    setStatus("done");
  } catch (e) {
    alert("Failed to generate intelligence: " + e.message);
    setStatus("idle");
    showScreen("main");
  }
}

function renderPostMeeting(content) {
  $("pm-loading").classList.add("hidden");
  $("pm-content").classList.remove("hidden");

  // Summary
  $("pm-summary").textContent = content.executive_summary || "—";

  // Decisions
  const decisions = $("pm-decisions");
  decisions.innerHTML = "";
  (content.key_decisions || []).forEach((d) => {
    const li = document.createElement("li");
    li.textContent = typeof d === "string" ? d : `${d.decision}${d.owner ? ` (${d.owner})` : ""}`;
    decisions.appendChild(li);
  });
  if (!decisions.children.length) decisions.innerHTML = "<li>No clear decisions recorded.</li>";

  // Action items
  const actions = $("pm-actions");
  actions.innerHTML = "";
  (content.action_items || []).forEach((a) => {
    const item = document.createElement("div");
    item.className = "action-item";
    const pClass = `priority-${(a.priority || "medium").toLowerCase()}`;
    item.innerHTML = `
      <span class="action-priority ${pClass}">${(a.priority || "med").toUpperCase().slice(0, 3)}</span>
      <div class="action-text">
        ${escapeHtml(a.task || a)}
        <div class="action-owner">${escapeHtml(a.owner ? `Owner: ${a.owner}` : "")} ${escapeHtml(a.deadline ? `· Due: ${a.deadline}` : "")}</div>
      </div>
    `;
    actions.appendChild(item);
  });
  if (!actions.children.length) actions.innerHTML = '<p style="color:var(--muted);font-size:12px">No action items captured.</p>';

  // Unresolved questions
  const questions = $("pm-questions");
  questions.innerHTML = "";
  (content.unresolved_questions || []).forEach((q) => {
    const li = document.createElement("li");
    li.textContent = typeof q === "string" ? q : q.question;
    questions.appendChild(li);
  });
  if (!questions.children.length) questions.innerHTML = "<li>No unresolved questions.</li>";

  // Follow-up email
  const email = content.follow_up_email || {};
  $("pm-email-subject").textContent = email.subject ? `Subject: ${email.subject}` : "";
  $("pm-email-body").textContent = email.body || "No email draft generated.";

  // Next steps
  const nextsteps = $("pm-nextsteps");
  nextsteps.innerHTML = "";
  (content.next_steps || []).forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    nextsteps.appendChild(li);
  });
  if (!nextsteps.children.length) nextsteps.innerHTML = "<li>No next steps identified.</li>";
}

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  const hasSession = await restoreSession();
  if (hasSession) {
    showScreen("main");
    await loadMeetings();

    // Check if we're on a meeting page
    const session = await chrome.storage.session.get("meetingInfo");
    if (session.meetingInfo) updatePlatformBadge(session.meetingInfo);
  } else {
    showScreen("login");
  }

  // ── Listen for transcript segments from content script ──
  chrome.runtime.onMessage.addListener((msg) => {
    if (!isRecording) return;
    if (msg.type === "TRANSCRIPT_SEGMENT") {
      appendSegment(msg.text, msg.isFinal);
    }
    if (msg.type === "RECORDING_ERROR") {
      const friendly = msg.error === "not-allowed"
        ? "Microphone blocked by the meeting page. Please allow mic access on the meeting site."
        : `Recording error: ${msg.error}`;
      showMicError(friendly);
      stopRecording();
    }
  });

  // ── Event listeners ──

  // Login
  $("btn-login").addEventListener("click", async () => {
    const email = $("email").value.trim();
    const password = $("password").value;
    const errEl = $("login-error");
    errEl.classList.add("hidden");

    if (!email || !password) {
      errEl.textContent = "Please enter your email and password.";
      errEl.classList.remove("hidden");
      return;
    }

    $("btn-login").disabled = true;
    $("btn-login").textContent = "Signing in…";
    try {
      accessToken = await signIn(email, password);
      await chrome.storage.local.set({ access_token: accessToken });
      showScreen("main");
      await loadMeetings();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove("hidden");
    } finally {
      $("btn-login").disabled = false;
      $("btn-login").textContent = "Sign in";
    }
  });

  // Enter key on login
  [$("email"), $("password")].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("btn-login").click();
    });
  });

  // Sign out
  $("btn-signout").addEventListener("click", async () => {
    accessToken = null;
    await chrome.storage.local.remove("access_token");
    showScreen("login");
  });

  // Refresh meetings
  $("btn-refresh-meetings").addEventListener("click", loadMeetings);

  // Meeting selection
  $("meeting-select").addEventListener("change", (e) => {
    selectedMeetingId = e.target.value || null;
    if (selectedMeetingId) {
      chrome.storage.local.set({ last_meeting_id: selectedMeetingId });
      hideMeetingError();
    }
  });

  // Record toggle
  $("btn-record").addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // Generate post-meeting
  $("btn-generate").addEventListener("click", generatePostMeeting);

  // Back from post-meeting
  $("btn-back").addEventListener("click", () => showScreen("main"));

  // Copy email
  $("btn-copy-email").addEventListener("click", () => {
    const subject = $("pm-email-subject").textContent.replace("Subject: ", "");
    const body = $("pm-email-body").textContent;
    const full = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(full).then(() => {
      $("btn-copy-email").textContent = "Copied!";
      setTimeout(() => { $("btn-copy-email").textContent = "Copy Email"; }, 2000);
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
