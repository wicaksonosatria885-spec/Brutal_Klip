(function () {
  let sourceVideoFile = null;
  let sourceVideoUrl = "";
  let appliedTranscriptText = "";
  let ccEnabled = true;
  let generatedClips = [];

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
      sec2Title: "2. Kontrol Tampilan, Transisi 0.5s & Watermark",
      sec2Sub: "Atur animasi 0.5s terpisah untuk Video Hook dan Video Isi, CC, serta WM penuh dari awal sampai akhir VT.",
      btnGenerate: "Hasilkan Klip",
      btnDeleteAll: "Hapus Semua Hasil Klip",
      sec4Title: "4. Hasil Klip, Preview VT, Render HD & Analitik",
      sec4Sub: "Klik putar pada tiap klip untuk melihat preview 9:16, render HD sinkron audio & gerak, serta grafik retensi 1%–90%."
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
      sec2Title: "2. Visual Controls, 0.5s Transitions & Watermark",
      sec2Sub: "Set independent 0.5s animations for Hook Video and Body Video, CC, and full-length WM.",
      btnGenerate: "Generate Clips",
      btnDeleteAll: "Delete All Clips",
      sec4Title: "4. Generated Clips, VT Preview, HD Render & Analytics",
      sec4Sub: "Play any clip to preview 9:16 layout, render HD video synced with audio & motion, and view 1%–90% retention."
    }
  };

  const el = (id) => document.getElementById(id);

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

  // --- Kunci Workflow Berdasarkan Status CC (ON/OFF) & Transkrip ---
  function setControlsLocked(locked, reasonText) {
    const pilotBox = el("pilot-box");
    const editingPanel = el("editing-panel");
    const btnGen = el("btn-generate-clips");

    pilotBox.classList.toggle("is-locked", locked);
    editingPanel.classList.toggle("is-locked", locked);
    btnGen.disabled = locked;

    pilotBox.querySelectorAll("input, textarea, select, button").forEach((ctrl) => {
      if (!ctrl.classList.contains("mode-btn")) ctrl.disabled = locked;
    });
    editingPanel.querySelectorAll("input, textarea, select, button").forEach((ctrl) => {
      ctrl.disabled = locked;
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
      if (generatedClips.length) renderClips();
      return;
    }

    const ccReady = Boolean(appliedTranscriptText.trim());
    if (!ccReady) {
      el("transcript-status").textContent = "CC ON — Isi & klik Terapkan Transkrip dulu";
      setControlsLocked(
        true,
        "CC ON: Terapkan transkrip dulu agar CC berjalan normal sebelum mengisi Pilot Brutal Klip dan membuat klip."
      );
    } else {
      el("transcript-status").textContent = `CC ON & Aktif (${appliedTranscriptText.trim().split(/\s+/).length} kata)`;
      setControlsLocked(
        false,
        "CC ON & aktif: Pilot Brutal Klip, WM, transisi, dan hasilkan klip sudah terbuka."
      );
      if (generatedClips.length) renderClips();
    }
  }

  el("btn-cc-toggle").addEventListener("click", () => {
    ccEnabled = !ccEnabled;
    syncCcWorkflow();
  });

  // --- Mutual Lock Manual vs File ---
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

  // --- Video File Handler ---
  el("video-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    sourceVideoFile = file;
    if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
    sourceVideoUrl = URL.createObjectURL(file);
    el("video-info").textContent = `Dipilih: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
  });

  // --- Parser Pilot Brutal Klip ---
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
    if (!match) return { startSec: null, endSec: null };
    return {
      startSec: parseTimeToSec(match[1]),
      endSec: parseTimeToSec(match[2])
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
      const markerMatch = line.match(/^(?:(hook|klip)\s*(\d+))\b(.*)$/i);
      if (markerMatch) {
        if (current) blocks.push(current);
        const type = markerMatch[1].toLowerCase();
        const num = Number(markerMatch[2]);
        const rest = markerMatch[3] || "";
        const range = extractTimeRange(line);
        current = {
          type,
          num,
          startSec: range.startSec,
          endSec: range.endSec,
          lines: rest ? [rest.replace(/^[:\-–|\s]+/, "")] : []
        };
      } else if (current) {
        const range = extractTimeRange(line);
        if (current.startSec === null && range.startSec !== null) current.startSec = range.startSec;
        if (current.endSec === null && range.endSec !== null) current.endSec = range.endSec;
        current.lines.push(line);
      }
    }
    if (current) blocks.push(current);

    const groupedMap = new Map();
    for (const b of blocks) {
      const key = `${b.num}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          num: b.num,
          title: `VT #${b.num}`,
          hookText: "",
          hookStartSec: null,
          hookEndSec: null,
          bodyText: "",
          bodyStartSec: null,
          bodyEndSec: null,
          isTrailingHook: false,
          movedToFront: false
        });
      }
      const item = groupedMap.get(key);
      const joined = b.lines.join(" ").trim();

      const inlineHookMatch = joined.match(/hook\s*[:\-]\s*([^|]+)(?:\||$)/i);
      if (inlineHookMatch && !item.hookText) {
        item.hookText = inlineHookMatch[1].trim();
      }

      if (b.type === "hook") {
        item.hookText = joined || `Hook ${b.num}`;
        item.hookStartSec = b.startSec;
        item.hookEndSec = b.endSec;
      } else {
        const cleanBody = joined.replace(/\|?\s*hook\s*[:\-]\s*[^|]+/i, "").trim();
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
      if (clip.hookStartSec === null) clip.hookStartSec = clip.bodyStartSec;
      if (clip.hookEndSec === null) clip.hookEndSec = Math.min(clip.bodyEndSec, clip.hookStartSec + 4);
      if (!clip.hookText) clip.hookText = `Hook ${clip.num}`;
      if (!clip.bodyText) clip.bodyText = `Cuplikan utama Klip ${clip.num}`;
    }

    return clips;
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
    const clean = hex.replace("#", "");
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  function extractTagsAndMentions(text) {
    const hashtags = Array.from(new Set(text.match(/#[\w\u00C0-\u024F]+/g) || []));
    const mentions = Array.from(new Set(text.match(/@[\w.]+/g) || []));
    return { hashtags, mentions };
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

    const glowColors = ["#ff4d6d", "#38bdf8", "#a78bfa", "#34d399", "#fbbf24"];
    const sampleUsers = ["@klip_ace", "@vid_hunter", "@edit_lab", "@vt_daily"];
    const sampleComments = [
      "Pembukanya langsung kena sih ini.",
      "Bagian hook ditaruh depan jadi makin pas.",
      "Potongan klipnya rapi dan enak ditonton."
    ];

    const comments = sampleUsers.slice(0, 3).map((user, idx) => ({
      author: user,
      color: glowColors[Math.floor(Math.random() * glowColors.length)],
      text: sampleComments[idx]
    }));

    return { fypScore, points, reason, comments };
  }

  function renderClips() {
    const container = el("clips-container");
    const filterVal = el("style-filter-select").value;
    const filtered = generatedClips.filter((c) => {
      if (filterVal === "front-hook") return c.movedToFront;
      if (filterVal === "standard") return !c.movedToFront;
      return true;
    });

    el("btn-export-zip").disabled = generatedClips.length === 0;

    if (!filtered.length) {
      container.innerHTML =
        '<p class="empty-state">Tidak ada klip untuk ditampilkan. Periksa isi Pilot Brutal Klip atau filter gaya.</p>';
      return;
    }

    const fontFamily = el("font-family-select").value;
    const hookCase = el("hook-case-select").value;
    const ccCase = el("cc-case-select").value;
    const textColor = el("text-color-input").value;
    const bgMode = el("bg-color-mode").value;
    const bgColor = el("bg-color-input").value;
    const strength = el("bg-strength-select").value;
    const wmText = el("wm-text").value || "@BRUTALKLIP";
    const wmColor = el("wm-color-input").value;
    const wmBgMode = el("wm-bg-mode").value;
    const wmBgColor = el("wm-bg-input").value;

    const hookAnimType = el("hook-anim-type").value;
    const hookAnimPos = el("hook-anim-pos").value;
    const bodyAnimType = el("body-anim-type").value;
    const bodyAnimPos = el("body-anim-pos").value;

    const alpha = strength === "pekat" || strength === "solid" ? 0.92 : 0.45;
    const textBgStyle = bgMode === "color" ? hexToRgba(bgColor, alpha) : "transparent";
    const wmBgStyle = wmBgMode === "color" ? hexToRgba(wmBgColor, 0.78) : "transparent";

    const hookAnimClass = getAnimClass(hookAnimType, hookAnimPos, "in");
    const bodyAnimClass = getAnimClass(bodyAnimType, bodyAnimPos, "in");

    container.innerHTML = "";

    for (const clip of filtered) {
      const card = document.createElement("article");
      card.className = "clip-card";

      const formattedHook = applyCase(clip.hookText, hookCase);
      const ccSource = ccEnabled ? appliedTranscriptText : "";
      const formattedCc = ccEnabled && ccSource ? applyCase(ccSource, ccCase) : "";

      const barsHtml = clip.analytics.points
        .map(
          (val) =>
            `<div class="retention-bar-wrap" title="${val}%"><div class="retention-bar" style="height:${val}%"></div></div>`
        )
        .join("");

      const tagsHtml = clip.tagsAndMentions
        .map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`)
        .join("");

      const commentsHtml = clip.analytics.comments
        .map(
          (c) =>
            `<div class="comment-item"><span class="comment-author" style="color:${c.color};text-shadow:0 0 10px ${c.color};">${escapeHtml(c.author)}</span><span>${escapeHtml(c.text)}</span></div>`
        )
        .join("");

      card.innerHTML = `
        <div class="clip-header">
          <h3 class="clip-title">${escapeHtml(clip.title)}</h3>
          <span class="clip-badge">${clip.movedToFront ? "Hook Dipindah ke Depan" : "Urutan Pilot"}</span>
        </div>

        <div class="vt-stage" style="font-family:${fontFamily};">
          ${
            sourceVideoUrl
              ? `<video class="vt-video ${bodyAnimClass}" src="${sourceVideoUrl}" controls playsinline></video>`
              : `<div class="vt-video ${bodyAnimClass}" style="display:grid;place-items:center;color:#9e97ae;font-size:12px;">Upload video sumber untuk preview &amp; render HD</div>`
          }
          <div class="vt-hook-box ${hookAnimClass}" style="color:${textColor};background:${textBgStyle};">
            ${escapeHtml(formattedHook)}
          </div>
          ${
            ccEnabled && formattedCc
              ? `<div class="vt-cc-box" style="color:${textColor};background:${textBgStyle};">${escapeHtml(formattedCc.slice(0, 120))}</div>`
              : ""
          }
          <div class="vt-wm-box" style="color:${wmColor};background:${wmBgStyle};">
            ${escapeHtml(wmText)}
          </div>
        </div>

        <div class="clip-actions">
          <button type="button" class="btn-primary btn-render-hd" data-clip-num="${clip.num}">Render HD</button>
          <a class="btn-secondary btn-download-clip" style="display:none;" download="brutal-klip-${clip.num}.webm">Unduh Hasil</a>
        </div>
        <small class="hint render-status">Siap di-render (720x1280, sinkron audio &amp; gerak).</small>

        <div class="clip-desc">${escapeHtml(clip.description)}</div>
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
          ${commentsHtml}
        </div>
      `;

      const btnRender = card.querySelector(".btn-render-hd");
      const linkDownload = card.querySelector(".btn-download-clip");
      const statusEl = card.querySelector(".render-status");

      btnRender.addEventListener("click", async () => {
        if (!sourceVideoFile) {
          statusEl.textContent = "Pilih video sumber terlebih dahulu.";
          return;
        }
        btnRender.disabled = true;
        statusEl.textContent = "Merender HD sinkron audio & gerak...";
        try {
          const blob = await renderClipHdBlob(clip, formattedHook, formattedCc, wmText, (pct) => {
            statusEl.textContent = `Rendering HD: ${pct}%`;
          });
          const url = URL.createObjectURL(blob);
          clip.renderedBlob = blob;
          linkDownload.href = url;
          linkDownload.style.display = "inline-flex";
          statusEl.textContent = "Render HD selesai. Siap diunduh atau di-export ZIP.";
        } catch (err) {
          statusEl.textContent = "Render gagal: " + (err && err.message ? err.message : "browser tidak mendukung");
        } finally {
          btnRender.disabled = false;
        }
      });

      container.appendChild(card);
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function renderClipHdBlob(clip, hookStr, ccStr, wmStr, onProgress) {
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

      video.addEventListener("loadedmetadata", () => {
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
          if (audioCtx) audioCtx.close().catch(() => {});
          resolve(new Blob(chunks, { type: mimeType }));
        };

        const startSec = Math.max(0, Math.min(video.duration || 10, clip.bodyStartSec || 0));
        const endSec = Math.max(startSec + 2, Math.min(video.duration || startSec + 8, clip.bodyEndSec || startSec + 8));
        const totalDur = Math.max(1, endSec - startSec);

        video.currentTime = startSec;
        video.addEventListener("seeked", function onSeeked() {
          video.removeEventListener("seeked", onSeeked);
          recorder.start(250);
          video.play().catch(reject);

          const drawFrame = () => {
            if (video.paused || video.ended || video.currentTime >= endSec) {
              video.pause();
              if (recorder.state !== "inactive") recorder.stop();
              return;
            }

            const elapsed = video.currentTime - startSec;
            const pct = Math.min(100, Math.round((elapsed / totalDur) * 100));
            if (onProgress) onProgress(pct);

            ctx.fillStyle = "#0b0a0e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const scale = Math.min(canvas.width / vw, canvas.height / vh);
            const dw = vw * scale;
            const dh = vh * scale;
            const dx = (canvas.width - dw) / 2;
            const dy = (canvas.height - dh) / 2;
            ctx.drawImage(video, dx, dy, dw, dh);

            const hookDur = Math.max(2, (clip.hookEndSec || startSec + 4) - (clip.hookStartSec || startSec));
            if (elapsed <= hookDur) {
              ctx.fillStyle = "rgba(255, 42, 75, 0.88)";
              ctx.fillRect(60, 140, canvas.width - 120, 96);
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 34px system-ui, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(hookStr.slice(0, 42), canvas.width / 2, 200);
            }

            if (ccEnabled && ccStr) {
              ctx.fillStyle = "rgba(11, 10, 14, 0.78)";
              ctx.fillRect(60, canvas.height - 260, canvas.width - 120, 82);
              ctx.fillStyle = "#ffffff";
              ctx.font = "600 26px system-ui, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(ccStr.slice(0, 56), canvas.width / 2, canvas.height - 210);
            }

            ctx.fillStyle = "rgba(11, 10, 14, 0.75)";
            ctx.fillRect(canvas.width - 250, 36, 214, 46);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px system-ui, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(wmStr, canvas.width - 50, 67);

            requestAnimationFrame(drawFrame);
          };

          requestAnimationFrame(drawFrame);
        });
      });

      video.addEventListener("error", () => reject(new Error("Gagal memuat video sumber")));
    });
  }

  el("btn-generate-clips").addEventListener("click", async () => {
    const pilotText = await readGroupText("pilot");

    if (ccEnabled && !appliedTranscriptText.trim()) {
      el("process-feedback").textContent =
        "CC sedang ON: isi transkrip lalu klik 'Terapkan Transkrip' terlebih dahulu sebelum menghasilkan klip.";
      return;
    }

    const parsed = parsePilotSegments(pilotText);
    if (!parsed.length) {
      el("process-feedback").textContent =
        "Tidak ada penanda Hook 1, Hook 2... atau Klip 1, Klip 2... yang terdeteksi di Pilot Brutal Klip.";
      return;
    }

    generatedClips = parsed.map((item) => {
      const baseDesc = item.movedToFront
        ? `${item.hookText} — ${item.bodyText}`
        : `${item.bodyText} (${item.hookText})`;
      const combinedForTags = `${item.hookText} ${item.bodyText} ${pilotText} ${ccEnabled ? appliedTranscriptText : ""}`;
      const { hashtags, mentions } = extractTagsAndMentions(combinedForTags);

      return {
        ...item,
        description: baseDesc,
        tagsAndMentions: [...hashtags, ...mentions],
        analytics: buildRetentionAnalytics(item, pilotText, ccEnabled, appliedTranscriptText),
        renderedBlob: null
      };
    });

    el("process-feedback").textContent =
      `Berhasil menghasilkan ${generatedClips.length} klip dari Pilot Brutal Klip.`;
    renderClips();
  });

  el("style-filter-select").addEventListener("change", renderClips);

  el("btn-delete-all-clips").addEventListener("click", () => {
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

    for (const clip of generatedClips) {
      const info = [
        `Judul: ${clip.title}`,
        `Posisi Hook: ${clip.movedToFront ? "Dipindah ke Depan VT" : "Sesuai Pilot"}`,
        `Hook: ${clip.hookText}`,
        `Isi: ${clip.bodyText}`,
        `Skor FYP: ${clip.analytics.fypScore}/100`,
        `Alasan Retensi: ${clip.analytics.reason}`,
        `Deskripsi:\n${clip.description}`,
        `Tagar & Mention: ${clip.tagsAndMentions.join(" ")}`
      ].join("\n\n");

      folder.file(`klip-${clip.num}-info.txt`, info);
      if (clip.renderedBlob) {
        folder.file(`klip-${clip.num}.webm`, clip.renderedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "brutal-klip-pack.zip";
    a.click();
  });

  syncCcWorkflow();
})();
