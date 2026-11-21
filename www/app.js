(function () {
  let sourceVideoFile = null;
  let sourceVideoUrl = "";
  let wmLogoUrl = "";
  let wmLogoImgEl = null;
  let appliedTranscriptText = "";
  let ccEnabled = true;
  let generatedClips = [];
  let isQueueRunning = false;
  let cancelQueueRequested = false;

  const SUPPORTERS = [
    { name: "Raka P.", role: "Paket Kopi Brutal" },
    { name: "Dina K.", role: "Paket Support Klipper" },
    { name: "Bagas W.", role: "Paket Gaspol FYP" }
  ];

  const I18N = {
    id: {
      sec1Title: "1. Transkrip, CC & Pilot Brutal Klip",
      sec1Sub: "Jika CC ON, terapkan transkrip dulu agar CC aktif sebelum mengisi Pilot Brutal Klip dan fitur edit. Jika CC OFF, Pilot & fitur edit langsung terbuka.",
      lblVideo: "Upload Video Sumber (MP4 / WebM / MOV)",
      noVideo: "Belum ada video dipilih.",
      lblHookMode: "Mode Posisi Hook",
      hookModeHint: "Teks hook diambil dari Pilot Brutal Klip, bukan dari transkrip.",
      transcriptBoxTitle: "Transkrip Video",
      btnApplyTranscript: "Terapkan Transkrip",
      pilotBoxTitle: "Pilot Brutal Klip",
      sec2Title: "2. Kontrol Tampilan, Transisi 0.5s, Kecepatan & Watermark",
      sec2Sub: "Atur kecepatan putar, animasi 0.5s terpisah untuk Video Hook dan Video Isi, serta ukuran, warna, perataan & kepekatan BG Hook/CC/WM terpisah.",
      btnGenerate: "Hasilkan Klip",
      btnDeleteAll: "Hapus Semua Hasil Klip",
      sec4Title: "4. Hasil Klip, Preview VT, Render HD & Analitik",
      sec4Sub: "Klip dirender satu per satu berurutan hingga selesai per klip, lengkap dengan deteksi deskripsi & tagar/hashtag, komentar, serta grafik retensi 1%–90%.",
      sec5Title: "5. Dukungan, Komentar & Pendukung BRUTAL KLIP",
      sec5Sub: "Dukung lewat Trakteer atau kirim nama & komentar dukungan langsung di web.",
      btnSupport: "Traktir di Trakteer"
    },
    en: {
      sec1Title: "1. Transcript, CC & Pilot Brutal Klip",
      sec1Sub: "When CC is ON, apply transcript first so CC is active before filling Pilot Brutal Klip and edit controls. When CC is OFF, Pilot & edit controls open right away.",
      lblVideo: "Upload Source Video (MP4 / WebM / MOV)",
      noVideo: "No video selected yet.",
      lblHookMode: "Hook Position Mode",
      hookModeHint: "Hook text comes from Pilot Brutal Klip, not from the transcript.",
      transcriptBoxTitle: "Video Transcript",
      btnApplyTranscript: "Apply Transcript",
      pilotBoxTitle: "Pilot Brutal Klip",
      sec2Title: "2. Visual Controls, 0.5s Transitions, Speed & Watermark",
      sec2Sub: "Set playback speed, independent 0.5s animations for Hook Video and Body Video, and separate Hook/CC/WM sizes, colors, alignments & BG strength.",
      btnGenerate: "Generate Clips",
      btnDeleteAll: "Delete All Clips",
      sec4Title: "4. Generated Clips, VT Preview, HD Render & Analytics",
      sec4Sub: "Clips render sequentially one by one until each clip finishes, with description & hashtag checks, comments, and 1%–90% retention.",
      sec5Title: "5. Support, Comments & Supporters of BRUTAL KLIP",
      sec5Sub: "Support via Trakteer or send your name & comment directly on the web.",
      btnSupport: "Support on Trakteer"
    }
  };

  const el = (id) => document.getElementById(id);

  function randomNeonColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 66%)`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSupporters() {
    const wrap = el("supporters-list");
    if (!wrap) return;
    wrap.innerHTML = SUPPORTERS.map((s) => {
      const color = s.color || randomNeonColor();
      s.color = color;
      return `<span class="supporter-pill"><span style="color:${color};text-shadow:0 0 8px ${color},0 0 16px ${color};">${escapeHtml(s.name)}</span> <span class="supporter-role">— ${escapeHtml(s.role)}</span></span>`;
    }).join("");
  }

  const supportForm = el("support-comment-form");
  if (supportForm) {
    supportForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const nameInput = el("support-name-input");
      const msgInput = el("support-msg-input");
      const nameVal = nameInput ? nameInput.value.trim() : "";
      const msgVal = msgInput ? msgInput.value.trim() : "";
      if (!nameVal || !msgVal) return;

      SUPPORTERS.push({
        name: nameVal,
        role: msgVal,
        color: randomNeonColor()
      });
      renderSupporters();
      if (nameInput) nameInput.value = "";
      if (msgInput) msgInput.value = "";
    });
  }

  function cleanTranscriptTimestamps(raw) {
    return String(raw || "")
      .replace(/[\[\(]?\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:-|–|—|to|s\/d)\s*\d{1,2}:\d{2}(?::\d{2})?)?\s*[\]\)]?/gi, " ")
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, " ")
      .replace(/^[\s:\-|–—]+|[\s:\-|–—]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function formatSecToMmSs(sec) {
    if (sec === null || sec === undefined || Number.isNaN(sec)) return "";
    const total = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function getPlaybackSpeed() {
    const node = el("playback-speed-select");
    const parsed = node ? parseFloat(node.value) : 1.05;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.05;
  }

  function getAlignValue(selectId) {
    const node = el(selectId);
    const val = node ? node.value : "center";
    if (val === "left" || val === "right" || val === "center") return val;
    return "center";
  }

  function getFontSizeValue(selectId, mapObj, fallback) {
    const node = el(selectId);
    const key = node ? node.value : "medium";
    return mapObj[key] || fallback;
  }

  function getHookCssSize() {
    return getFontSizeValue("hook-size-select", { small: "12px", medium: "13.5px", large: "15.5px" }, "13.5px");
  }

  function getCcCssSize() {
    return getFontSizeValue("cc-size-select", { small: "10.5px", medium: "12px", large: "13.5px" }, "12px");
  }

  function getWmCssSize() {
    return getFontSizeValue("wm-size-select", { small: "9.5px", medium: "11px", large: "12.5px" }, "11px");
  }

  function getWmPosClass() {
    const val = el("wm-pos-select") ? el("wm-pos-select").value : "top-right";
    if (val === "top-left") return "pos-top-left";
    if (val === "bottom-center") return "pos-bottom-center";
    return "pos-top-right";
  }

  function getWmClarity() {
    return el("wm-clarity-select") ? el("wm-clarity-select").value : "solid";
  }

  function applyLanguage(lang) {
    const dict = I18N[lang] || I18N.id;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dict[key]) node.textContent = dict[key];
    });
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyLanguage(btn.dataset.lang || "id");
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  function applyCase(text, mode) {
    if (mode === "upper") return text.toUpperCase();
    if (mode === "lower") return text.toLowerCase();
    if (mode === "title") {
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
    return text;
  }

  function hexToRgba(hex, alpha) {
    const clean = (hex || "#000000").replace("#", "");
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return `rgba(0, 0, 0, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function resolveBgStyle(modeId, colorId, strengthId, defaultAlpha) {
    const mode = el(modeId) ? el(modeId).value : "color";
    if (mode !== "color") return "transparent";
    const color = el(colorId) ? el(colorId).value : "#0b0a0e";
    const strength = el(strengthId) ? el(strengthId).value : "solid";
    const alpha = strength === "fade" ? Math.min(0.45, defaultAlpha * 0.48) : defaultAlpha;
    return hexToRgba(color, alpha);
  }

  function syncSampleVideoSource() {
    const bgVid = el("tiktok-sample-bg-video");
    const ytVid = el("tiktok-sample-yt-video");
    const ytPh = el("tiktok-sample-yt-placeholder");
    const speed = getPlaybackSpeed();

    if (sourceVideoUrl) {
      if (bgVid) {
        if (bgVid.getAttribute("src") !== sourceVideoUrl) {
          bgVid.src = sourceVideoUrl;
          bgVid.style.display = "block";
          bgVid.load();
        }
        bgVid.playbackRate = speed;
        bgVid.play().catch(() => {});
      }
      if (ytVid) {
        if (ytVid.getAttribute("src") !== sourceVideoUrl) {
          ytVid.src = sourceVideoUrl;
          ytVid.style.display = "block";
          ytVid.load();
        }
        ytVid.playbackRate = speed;
        ytVid.play().catch(() => {});
      }
      if (ytPh) ytPh.style.display = "none";
    } else {
      if (bgVid) {
        bgVid.pause();
        bgVid.removeAttribute("src");
        bgVid.style.display = "none";
      }
      if (ytVid) {
        ytVid.pause();
        ytVid.removeAttribute("src");
        ytVid.style.display = "none";
      }
      if (ytPh) ytPh.style.display = "inline";
    }
  }

  function updateTranscriptAppliedBanner() {
    const banner = el("transcript-applied-preview");
    if (!banner) return;
    if (!ccEnabled) {
      banner.style.display = "none";
      banner.textContent = "";
      return;
    }
    const cleanCc = cleanTranscriptTimestamps(appliedTranscriptText);
    if (!cleanCc) {
      banner.style.display = "none";
      banner.textContent = "";
      return;
    }
    const wordCount = cleanCc.split(/\s+/).filter(Boolean).length;
    const ccCase = el("cc-case-select") ? el("cc-case-select").value : "normal";
    const previewCc = applyCase(cleanCc, ccCase);
    banner.style.display = "block";
    banner.innerHTML = `<strong>Transkrip Berhasil Diterapkan (${wordCount} kata, tanpa keterangan waktu):</strong> "${escapeHtml(previewCc.slice(0, 140))}${previewCc.length > 140 ? "..." : ""}"`;
  }

  function updateTikTokSamplePreview() {
    const frame = el("tiktok-preview-frame");
    const hookNode = el("tiktok-sample-hook");
    const ccNode = el("tiktok-sample-cc");
    const wmNode = el("tiktok-sample-wm");
    const wmTextNode = el("tiktok-sample-wm-text");
    const wmLogoNode = el("tiktok-sample-wm-logo");
    const speedBadge = el("tiktok-speed-badge");
    if (!frame || !hookNode || !ccNode || !wmNode || !wmTextNode) return;

    const speed = getPlaybackSpeed();
    if (speedBadge) {
      speedBadge.textContent = `9:16 • Speed ${speed}x`;
    }

    const fontFamily = el("font-family-select").value;
    const hookCase = el("hook-case-select").value;
    const ccCase = el("cc-case-select").value;
    const hookAlign = getAlignValue("hook-align-select");
    const ccAlign = getAlignValue("cc-align-select");
    const hookColor = el("hook-color-input").value;
    const ccColor = el("cc-color-input").value;

    const hookBgStyle = resolveBgStyle("hook-bg-mode", "hook-bg-color", "hook-bg-strength", 0.92);
    const ccBgStyle = resolveBgStyle("cc-bg-mode", "cc-bg-color", "cc-bg-strength", 0.86);

    const wmText = el("wm-text").value || "@BRUTALKLIP";
    const wmColor = el("wm-color-input").value;
    const wmBgStyle = resolveBgStyle("wm-bg-mode", "wm-bg-input", "wm-bg-strength", 0.85);
    const wmPosClass = getWmPosClass();
    const wmClarity = getWmClarity();

    frame.style.fontFamily = fontFamily;

    hookNode.textContent = applyCase("Contoh Hook Utama VT", hookCase);
    hookNode.style.fontSize = getHookCssSize();
    hookNode.style.textAlign = hookAlign;
    hookNode.style.color = hookColor;
    hookNode.style.background = hookBgStyle;

    const cleanCc = cleanTranscriptTimestamps(appliedTranscriptText);
    const ccSource =
      ccEnabled && cleanCc
        ? cleanCc
        : "Contoh closed caption sesuai pengaturan warna, font & kepekatan background.";
    ccNode.textContent = applyCase(ccSource.slice(0, 92), ccCase);
    ccNode.style.fontSize = getCcCssSize();
    ccNode.style.textAlign = ccAlign;
    ccNode.style.color = ccColor;
    ccNode.style.background = ccBgStyle;
    ccNode.style.display = ccEnabled ? "block" : "none";

    wmNode.className = `tiktok-wm ${wmPosClass}`;
    wmNode.style.fontSize = getWmCssSize();
    wmNode.style.color = wmColor;
    wmNode.style.background = wmBgStyle;
    wmNode.style.opacity = wmClarity === "faded" ? "0.52" : "1";
    wmTextNode.textContent = wmText;

    if (wmLogoNode) {
      if (wmLogoUrl) {
        wmLogoNode.src = wmLogoUrl;
        wmLogoNode.style.display = "inline-block";
      } else {
        wmLogoNode.removeAttribute("src");
        wmLogoNode.style.display = "none";
      }
    }

    syncSampleVideoSource();
    updateTranscriptAppliedBanner();
  }

  function syncPreviewSpeed() {
    const speed = getPlaybackSpeed();
    document.querySelectorAll(".vt-video, .vt-bg-916").forEach((vid) => {
      if (vid.tagName === "VIDEO") {
        vid.playbackRate = speed;
      }
    });
    updateTikTokSamplePreview();
  }

  function setControlsLocked(locked, reasonText) {
    const pilotBox = el("pilot-box");
    const editingPanel = el("editing-panel");
    const btnGen = el("btn-generate-clips");

    pilotBox.classList.toggle("is-locked", locked);
    editingPanel.classList.toggle("is-locked", locked);
    btnGen.disabled = locked || isQueueRunning;

    pilotBox.querySelectorAll("input, textarea, select, button").forEach((ctrl) => {
      if (!ctrl.classList.contains("mode-btn")) ctrl.disabled = locked || isQueueRunning;
    });
    editingPanel.querySelectorAll("input, textarea, select, button").forEach((ctrl) => {
      ctrl.disabled = locked || isQueueRunning;
    });

    if (reasonText) {
      el("pilot-status").textContent = reasonText;
      el("process-feedback").textContent = reasonText;
    }
  }

  function syncCcWorkflow() {
    const btnCc = el("btn-cc-toggle");
    btnCc.textContent = ccEnabled ? "CC: ON" : "CC: OFF";
    btnCc.classList.toggle("active", ccEnabled);
    btnCc.dataset.cc = ccEnabled ? "on" : "off";

    if (!ccEnabled) {
      el("transcript-status").textContent = "CC OFF — Tidak memakai transkrip/CC";
      setControlsLocked(false, "CC OFF: Pilot Brutal Klip & fitur editing terbuka.");
      updateTikTokSamplePreview();
      if (generatedClips.length) renderClips();
      return;
    }

    const cleanWords = cleanTranscriptTimestamps(appliedTranscriptText)
      .split(/\s+/)
      .filter(Boolean).length;
    const ccReady = Boolean(appliedTranscriptText.trim()) && cleanWords > 0;
    if (!ccReady) {
      el("transcript-status").textContent = "CC ON — Isi & klik Terapkan Transkrip dulu";
      setControlsLocked(
        true,
        "CC ON: Terapkan transkrip dulu agar CC berjalan normal sebelum mengisi Pilot Brutal Klip dan membuat klip."
      );
    } else {
      el("transcript-status").textContent = `CC ON & Aktif (${cleanWords} kata bersih)`;
      setControlsLocked(
        false,
        `CC ON & aktif (${cleanWords} kata bersih tanpa waktu): Pilot Brutal Klip & fitur edit sudah terbuka.`
      );
      if (generatedClips.length) renderClips();
    }
    updateTikTokSamplePreview();
  }

  [
    "font-family-select",
    "hook-case-select",
    "cc-case-select",
    "hook-align-select",
    "cc-align-select",
    "hook-size-select",
    "cc-size-select",
    "wm-size-select",
    "hook-color-input",
    "cc-color-input",
    "hook-bg-mode",
    "hook-bg-color",
    "hook-bg-strength",
    "cc-bg-mode",
    "cc-bg-color",
    "cc-bg-strength",
    "wm-pos-select",
    "wm-clarity-select",
    "wm-text",
    "wm-color-input",
    "wm-bg-mode",
    "wm-bg-strength",
    "wm-bg-input"
  ].forEach((id) => {
    const node = el(id);
    if (!node) return;
    node.addEventListener("input", () => {
      updateTikTokSamplePreview();
      if (generatedClips.length && !isQueueRunning) renderClips();
    });
    node.addEventListener("change", () => {
      updateTikTokSamplePreview();
      if (generatedClips.length && !isQueueRunning) renderClips();
    });
  });

  const speedSelect = el("playback-speed-select");
  if (speedSelect) {
    speedSelect.addEventListener("change", () => {
      syncPreviewSpeed();
      if (generatedClips.length && !isQueueRunning) renderClips();
    });
  }

  const briefTagsInput = el("brief-tags-input");
  if (briefTagsInput) {
    briefTagsInput.addEventListener("input", () => {
      if (generatedClips.length && !isQueueRunning) {
        recomputeAllClipAudits();
        renderClips();
      }
    });
  }

  el("wm-logo-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (wmLogoUrl) URL.revokeObjectURL(wmLogoUrl);
    wmLogoUrl = URL.createObjectURL(file);
    wmLogoImgEl = new Image();
    wmLogoImgEl.src = wmLogoUrl;
    el("wm-logo-info").textContent = `Logo WM: ${file.name}`;
    updateTikTokSamplePreview();
    if (generatedClips.length && !isQueueRunning) renderClips();
  });

  el("btn-cc-toggle").addEventListener("click", () => {
    ccEnabled = !ccEnabled;
    syncCcWorkflow();
  });

  function setupModeLock(group) {
    const buttons = document.querySelectorAll(`.mode-btn[data-group="${group}"]`);
    const manualWrap = el(`${group}-manual-wrap`);
    const fileWrap = el(`${group}-file-wrap`);
    const fileInput = el(`${group}-file`);

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        buttons.forEach((b) => b.classList.toggle("active", b === btn));

        if (mode === "manual") {
          manualWrap.classList.remove("is-locked");
          fileWrap.classList.add("is-locked");
          if (fileInput) fileInput.disabled = true;
        } else {
          fileWrap.classList.remove("is-locked");
          manualWrap.classList.add("is-locked");
          if (fileInput) fileInput.disabled = false;
        }
      });
    });
  }

  setupModeLock("transcript");
  setupModeLock("pilot");

  async function readGroupText(group) {
    const activeBtn = document.querySelector(`.mode-btn[data-group="${group}"].active`);
    const mode = activeBtn ? activeBtn.dataset.mode : "manual";
    if (mode === "file") {
      const input = el(`${group}-file`);
      const file = input && input.files && input.files[0];
      if (!file) return "";
      return await file.text();
    }
    const ta = el(`${group}-manual`);
    return ta ? ta.value.trim() : "";
  }

  el("btn-apply-transcript").addEventListener("click", async () => {
    const text = await readGroupText("transcript");
    if (!text) {
      appliedTranscriptText = "";
      syncCcWorkflow();
      return;
    }
    appliedTranscriptText = text;
    syncCcWorkflow();
  });

  el("video-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    sourceVideoFile = file;
    if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
    sourceVideoUrl = URL.createObjectURL(file);
    el("video-info").textContent = `Dipilih: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
    syncSampleVideoSource();
    if (generatedClips.length && !isQueueRunning) renderClips();
  });

  function parseTimeToSec(str) {
    if (!str) return null;
    const parts = str.trim().split(":").map(Number);
    if (parts.some(Number.isNaN)) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  function extractTimeRange(text) {
    const match = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–to]+\s*(\d{1,2}:\d{2}(?::\d{2})?)/i);
    if (!match) return { startSec: null, endSec: null, label: "" };
    return {
      startSec: parseTimeToSec(match[1]),
      endSec: parseTimeToSec(match[2]),
      label: `${match[1]} - ${match[2]}`
    };
  }

  function parsePilotSegments(rawText) {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const blocks = [];
    let current = null;

    for (const line of lines) {
      const markerMatch = line.match(/^(?:\*\*\s*)?(?:(hook|klip)\s*(\d+))\b(.*)$/i);
      if (markerMatch) {
        if (current) blocks.push(current);
        const type = markerMatch[1].toLowerCase();
        const num = Number(markerMatch[2]);
        const rest = (markerMatch[3] || "").replace(/\*\*$/g, "");
        const range = extractTimeRange(line);
        current = {
          type,
          num,
          startSec: range.startSec,
          endSec: range.endSec,
          timeLabel: range.label,
          lines: rest ? [rest.replace(/^[:\-–|\s]+/, "")] : []
        };
      } else if (current) {
        const range = extractTimeRange(line);
        if (current.startSec === null && range.startSec !== null) current.startSec = range.startSec;
        if (current.endSec === null && range.endSec !== null) current.endSec = range.endSec;
        if (!current.timeLabel && range.label) current.timeLabel = range.label;
        current.lines.push(line);
      }
    }
    if (current) blocks.push(current);

    if (!blocks.length && lines.length > 0) {
      const range = extractTimeRange(rawText);
      const hookMatch = rawText.match(/hook\s*[:\-]\s*([^\n|]+)/i);
      blocks.push({
        type: "klip",
        num: 1,
        startSec: range.startSec,
        endSec: range.endSec,
        timeLabel: range.label,
        lines: [hookMatch ? `Hook: ${hookMatch[1].trim()}` : rawText.slice(0, 120)]
      });
    }

    const groupedMap = new Map();
    for (const b of blocks) {
      const key = `${b.num}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          num: b.num,
          title: `VT #${b.num}`,
          timeLabel: b.timeLabel || "",
          hookText: "",
          hookStartSec: null,
          hookEndSec: null,
          bodyText: "",
          bodyStartSec: null,
          bodyEndSec: null,
          pilotDescText: "",
          isTrailingHook: false,
          movedToFront: false
        });
      }
      const item = groupedMap.get(key);
      if (!item.timeLabel && b.timeLabel) item.timeLabel = b.timeLabel;

      const joined = b.lines.join(" ").trim();

      const captionLineMatch = joined.match(/(?:caption\s*(?:&|dan)?\s*tagar\s*\d*|deskripsi|caption)\s*[:\-]\s*([\s\S]+)/i);
      if (captionLineMatch) {
        item.pilotDescText = captionLineMatch[1].trim();
      }

      const inlineHookMatch = joined.match(/hook\s*[:\-]\s*([^|]+)(?:\||$)/i);
      if (inlineHookMatch && !item.hookText) {
        item.hookText = inlineHookMatch[1].trim();
      }

      if (b.type === "hook") {
        const cleanHook = joined.replace(/^hook\s*\d*\s*[:\-–]?\s*/i, "").trim();
        item.hookText = cleanHook || `Hook ${b.num}`;
        item.hookStartSec = b.startSec;
        item.hookEndSec = b.endSec;
      } else {
        const cleanBody = joined
          .replace(/\|?\s*hook\s*[:\-]\s*[^|]+/i, "")
          .replace(/^isi\s*klip\s*\d*\s*[:\-–]?\s*/i, "")
          .trim();
        item.bodyText = cleanBody || `Klip ${b.num}`;
        item.bodyStartSec = b.startSec;
        item.bodyEndSec = b.endSec;
      }
    }

    const clips = Array.from(groupedMap.values());
    const reorderMode = el("hook-reorder-mode").value;

    for (const clip of clips) {
      const bodyEnd = clip.bodyEndSec ?? (clip.bodyStartSec !== null ? clip.bodyStartSec + 45 : 60);
      const bodyStart = clip.bodyStartSec ?? 0;
      const midPoint = bodyStart + (bodyEnd - bodyStart) * 0.5;

      const hookAtBack =
        clip.hookStartSec !== null &&
        (clip.hookStartSec >= midPoint || (clip.bodyEndSec !== null && clip.hookStartSec >= clip.bodyEndSec - 15));

      clip.isTrailingHook = Boolean(hookAtBack);
      clip.movedToFront = reorderMode === "auto-front" && clip.isTrailingHook;

      if (clip.bodyStartSec === null) clip.bodyStartSec = (clip.num - 1) * 30;
      if (clip.bodyEndSec === null) clip.bodyEndSec = clip.bodyStartSec + 25;
      if (!clip.timeLabel) {
        clip.timeLabel = `${formatSecToMmSs(clip.bodyStartSec)} - ${formatSecToMmSs(clip.bodyEndSec)}`;
      }
      if (clip.hookStartSec === null) clip.hookStartSec = clip.bodyStartSec;
      if (clip.hookEndSec === null) clip.hookEndSec = Math.min(clip.bodyEndSec, clip.hookStartSec + 4);
      if (!clip.hookText) clip.hookText = `Hook ${clip.num}`;
      if (!clip.bodyText) clip.bodyText = `Cuplikan utama Klip ${clip.num}`;
    }

    return clips;
  }

  function tokenizeMeaningful(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[#@][\w.]+/g, " ")
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);
  }

  function extractTagsAndMentions(text) {
    const hashtags = Array.from(new Set((text.match(/#[\w\u00C0-\u024F]+/g) || []).map((t) => t.toLowerCase())));
    const mentions = Array.from(new Set((text.match(/@[\w.]+/g) || []).map((m) => m.toLowerCase())));
    return { hashtags, mentions };
  }

  function evaluateClipAudit(clip, allClips) {
    const rawDesc = (clip.pilotDescText || clip.description || "").trim();
    const descNoTags = rawDesc.replace(/[#@][\w.]+/g, " ").trim();
    const descTokens = tokenizeMeaningful(descNoTags);
    const contextTokens = new Set([
      ...tokenizeMeaningful(clip.hookText),
      ...tokenizeMeaningful(clip.bodyText)
    ]);

    const overlap = descTokens.filter((tok) => contextTokens.has(tok));
    const otherClipOverlap = allClips
      .filter((other) => other.num !== clip.num)
      .some((other) => {
        const otherSet = new Set([
          ...tokenizeMeaningful(other.hookText),
          ...tokenizeMeaningful(other.bodyText)
        ]);
        const hits = descTokens.filter((t) => otherSet.has(t));
        return hits.length >= 2 && overlap.length === 0;
      });

    let descOk = true;
    let descMessage = `Sesuai konteks Klip ${clip.num} (${clip.timeLabel}).`;

    if (descTokens.length < 3) {
      descOk = false;
      descMessage = `Deskripsi Klip ${clip.num} terlalu singkat/kosong; pastikan selaras dengan hook & menit ${clip.timeLabel}.`;
    } else if (otherClipOverlap) {
      descOk = false;
      descMessage = `Deskripsi berpotensi tertukar dengan klip lain; cek kembali kecocokan dengan isi & hook Klip ${clip.num}.`;
    } else if (overlap.length === 0) {
      descOk = false;
      descMessage = `Kata kunci deskripsi belum nyambung langsung dengan isi/hook Klip ${clip.num} (${clip.timeLabel}).`;
    }

    const clipTagsObj = extractTagsAndMentions(rawDesc || `${clip.hookText} ${clip.bodyText}`);
    const clipAllMarkers = [...clipTagsObj.hashtags, ...clipTagsObj.mentions];

    const briefRaw = el("brief-tags-input") ? el("brief-tags-input").value.trim() : "";
    const briefObj = extractTagsAndMentions(briefRaw);
    const briefAllMarkers = [...briefObj.hashtags, ...briefObj.mentions];

    let tagOk = true;
    let tagMessage =
      clipAllMarkers.length > 0
        ? `${clipAllMarkers.length} tagar/mention terdeteksi pada klip.`
        : "Belum ada tagar/hashtag pada deskripsi klip.";
    const offBriefSet = new Set();

    if (briefAllMarkers.length > 0) {
      const missingRequired = briefAllMarkers.filter((req) => !clipAllMarkers.includes(req));
      const extraNonBrief = clipAllMarkers.filter((tag) => !briefAllMarkers.includes(tag));
      extraNonBrief.forEach((t) => offBriefSet.add(t));

      if (missingRequired.length > 0 || extraNonBrief.length > 0) {
        tagOk = false;
        const parts = [];
        if (missingRequired.length > 0) {
          parts.push(`kurang wajib brief: ${missingRequired.join(", ")}`);
        }
        if (extraNonBrief.length > 0) {
          parts.push(`di luar brief: ${extraNonBrief.join(", ")}`);
        }
        tagMessage = `Cek tagar (${parts.join(" | ")}).`;
      } else {
        tagMessage = "Semua tagar/hashtag/mention sesuai brief.";
      }
    }

    return {
      descOk,
      descMessage,
      tagOk,
      tagMessage,
      clipAllMarkers,
      offBriefMarkers: Array.from(offBriefSet)
    };
  }

  function recomputeAllClipAudits() {
    for (const clip of generatedClips) {
      clip.audit = evaluateClipAudit(clip, generatedClips);
      clip.tagsAndMentions = clip.audit.clipAllMarkers;
    }
  }

  function getAnimClass(type, pos, stage) {
    if (!type || type === "none") return "";
    const map = {
      fade: stage === "out" ? "anim-05s-fade-out" : "anim-05s-fade-in",
      zoom: stage === "out" ? "anim-05s-zoom-out" : "anim-05s-zoom-in",
      shake: "anim-05s-shake",
      slide: stage === "out" ? "anim-05s-slide-out" : "anim-05s-slide-in"
    };
    if (pos === "both") return map[type] || "";
    if (pos === stage) return map[type] || "";
    return "";
  }

  function buildRetentionAnalytics(clip, pilotText, ccActive, transcriptText) {
    const base = clip.movedToFront ? 76 : 64;
    const bonus = Math.min(14, (ccActive && transcriptText ? 6 : 0) + (pilotText.length > 0 ? 5 : 0) + (clip.num % 3));
    const fypScore = Math.min(96, base + bonus);

    const points = [];
    for (let i = 0; i < 10; i++) {
      const drop = i * 4.5 - (clip.movedToFront && i < 3 ? 6 : 0);
      const val = Math.max(12, Math.min(90, Math.round(fypScore - drop)));
      points.push(val);
    }

    const reasonParts = [];
    if (clip.movedToFront) {
      reasonParts.push("Hook dari Pilot dipindah ke depan VT agar pembuka lebih kuat");
    }
    if (ccActive && transcriptText) {
      reasonParts.push("CC aktif sinkron dengan transkrip yang sudah diterapkan");
    } else if (!ccActive) {
      reasonParts.push("mode CC OFF fokus pada ritme hook & potongan Pilot");
    }
    const reason = `Retensi terjaga karena ${reasonParts.join(", ")}.`;

    const sampleUsers = ["@klip_ace", "@vid_hunter", "@edit_lab"];
    const sampleComments = [
      "Pembukanya langsung kena sih ini.",
      "Bagian hook ditaruh depan jadi makin pas.",
      "Potongan klipnya rapi dan enak ditonton."
    ];

    const comments = sampleUsers.map((user, idx) => ({
      author: user,
      authorColor: randomNeonColor(),
      text: sampleComments[idx]
    }));

    return { fypScore, points, reason, comments };
  }

  function renderCommentsHtml(comments) {
    return comments
      .map(
        (c) =>
          `<div class="comment-item"><span class="comment-author" style="color:${c.authorColor};text-shadow:0 0 8px ${c.authorColor},0 0 16px ${c.authorColor};">${escapeHtml(c.author)}</span><span class="comment-body">${escapeHtml(c.text)}</span></div>`
      )
      .join("");
  }

  function renderClips() {
    const container = el("clips-container");
    const speed = getPlaybackSpeed();

    el("btn-export-zip").disabled = generatedClips.length === 0 || isQueueRunning;

    if (!generatedClips.length) {
      container.innerHTML =
        '<p class="empty-state">Belum ada klip dihasilkan. Isi <strong>Pilot Brutal Klip</strong> lalu klik <strong>Hasilkan Klip</strong>.</p>';
      return;
    }

    const fontFamily = el("font-family-select").value;
    const hookCase = el("hook-case-select").value;
    const ccCase = el("cc-case-select").value;
    const hookAlign = getAlignValue("hook-align-select");
    const ccAlign = getAlignValue("cc-align-select");
    const hookSize = getHookCssSize();
    const ccSize = getCcCssSize();
    const wmSize = getWmCssSize();
    const hookColor = el("hook-color-input").value;
    const ccColor = el("cc-color-input").value;

    const hookBgStyle = resolveBgStyle("hook-bg-mode", "hook-bg-color", "hook-bg-strength", 0.92);
    const ccBgStyle = resolveBgStyle("cc-bg-mode", "cc-bg-color", "cc-bg-strength", 0.86);

    const wmText = el("wm-text").value || "@BRUTALKLIP";
    const wmColor = el("wm-color-input").value;
    const wmBgStyle = resolveBgStyle("wm-bg-mode", "wm-bg-input", "wm-bg-strength", 0.85);
    const wmPosClass = getWmPosClass();
    const wmClarity = getWmClarity();
    const wmOpacity = wmClarity === "faded" ? "0.52" : "1";

    const hookAnimType = el("hook-anim-type").value;
    const hookAnimPos = el("hook-anim-pos").value;
    const bodyAnimType = el("body-anim-type").value;
    const bodyAnimPos = el("body-anim-pos").value;

    const hookAnimClass = getAnimClass(hookAnimType, hookAnimPos, "in");
    const bodyAnimClass = getAnimClass(bodyAnimType, bodyAnimPos, "in");

    const cleanCc = cleanTranscriptTimestamps(appliedTranscriptText);

    container.innerHTML = "";

    for (const clip of generatedClips) {
      const card = document.createElement("article");
      card.className = "clip-card";
      card.dataset.clipNum = String(clip.num);

      const formattedHook = applyCase(clip.hookText, hookCase);
      const formattedCc = ccEnabled && cleanCc ? applyCase(cleanCc, ccCase) : "";

      const barsHtml = clip.analytics.points
        .map(
          (val) =>
            `<div class="retention-bar-wrap" title="${val}%"><div class="retention-bar" style="height:${val}%"></div></div>`
        )
        .join("");

      const tagsHtml = clip.tagsAndMentions
        .map((t) => {
          const isOff = clip.audit && clip.audit.offBriefMarkers.includes(t);
          return `<span class="tag-pill ${isOff ? "is-offbrief" : ""}">${escapeHtml(t)}${isOff ? " (luar brief)" : ""}</span>`;
        })
        .join("");

      const downloadVisible = clip.renderedBlob ? "inline-flex" : "none";
      const downloadHref = clip.renderedBlob ? URL.createObjectURL(clip.renderedBlob) : "";
      const downloadName = `brutal-klip-${clip.num}-${clip.renderedSpeed || speed}x.webm`;
      const initialRenderStatus = clip.renderedBlob
        ? `Selesai (${clip.renderedSpeed || speed}x) • Siap diunduh atau masuk ZIP.`
        : sourceVideoFile
          ? `Menunggu antrean render HD (${speed}x, 720x1280).`
          : "Draft siap • Upload video sumber untuk render HD.";

      card.innerHTML = `
        <div class="clip-header">
          <h3 class="clip-title">${escapeHtml(clip.title)} (${escapeHtml(clip.timeLabel)})</h3>
          <span class="clip-badge">${clip.movedToFront ? "Hook ke Depan" : "Urutan Pilot"} • ${speed}x</span>
        </div>

        <div class="vt-stage" style="font-family:${fontFamily};">
          ${
            sourceVideoUrl
              ? `<video class="vt-bg-916" src="${sourceVideoUrl}" muted loop playsinline></video>`
              : ""
          }
          <div class="vt-dim-overlay" aria-hidden="true"></div>
          <div class="vt-hook-box ${hookAnimClass}" style="font-size:${hookSize};text-align:${hookAlign};color:${hookColor};background:${hookBgStyle};">
            ${escapeHtml(formattedHook)}
          </div>
          <div class="vt-yt-slot">
            ${
              sourceVideoUrl
                ? `<video class="vt-video ${bodyAnimClass}" src="${sourceVideoUrl}" controls playsinline></video>`
                : `<div class="vt-video ${bodyAnimClass}" style="display:grid;place-items:center;color:#9e97ae;font-size:12px;">Upload video sumber untuk preview &amp; render HD</div>`
            }
          </div>
          ${
            ccEnabled && formattedCc
              ? `<div class="vt-cc-box" style="font-size:${ccSize};text-align:${ccAlign};color:${ccColor};background:${ccBgStyle};">${escapeHtml(formattedCc.slice(0, 110))}</div>`
              : ""
          }
          <div class="vt-wm-box ${wmPosClass}" style="font-size:${wmSize};color:${wmColor};background:${wmBgStyle};opacity:${wmOpacity};">
            ${wmLogoUrl ? `<img class="wm-logo-img" src="${wmLogoUrl}" alt="" />` : ""}
            <span>${escapeHtml(wmText)}</span>
          </div>
        </div>

        <div class="clip-actions">
          <button type="button" class="btn-primary btn-render-hd" data-clip-num="${clip.num}" ${isQueueRunning ? "disabled" : ""}>Render Ulang (${speed}x)</button>
          <a class="btn-secondary btn-download-clip" style="display:${downloadVisible};" ${downloadHref ? `href="${downloadHref}"` : ""} download="${downloadName}">Unduh Hasil</a>
        </div>
        <small class="hint render-status">${escapeHtml(initialRenderStatus)}</small>

        <div class="clip-desc">${escapeHtml(clip.description)}</div>

        <div class="audit-box">
          <div class="audit-row">
            <span class="audit-detail">${escapeHtml(clip.audit.descMessage)}</span>
            <span class="audit-pill ${clip.audit.descOk ? "is-ok" : "is-warn"}">${clip.audit.descOk ? "Deskripsi OK" : "Cek Deskripsi"}</span>
          </div>
          <div class="audit-row">
            <span class="audit-detail">${escapeHtml(clip.audit.tagMessage)}</span>
            <span class="audit-pill ${clip.audit.tagOk ? "is-ok" : "is-warn"}">${clip.audit.tagOk ? "Tagar OK" : "Cek Tagar"}</span>
          </div>
        </div>

        ${tagsHtml ? `<div class="tags-row">${tagsHtml}</div>` : ""}

        <div class="retention-box">
          <div class="retention-head">
            <strong>Grafik Retensi (1%–90%)</strong>
            <span>Skor FYP: <strong>${clip.analytics.fypScore}/100</strong></span>
          </div>
          <div class="retention-bars">${barsHtml}</div>
          <p class="retention-reason">${escapeHtml(clip.analytics.reason)}</p>
        </div>

        <div class="comments-box">
          <div class="comments-list">${renderCommentsHtml(clip.analytics.comments)}</div>
          <form class="comment-form" data-clip-num="${clip.num}">
            <input type="text" class="comment-name-input" placeholder="Nama / @akun" maxlength="32" required />
            <input type="text" class="comment-text-input" placeholder="Tulis komentar..." maxlength="160" required />
            <button type="submit" class="btn-secondary">Kirim</button>
          </form>
        </div>
      `;

      const vidEl = card.querySelector("video.vt-video");
      const bgVidEl = card.querySelector("video.vt-bg-916");
      if (vidEl) {
        vidEl.playbackRate = speed;
        vidEl.addEventListener("loadedmetadata", () => {
          vidEl.playbackRate = getPlaybackSpeed();
        });
        if (bgVidEl) {
          bgVidEl.playbackRate = speed;
          vidEl.addEventListener("play", () => bgVidEl.play().catch(() => {}));
          vidEl.addEventListener("pause", () => bgVidEl.pause());
          vidEl.addEventListener("seeked", () => {
            bgVidEl.currentTime = vidEl.currentTime;
          });
        }
      }

      const commentForm = card.querySelector(".comment-form");
      const commentsList = card.querySelector(".comments-list");
      commentForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const nameInput = commentForm.querySelector(".comment-name-input");
        const textInput = commentForm.querySelector(".comment-text-input");
        const rawName = nameInput.value.trim();
        const rawComment = textInput.value.trim();
        if (!rawName || !rawComment) return;

        const formattedAuthor = rawName.startsWith("@") ? rawName : `@${rawName}`;
        clip.analytics.comments.push({
          author: formattedAuthor,
          authorColor: randomNeonColor(),
          text: rawComment
        });
        commentsList.innerHTML = renderCommentsHtml(clip.analytics.comments);
        nameInput.value = "";
        textInput.value = "";
      });

      const btnRender = card.querySelector(".btn-render-hd");
      const linkDownload = card.querySelector(".btn-download-clip");
      const statusEl = card.querySelector(".render-status");

      btnRender.addEventListener("click", async () => {
        if (!sourceVideoFile) {
          statusEl.textContent = "Pilih video sumber terlebih dahulu.";
          return;
        }
        if (isQueueRunning) return;
        isQueueRunning = true;
        cancelQueueRequested = false;
        el("btn-stop-queue").disabled = false;
        el("btn-generate-clips").disabled = true;
        btnRender.disabled = true;

        const activeSpeed = getPlaybackSpeed();
        statusEl.textContent = `Merender ${clip.title} (${activeSpeed}x) sinkron audio & gerak...`;
        try {
          const blob = await renderClipHdBlob(
            clip,
            formattedHook,
            formattedCc,
            wmText,
            activeSpeed,
            {
              hookColor,
              ccColor,
              wmColor,
              hookBgStyle,
              ccBgStyle,
              wmBgStyle,
              hookAlign,
              ccAlign,
              wmPos: el("wm-pos-select").value,
              wmClarity,
              hookSizePx: getFontSizeValue("hook-size-select", { small: 28, medium: 32, large: 37 }, 32),
              ccSizePx: getFontSizeValue("cc-size-select", { small: 22, medium: 25, large: 29 }, 25),
              wmSizePx: getFontSizeValue("wm-size-select", { small: 18, medium: 21, large: 25 }, 21)
            },
            (pct) => {
              statusEl.textContent = `Rendering ${clip.title} (${activeSpeed}x): ${pct}%`;
            }
          );
          const url = URL.createObjectURL(blob);
          clip.renderedBlob = blob;
          clip.renderedSpeed = activeSpeed;
          linkDownload.href = url;
          linkDownload.download = `brutal-klip-${clip.num}-${activeSpeed}x.webm`;
          linkDownload.style.display = "inline-flex";
          statusEl.textContent = `Render ${clip.title} (${activeSpeed}x) selesai.`;
        } catch (err) {
          statusEl.textContent = "Render gagal: " + (err && err.message ? err.message : "browser tidak mendukung");
        } finally {
          isQueueRunning = false;
          el("btn-stop-queue").disabled = true;
          el("btn-generate-clips").disabled = false;
          el("btn-export-zip").disabled = generatedClips.length === 0;
          btnRender.disabled = false;
        }
      });

      container.appendChild(card);
    }
  }

  function updateClipCardRenderUi(clip, text, blob) {
    const card = el("clips-container").querySelector(`.clip-card[data-clip-num="${clip.num}"]`);
    if (!card) return;
    const statusEl = card.querySelector(".render-status");
    const linkDownload = card.querySelector(".btn-download-clip");
    if (statusEl && text) statusEl.textContent = text;
    if (blob && linkDownload) {
      const url = URL.createObjectURL(blob);
      linkDownload.href = url;
      linkDownload.download = `brutal-klip-${clip.num}-${clip.renderedSpeed || getPlaybackSpeed()}x.webm`;
      linkDownload.style.display = "inline-flex";
    }
  }

  async function renderClipHdBlob(clip, hookStr, ccStr, wmStr, speed, styleOpts, onProgress) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = sourceVideoUrl;
      video.crossOrigin = "anonymous";
      video.playsInline = true;
      video.muted = false;

      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext("2d");

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = AudioCtx ? new AudioCtx() : null;
      const dest = audioCtx ? audioCtx.createMediaStreamDestination() : null;

      let settled = false;
      const finishReject = (err) => {
        if (settled) return;
        settled = true;
        try { video.pause(); } catch (_) {}
        if (audioCtx) audioCtx.close().catch(() => {});
        reject(err);
      };

      video.addEventListener("loadedmetadata", () => {
        video.playbackRate = speed;

        if (audioCtx) {
          const srcNode = audioCtx.createMediaElementSource(video);
          srcNode.connect(dest);
          srcNode.connect(audioCtx.destination);
        }

        const canvasStream = canvas.captureStream(30);
        const tracks = [...canvasStream.getVideoTracks()];
        if (dest) tracks.push(...dest.stream.getAudioTracks());

        const combined = new MediaStream(tracks);
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

        const recorder = new MediaRecorder(combined, { mimeType });
        const chunks = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onstop = () => {
          if (settled) return;
          settled = true;
          if (audioCtx) audioCtx.close().catch(() => {});
          resolve(new Blob(chunks, { type: mimeType }));
        };

        const startSec = Math.max(0, Math.min(video.duration || 10, clip.bodyStartSec || 0));
        const endSec = Math.max(startSec + 2, Math.min(video.duration || startSec + 8, clip.bodyEndSec || startSec + 8));
        const totalDur = Math.max(1, endSec - startSec);

        video.currentTime = startSec;
        video.addEventListener("seeked", function onSeeked() {
          video.removeEventListener("seeked", onSeeked);
          video.playbackRate = speed;
          recorder.start(250);
          video.play().catch(finishReject);

          const drawFrame = () => {
            if (settled) return;
            if (cancelQueueRequested) {
              try { video.pause(); } catch (_) {}
              if (recorder.state !== "inactive") recorder.stop();
              finishReject(new Error("Antrean dihentikan oleh pengguna"));
              return;
            }
            if (video.paused || video.ended || video.currentTime >= endSec) {
              video.pause();
              if (recorder.state !== "inactive") recorder.stop();
              return;
            }

            const elapsed = video.currentTime - startSec;
            const pct = Math.min(100, Math.round((elapsed / totalDur) * 100));
            if (onProgress) onProgress(pct);

            ctx.fillStyle = "#09080c";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;

            /* 1. Latar belakang: VT 9:16 penuh, dipergelap (tanpa blur) tapi tetap tampak */
            const bgScale = Math.max(canvas.width / vw, canvas.height / vh);
            const bgW = vw * bgScale;
            const bgH = vh * bgScale;
            ctx.drawImage(video, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);

            ctx.fillStyle = "rgba(6, 5, 10, 0.62)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            /* 2. VT utama di tengah: rasio YouTube (16:9), penuh kiri-kanan tanpa spasi & tanpa lengkung */
            const ytH = Math.round((canvas.width * 9) / 16);
            const ytY = Math.round((canvas.height - ytH) / 2);
            ctx.fillStyle = "#0b0a0e";
            ctx.fillRect(0, ytY, canvas.width, ytH);
            ctx.drawImage(video, 0, ytY, canvas.width, ytH);

            /* 3. HOOK di atas VT utama dengan jarak aman */
            const hookDur = Math.max(2, (clip.hookEndSec || startSec + 4) - (clip.hookStartSec || startSec));
            if (elapsed <= hookDur) {
              const hx = 56;
              const hw = canvas.width - 112;
              const hy = Math.max(150, ytY - 148);
              if (styleOpts.hookBgStyle && styleOpts.hookBgStyle !== "transparent") {
                ctx.fillStyle = styleOpts.hookBgStyle;
                ctx.fillRect(hx, hy, hw, 86);
              }
              ctx.fillStyle = styleOpts.hookColor || "#ffffff";
              ctx.font = `bold ${styleOpts.hookSizePx || 32}px system-ui, sans-serif`;
              if (styleOpts.hookAlign === "left") {
                ctx.textAlign = "left";
                ctx.fillText(hookStr.slice(0, 38), hx + 18, hy + 54);
              } else if (styleOpts.hookAlign === "right") {
                ctx.textAlign = "right";
                ctx.fillText(hookStr.slice(0, 38), hx + hw - 18, hy + 54);
              } else {
                ctx.textAlign = "center";
                ctx.fillText(hookStr.slice(0, 38), canvas.width / 2, hy + 54);
              }
            }

            /* 4. CC di bawah VT utama dengan jarak aman */
            if (ccEnabled && ccStr) {
              const cx = 56;
              const cw = canvas.width - 196;
              const cy = Math.min(canvas.height - 310, ytY + ytH + 44);
              if (styleOpts.ccBgStyle && styleOpts.ccBgStyle !== "transparent") {
                ctx.fillStyle = styleOpts.ccBgStyle;
                ctx.fillRect(cx, cy, cw, 76);
              }
              ctx.fillStyle = styleOpts.ccColor || "#fef08a";
              ctx.font = `600 ${styleOpts.ccSizePx || 25}px system-ui, sans-serif`;
              if (styleOpts.ccAlign === "left") {
                ctx.textAlign = "left";
                ctx.fillText(ccStr.slice(0, 48), cx + 16, cy + 47);
              } else if (styleOpts.ccAlign === "right") {
                ctx.textAlign = "right";
                ctx.fillText(ccStr.slice(0, 48), cx + cw - 16, cy + 47);
              } else {
                ctx.textAlign = "center";
                ctx.fillText(ccStr.slice(0, 48), cx + cw / 2, cy + 47);
              }
            }

            /* 5. WM dengan jarak aman */
            ctx.save();
            ctx.globalAlpha = styleOpts.wmClarity === "faded" ? 0.52 : 1;
            const wmY = styleOpts.wmPos === "bottom-center" ? canvas.height - 335 : 84;
            if (styleOpts.wmBgStyle && styleOpts.wmBgStyle !== "transparent") {
              ctx.fillStyle = styleOpts.wmBgStyle;
              if (styleOpts.wmPos === "top-left") {
                ctx.fillRect(46, wmY - 34, 230, 48);
              } else if (styleOpts.wmPos === "bottom-center") {
                ctx.fillRect(canvas.width / 2 - 125, wmY - 34, 250, 48);
              } else {
                ctx.fillRect(canvas.width - 276, wmY - 34, 230, 48);
              }
            }
            ctx.fillStyle = styleOpts.wmColor || "#ffffff";
            ctx.font = `bold ${styleOpts.wmSizePx || 21}px system-ui, sans-serif`;
            if (styleOpts.wmPos === "top-left") {
              ctx.textAlign = "left";
              if (wmLogoImgEl && wmLogoImgEl.complete && wmLogoImgEl.naturalWidth > 0) {
                ctx.drawImage(wmLogoImgEl, 56, wmY - 22, 26, 26);
                ctx.fillText(wmStr, 90, wmY);
              } else {
                ctx.fillText(wmStr, 56, wmY);
              }
            } else if (styleOpts.wmPos === "bottom-center") {
              ctx.textAlign = "center";
              ctx.fillText(wmStr, canvas.width / 2, wmY);
            } else {
              ctx.textAlign = "right";
              ctx.fillText(wmStr, canvas.width - 56, wmY);
            }
            ctx.restore();

            requestAnimationFrame(drawFrame);
          };

          requestAnimationFrame(drawFrame);
        });
      });

      video.addEventListener("error", () => finishReject(new Error("Gagal memuat video sumber")));
    });
  }

  async function runSequentialRenderQueue(clipsToRender, speed) {
    isQueueRunning = true;
    cancelQueueRequested = false;
    el("btn-stop-queue").disabled = false;
    el("btn-generate-clips").disabled = true;
    el("btn-export-zip").disabled = true;

    const hookCase = el("hook-case-select").value;
    const ccCase = el("cc-case-select").value;
    const hookAlign = getAlignValue("hook-align-select");
    const ccAlign = getAlignValue("cc-align-select");
    const hookColor = el("hook-color-input").value;
    const ccColor = el("cc-color-input").value;
    const hookBgStyle = resolveBgStyle("hook-bg-mode", "hook-bg-color", "hook-bg-strength", 0.92);
    const ccBgStyle = resolveBgStyle("cc-bg-mode", "cc-bg-color", "cc-bg-strength", 0.86);
    const wmText = el("wm-text").value || "@BRUTALKLIP";
    const wmColor = el("wm-color-input").value;
    const wmBgStyle = resolveBgStyle("wm-bg-mode", "wm-bg-input", "wm-bg-strength", 0.85);
    const wmPos = el("wm-pos-select").value;
    const wmClarity = getWmClarity();
    const cleanCc = cleanTranscriptTimestamps(appliedTranscriptText);

    const styleOpts = {
      hookColor,
      ccColor,
      wmColor,
      hookBgStyle,
      ccBgStyle,
      wmBgStyle,
      hookAlign,
      ccAlign,
      wmPos,
      wmClarity,
      hookSizePx: getFontSizeValue("hook-size-select", { small: 28, medium: 32, large: 37 }, 32),
      ccSizePx: getFontSizeValue("cc-size-select", { small: 22, medium: 25, large: 29 }, 25),
      wmSizePx: getFontSizeValue("wm-size-select", { small: 18, medium: 21, large: 25 }, 21)
    };

    for (let i = 0; i < clipsToRender.length; i++) {
      if (cancelQueueRequested) {
        el("process-feedback").textContent =
          `Antrean render dihentikan pada ${clipsToRender[i].title}. Klip yang sudah selesai tetap tersimpan.`;
        break;
      }

      const clip = clipsToRender[i];
      const formattedHook = applyCase(clip.hookText, hookCase);
      const formattedCc = ccEnabled && cleanCc ? applyCase(cleanCc, ccCase) : "";

      el("process-feedback").textContent =
        `Antrean berurutan: merender ${clip.title} (${i + 1}/${clipsToRender.length}, ${speed}x) hingga selesai sebelum lanjut klip berikutnya...`;
      updateClipCardRenderUi(clip, `Sedang dirender (${i + 1}/${clipsToRender.length}, ${speed}x)...`, null);

      try {
        const blob = await renderClipHdBlob(
          clip,
          formattedHook,
          formattedCc,
          wmText,
          speed,
          styleOpts,
          (pct) => {
            updateClipCardRenderUi(
              clip,
              `Rendering ${clip.title} (${i + 1}/${clipsToRender.length}): ${pct}%`,
              null
            );
          }
        );
        clip.renderedBlob = blob;
        clip.renderedSpeed = speed;
        updateClipCardRenderUi(
          clip,
          `Selesai sepenuhnya (${speed}x). Lanjut antrean berikutnya...`,
          blob
        );
      } catch (err) {
        if (cancelQueueRequested) {
          updateClipCardRenderUi(clip, "Render dibatalkan.", null);
          break;
        }
        updateClipCardRenderUi(
          clip,
          "Gagal render: " + (err && err.message ? err.message : "error"),
          null
        );
      }
    }

    isQueueRunning = false;
    cancelQueueRequested = false;
    el("btn-stop-queue").disabled = true;
    el("btn-generate-clips").disabled = false;
    el("btn-export-zip").disabled = generatedClips.length === 0;

    const doneCount = generatedClips.filter((c) => Boolean(c.renderedBlob)).length;
    el("process-feedback").textContent =
      `Proses selesai. ${doneCount} dari ${generatedClips.length} klip sudah jadi file HD (${speed}x).`;
  }

  el("btn-stop-queue").addEventListener("click", () => {
    if (!isQueueRunning) return;
    cancelQueueRequested = true;
    el("btn-stop-queue").disabled = true;
    el("process-feedback").textContent = "Menghentikan antrean render setelah frame saat ini...";
  });

  el("btn-generate-clips").addEventListener("click", async () => {
    if (isQueueRunning) return;
    const pilotText = await readGroupText("pilot");

    if (ccEnabled && !appliedTranscriptText.trim()) {
      el("process-feedback").textContent =
        "CC sedang ON: isi transkrip lalu klik 'Terapkan Transkrip' terlebih dahulu sebelum menghasilkan klip.";
      return;
    }

    if (!pilotText.trim()) {
      el("process-feedback").textContent =
        "Pilot Brutal Klip masih kosong. Isi teks atau upload file .txt terlebih dahulu.";
      return;
    }

    const parsed = parsePilotSegments(pilotText);
    if (!parsed.length) {
      el("process-feedback").textContent =
        "Tidak ada bagian klip yang terbaca di Pilot Brutal Klip.";
      return;
    }

    const speed = getPlaybackSpeed();
    const cleanCc = cleanTranscriptTimestamps(appliedTranscriptText);

    generatedClips = parsed.map((item) => {
      const baseDesc = item.pilotDescText
        ? item.pilotDescText
        : item.movedToFront
          ? `${item.hookText} — ${item.bodyText}`
          : `${item.bodyText} (${item.hookText})`;

      return {
        ...item,
        speed,
        description: baseDesc,
        tagsAndMentions: [],
        audit: {
          descOk: true,
          descMessage: "",
          tagOk: true,
          tagMessage: "",
          clipAllMarkers: [],
          offBriefMarkers: []
        },
        analytics: buildRetentionAnalytics(item, pilotText, ccEnabled, cleanCc),
        renderedBlob: null,
        renderedSpeed: null
      };
    });

    recomputeAllClipAudits();
    renderClips();

    if (sourceVideoFile && sourceVideoUrl) {
      await runSequentialRenderQueue(generatedClips, speed);
    } else {
      el("process-feedback").textContent =
        `Berhasil menyusun ${generatedClips.length} draft klip (${speed}x). Upload video sumber untuk menjalankan render HD berurutan per klip.`;
    }
  });

  el("btn-delete-all-clips").addEventListener("click", () => {
    if (isQueueRunning) {
      cancelQueueRequested = true;
    }
    generatedClips = [];
    el("clips-container").innerHTML =
      '<p class="empty-state">Semua hasil klip telah dihapus.</p>';
    el("btn-export-zip").disabled = true;
    el("process-feedback").textContent = "Semua hasil klip sudah dihapus.";
  });

  el("btn-export-zip").addEventListener("click", async () => {
    if (!generatedClips.length || typeof JSZip === "undefined") return;
    const zip = new JSZip();
    const folder = zip.folder("brutal-klip-hasil");
    const currentSpeed = getPlaybackSpeed();

    for (const clip of generatedClips) {
      const usedSpeed = clip.renderedSpeed || clip.speed || currentSpeed;
      const info = [
        `Judul: ${clip.title} (${clip.timeLabel})`,
        `Kecepatan Putar: ${usedSpeed}x`,
        `Posisi Hook: ${clip.movedToFront ? "Dipindah ke Depan VT" : "Sesuai Pilot"}`,
        `Hook: ${clip.hookText}`,
        `Isi: ${clip.bodyText}`,
        `Status Deskripsi: ${clip.audit.descMessage}`,
        `Status Tagar/Hashtag: ${clip.audit.tagMessage}`,
        `Skor FYP: ${clip.analytics.fypScore}/100`,
        `Alasan Retensi: ${clip.analytics.reason}`,
        `Deskripsi:\n${clip.description}`,
        `Tagar & Mention: ${clip.tagsAndMentions.join(" ")}`
      ].join("\n\n");

      folder.file(`klip-${clip.num}-info.txt`, info);
      if (clip.renderedBlob) {
        folder.file(`klip-${clip.num}-${usedSpeed}x.webm`, clip.renderedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "brutal-klip-pack.zip";
    a.click();
  });

  renderSupporters();
  updateTikTokSamplePreview();
  syncCcWorkflow();
})();
