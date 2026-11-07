/**
 * Injected into Google Meet / Zoom / Teams pages.
 * Handles meeting detection AND audio transcription (mic permission comes from the meeting page).
 */
(function () {
  if (window.__meetbriefInjected) return;
  window.__meetbriefInjected = true;

  // ── Meeting detection ──────────────────────────────────────
  function detectMeetingInfo() {
    const url = window.location.href;
    let platform = "unknown";
    let meetingId = "";

    if (url.includes("meet.google.com")) {
      platform = "Google Meet";
      meetingId = url.split("/").pop()?.split("?")[0] || "";
    } else if (url.includes("zoom.us")) {
      platform = "Zoom";
      const m = url.match(/\/(\d{9,11})/);
      meetingId = m ? m[1] : "";
    } else if (url.includes("teams.microsoft.com")) {
      platform = "Microsoft Teams";
      meetingId = Date.now().toString();
    }

    return { platform, meetingId, url };
  }

  chrome.runtime.sendMessage({ type: "MEETING_DETECTED", payload: detectMeetingInfo() });

  // ── MeetBrief badge ────────────────────────────────────────
  function injectBadge() {
    if (document.getElementById("meetbrief-badge")) return;
    const badge = document.createElement("div");
    badge.id = "meetbrief-badge";
    badge.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:999999;
      background:#2563eb;color:white;padding:8px 14px;border-radius:20px;
      font-family:-apple-system,sans-serif;font-size:13px;font-weight:500;
      cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);
      display:flex;align-items:center;gap:6px;
    `;
    badge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
      MeetBrief
    `;
    document.body.appendChild(badge);
  }
  if (document.body) injectBadge();
  else document.addEventListener("DOMContentLoaded", injectBadge);

  // ── Transcription (runs here so mic permission is from the meeting page) ──
  let recognition = null;

  function startRecognition() {
    if (recognition) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      chrome.runtime.sendMessage({ type: "RECORDING_ERROR", error: "speech-recognition-unsupported" });
      return;
    }

    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Pick the alternative with highest confidence for final results
        let best = result[0];
        if (result.isFinal && result.length > 1) {
          for (let j = 1; j < result.length; j++) {
            if (result[j].confidence > best.confidence) best = result[j];
          }
        }
        chrome.runtime.sendMessage({
          type: "TRANSCRIPT_SEGMENT",
          isFinal: result.isFinal,
          text: best.transcript,
          confidence: result.isFinal ? best.confidence : undefined,
        });
      }
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      chrome.runtime.sendMessage({ type: "RECORDING_ERROR", error: e.error });
      if (e.error === "not-allowed") {
        recognition = null; // don't restart
      }
    };

    recognition.onend = () => {
      // Auto-restart unless explicitly stopped
      if (recognition) {
        try { recognition.start(); } catch (_) {}
      }
    };

    try {
      recognition.start();
      chrome.runtime.sendMessage({ type: "RECORDING_STARTED" });
    } catch (e) {
      chrome.runtime.sendMessage({ type: "RECORDING_ERROR", error: e.message });
      recognition = null;
    }
  }

  function stopRecognition() {
    if (recognition) {
      try { recognition.abort(); } catch (_) {}
      recognition = null;
    }
    chrome.runtime.sendMessage({ type: "RECORDING_STOPPED" });
  }

  // ── Message listener (commands from side panel) ───────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "START_RECORDING") {
      startRecognition();
      sendResponse({ ok: true });
    }
    if (msg.type === "STOP_RECORDING") {
      stopRecognition();
      sendResponse({ ok: true });
    }
    if (msg.type === "PING") {
      sendResponse({ ok: true, platform: detectMeetingInfo().platform });
    }
    return true;
  });
})();
