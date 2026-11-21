(function () {
  const STORAGE_KEY = "brutal_klip_full_state_v28";
  const TRAKTEER_URL = "https://trakteer.id/brutal_klip";
  const RANDOM_NAME_COLORS = [
    "#f43f5e",
    "#fb7185",
    "#facc15",
    "#38bdf8",
    "#34d399",
    "#c084fc",
    "#fb923c",
    "#2dd4bf"
  ];
  const videoBlobUrls = new Map();
  const renderedClipBlobs = new Map();
  const renderedClipUrls = new Map();
  const cardPlayers = new Map();
  let isRenderingVideo = false;
  let cancelAutoRenderFlag = false;

  const I18N = {
    id: {
      upload_title: "Upload Video Bahan, Jumlah Klip, Kecepatan & CC",
      upload_sub: "Auto-render MP4 dengan audio asli & terkompres halus untuk WA, CC berjalan di bawah tengah video, fullscreen tampilkan VT 9:16",
      file_pick_label: "Pilih File Video Bahan (MP4 / MOV / WebM — termasuk hasil download YouTube)",
      no_files: "Belum ada video bahan yang di-upload.",
      source_preview_badge: "Bahan Asli",
      btn_play_source: "Putar Bahan",
      btn_del: "Hapus",
      reselect_video_note: "Pilih ulang file video bahan dari perangkat terlebih dahulu supaya klip VT bisa dirender ke MP4.",
      rendering_clip: "Merender MP4...",
      zipping_all: "Mengemas ZIP...",
      target_dur_label: "Target Durasi Potongan VT",
      dur_25: "±25 Detik (Cepat & Padat)",
      dur_40: "±40 Detik (Standar Klip)",
      dur_60: "±60 Detik (Pembahasan Lengkap)",
      pack_count_label: "Butuh Berapa Clip / VT?",
      speed_label: "Opsi Kecepatan Klip (Anti-Pelanggaran)",
      speed_off: "Off (Tanpa Mengubah Kecepatan)",
      cc_enable_label: "Pakai CC (Closed Caption)?",
      cc_on: "Ya, Aktifkan CC di Bawah Tengah Video",
      cc_off: "Tidak, Tanpa CC",
      cc_lang_label: "Bahasa CC",
      cc_lang_id: "Bahasa Indonesia",
      cc_lang_en: "English",
      cc_case_label: "Format Huruf CC (Terpisah)",
      hook_case_label: "Format Huruf Hook (Terpisah)",
      case_mixed: "Besar Kecil",
      case_upper: "BESAR SEMUA",
      case_lower: "kecil semua",
      case_title: "Besar Depan Aja",
      cfg_hook_strength_label: "Kepekatan Background Hook",
      cfg_cc_strength_label: "Kepekatan Background CC",
      cfg_wm_strength_label: "Kepekatan Background WM Teks",
      strength_faded: "Agak Memudar",
      strength_solid: "Warna Pekat",
      strength_faded_short: "Memudar",
      strength_solid_short: "Pekat",
      cfg_color_label: "Warna Font Teks Hook",
      cfg_cc_color_label: "Warna Font Teks CC",
      cfg_wm_color_label: "Warna Font Teks WM",
      cfg_hook_bg_label: "Background Teks Hook",
      cfg_cc_bg_label: "Background Teks CC",
      cfg_wm_bg_label: "Background Teks WM",
      bg_off: "Off (Tanpa Background)",
      bg_black: "Hitam",
      bg_white: "Putih",
      bg_blue: "Biru",
      bg_yellow: "Kuning",
      bg_red: "Merah",
      bg_green: "Hijau",
      col_white: "Putih",
      col_black: "Hitam",
      col_yellow: "Kuning",
      col_blue: "Biru",
      col_crimson: "Merah",
      col_green: "Hijau",
      fund_title: "Pendanaan — Kopi & Sebat",
      fund_sub: "Suport dana sukarela buat kopi & sebat di BRUTAL KLIP",
      fund_banner_title: "Suport Kopi & Sebat via Trakteer",
      fund_banner_sub: "Gratis dipakai. Kalau mau ngasih suport kopi & sebat, bisa langsung lewat Trakteer BRUTAL KLIP.",
      btn_open_trakteer: "Buka Trakteer",
      btn_copy_link: "Salin Link",
      btn_copied: "Tersalin!",
      komen_title: "Komen",
      komen_sub: "Simpan catatan komen, revisi, atau ide komentar untuk klip kamu",
      komen_input_label: "Tulis Komen / Catatan",
      komen_input_ph: "Contoh: Cek hook 3 detik pertama & pastikan aman dari pelanggaran",
      komen_tag_label: "Label Komen",
      tag_note: "Catatan",
      tag_rev: "Revisi",
      tag_idea: "Ide Komen",
      btn_add: "Tambah",
      no_comments: "Belum ada komen atau catatan tersimpan.",
      hook_style_title: "Preset Font, Warna Teks & Background + Kepekatan Per Teks",
      hook_style_sub: "Atur warna font, background (atau Off), dan kepekatan background masing-masing untuk Hook, CC, dan WM Teks",
      cfg_font_label: "Preset Font Hook",
      wm_file_label: "Upload Watermark Gambar (JPG / PNG)",
      wm_user_label: "WM Teks / Username TikTok / IG (Opsional)",
      wm_user_ph: "Contoh: @brutal_klip atau @username_ig",
      btn_reset_wm: "Hapus Watermark",
      wm_none: "Watermark: Belum diatur",
      wm_active_prefix: "Watermark di bawah hook",
      hook_preview_default: "Arah tren baru mulai kelihatan",
      cc_preview_default: "CC aktif di bawah tengah video",
      wm_info_prefix: "WM: Di Bawah Hook",
      cc_info_prefix: "CC",
      cc_off_short: "Mati",
      speed_info_prefix: "Kecepatan",
      vt_title: "Hasil VT Terima Jadi & Riwayat",
      vt_sub: "Auto-render MP4 dengan audio asli & ramah WA, ZIP semua klip, CC aktif berjalan, tagar & deskripsi nyambung ke brief",
      vt_judul_label: "Judul / Topik Campaign (Opsional, Otomatis dari Brief jika Kosong)",
      vt_judul_ph: "Contoh: Era KOL & Tren Baru",
      vt_gaya_label: "Gaya Pembahasan",
      gaya_santai: "Santai & Penasaran",
      gaya_point: "To The Point",
      gaya_kreator: "Obrolan Kreator",
      gaya_baru: "Sudut Pandang Baru",
      vt_brief_label: "Kotak Brief",
      vt_brief_ph: "Tempel brief campaign di sini. Sistem membaca konteks brief (tokoh, topik, aturan visual/potongan) agar hook, deskripsi, tagar, detik potong, grafik garis retensi (1%–90%), dan potensi FYP sesuai isinya...",
      btn_racik: "Racik & Render MP4 Otomatis",
      btn_reset: "Bersihkan Brief",
      filter_all: "Semua Gaya",
      no_vt: "Belum ada paket VT tersimpan. Tempel brief lalu klik <b>Racik &amp; Render MP4 Otomatis</b>.",
      box_hook: "Teks Hook",
      box_desc: "Deskripsi Siap Upload",
      ret_title: "Grafik Retensi Garis (1%–90%)",
      fyp_prefix: "Potensi FYP",
      side_player_title: "Player VT 9:16",
      btn_fullscreen_vt: "Perbesar VT",
      btn_download_clip: "Unduh Klip",
      btn_downloaded: "MP4 Terunduh!",
      btn_zip_downloaded: "ZIP Terunduh!",
      btn_download_all: "Unduh Semua Hasil Klip",
      btn_regen: "Racik Ulang",
      default_topic: "Obrolan Ini"
    },
    en: {
      upload_title: "Upload Raw Video, Clip Count, Speed & CC",
      upload_sub: "Auto-render MP4 with original audio & compressed for WA, live bottom-center CC, fullscreen shows rendered 9:16 VT",
      file_pick_label: "Choose Raw Video Files (MP4 / MOV / WebM — including downloaded YouTube videos)",
      no_files: "No raw videos uploaded yet.",
      source_preview_badge: "Raw Source",
      btn_play_source: "Play Raw",
      btn_del: "Delete",
      reselect_video_note: "Select the source video file again from your device so VT clips can be rendered to MP4.",
      rendering_clip: "Rendering MP4...",
      zipping_all: "Packaging ZIP...",
      target_dur_label: "Target VT Cut Length",
      dur_25: "±25 Sec (Fast & Punchy)",
      dur_40: "±40 Sec (Standard Clip)",
      dur_60: "±60 Sec (Full Take)",
      pack_count_label: "How Many Clips / VTs?",
      speed_label: "Clip Speed Option (Anti-Violation)",
      speed_off: "Off (Original Speed)",
      cc_enable_label: "Include CC (Closed Caption)?",
      cc_on: "Yes, Show Live CC Centered Below Video",
      cc_off: "No, Without CC",
      cc_lang_label: "CC Language",
      cc_lang_id: "Indonesian",
      cc_lang_en: "English",
      cc_case_label: "CC Letter Case (Separate)",
      hook_case_label: "Hook Letter Case (Separate)",
      case_mixed: "Mixed Case",
      case_upper: "ALL CAPS",
      case_lower: "all lowercase",
      case_title: "Title Case",
      cfg_hook_strength_label: "Hook Background Opacity",
      cfg_cc_strength_label: "CC Background Opacity",
      cfg_wm_strength_label: "Text WM Background Opacity",
      strength_faded: "Slightly Faded",
      strength_solid: "Solid Color",
      strength_faded_short: "Faded",
      strength_solid_short: "Solid",
      cfg_color_label: "Hook Text Color",
      cfg_cc_color_label: "CC Text Color",
      cfg_wm_color_label: "WM Text Color",
      cfg_hook_bg_label: "Hook Background",
      cfg_cc_bg_label: "CC Background",
      cfg_wm_bg_label: "WM Background",
      bg_off: "Off (No Background)",
      bg_black: "Black",
      bg_white: "White",
      bg_blue: "Blue",
      bg_yellow: "Yellow",
      bg_red: "Red",
      bg_green: "Green",
      col_white: "White",
      col_black: "Black",
      col_yellow: "Yellow",
      col_blue: "Blue",
      col_crimson: "Red",
      col_green: "Green",
      fund_title: "Funding — Coffee & Smoke",
      fund_sub: "Voluntary support for coffee & smoke on BRUTAL KLIP",
      fund_banner_title: "Support Coffee & Smoke via Trakteer",
      fund_banner_sub: "Free to use. If you want to chip in for coffee & smoke, head straight to BRUTAL KLIP's Trakteer.",
      btn_open_trakteer: "Open Trakteer",
      btn_copy_link: "Copy Link",
      btn_copied: "Copied!",
      komen_title: "Comments",
      komen_sub: "Save comment notes, revisions, or comment ideas for your clips",
      komen_input_label: "Write Comment / Note",
      komen_input_ph: "Example: Check first 3s hook & keep policy compliance safe",
      komen_tag_label: "Comment Tag",
      tag_note: "Note",
      tag_rev: "Revision",
      tag_idea: "Comment Idea",
      btn_add: "Add",
      no_comments: "No saved comments or notes yet.",
      hook_style_title: "Hook Font, Text Colors & Backgrounds + Per-Text Opacity",
      hook_style_sub: "Set font color, background (or Off), and background opacity separately for Hook, CC, and Text WM",
      cfg_font_label: "Hook Font Preset",
      wm_file_label: "Upload Watermark Image (JPG / PNG)",
      wm_user_label: "Text WM / TikTok / IG Handle (Optional)",
      wm_user_ph: "Example: @brutal_klip or @ig_username",
      btn_reset_wm: "Clear Watermark",
      wm_none: "Watermark: Not set",
      wm_active_prefix: "Watermark below hook",
      hook_preview_default: "Where this trend shift starts",
      cc_preview_default: "Live CC centered below video",
      wm_info_prefix: "WM: Below Hook",
      cc_info_prefix: "CC",
      cc_off_short: "Off",
      speed_info_prefix: "Speed",
      vt_title: "Ready-to-Post VT Output & History",
      vt_sub: "Auto-render MP4 with original audio & WA-friendly, ZIP all clips, live CC, hashtags & captions tailored to brief",
      vt_judul_label: "Campaign Title / Topic (Optional, Auto from Brief if Blank)",
      vt_judul_ph: "Example: KOL Era & Next Trend",
      vt_gaya_label: "Angle Style",
      gaya_santai: "Chill & Curious",
      gaya_point: "To The Point",
      gaya_kreator: "Creator Chat",
      gaya_baru: "Fresh Perspective",
      vt_brief_label: "Brief Box",
      vt_brief_ph: "Paste campaign brief here. The generator reads brief context (people, topic, framing/cut rules) to tailor hooks, captions, hashtags, cut timing, retention line curve (1%–90%), and FYP score...",
      btn_racik: "Generate & Auto-Render MP4",
      btn_reset: "Clear Brief",
      filter_all: "All Styles",
      no_vt: "No VT packs yet. Paste a brief and click <b>Generate &amp; Auto-Render MP4</b>.",
      box_hook: "Hook Text",
      box_desc: "Ready-to-Post Caption",
      ret_title: "Retention Line Curve (1%–90%)",
      fyp_prefix: "FYP Potential",
      side_player_title: "VT 9:16 Player",
      btn_fullscreen_vt: "Expand VT",
      btn_download_clip: "Unduh Klip",
      btn_downloaded: "MP4 Downloaded!",
      btn_zip_downloaded: "ZIP Downloaded!",
      btn_download_all: "Unduh Semua Hasil Klip",
      btn_regen: "Regenerate",
      default_topic: "This Discussion"
    }
  };

  const elFileInput = document.getElementById("file-input");
  const elFileList = document.getElementById("file-list");
  const elSourcePlayerWrap = document.getElementById("source-mini-player");
  const elSourcePlayerName = document.getElementById("source-player-name");
  const elSourceVideoEl = document.getElementById("source-video-el");

  const elDurasiTarget = document.getElementById("vt-durasi-target");
  const elJumlahPaket = document.getElementById("vt-jumlah-paket");
  const elSpeed = document.getElementById("cfg-speed");
  const elCcEnabled = document.getElementById("cfg-cc-enabled");
  const elCcLang = document.getElementById("cfg-cc-lang");
  const elCcCase = document.getElementById("cfg-cc-case");

  const btnBukaTrakteer = document.getElementById("btn-buka-trakteer");
  const btnSalinDana = document.getElementById("btn-salin-dana");

  const elKomenInput = document.getElementById("komen-input");
  const elKomenTag = document.getElementById("komen-tag");
  const elKomenList = document.getElementById("komen-list");

  const elFont = document.getElementById("cfg-font");
  const elHookCase = document.getElementById("cfg-hook-case");
  const elHookStrength = document.getElementById("cfg-hook-strength");
  const elCcStrength = document.getElementById("cfg-cc-strength");
  const elWmStrength = document.getElementById("cfg-wm-strength");
  const elColor = document.getElementById("cfg-color");
  const elCcColor = document.getElementById("cfg-cc-color");
  const elWmColor = document.getElementById("cfg-wm-color");
  const elHookBg = document.getElementById("cfg-hook-bg");
  const elCcBg = document.getElementById("cfg-cc-bg");
  const elWmBg = document.getElementById("cfg-wm-bg");

  const elWmFileInput = document.getElementById("wm-file-input");
  const elWmUsername = document.getElementById("wm-username");
  const elWmThumb = document.getElementById("wm-thumb");
  const elWmStatusText = document.getElementById("wm-status-text");
  const elHookPreview = document.getElementById("hook-live-preview");
  const elPreviewAttachedWm = document.getElementById("preview-attached-wm");
  const elPreviewCcSample = document.getElementById("preview-cc-sample");

  const elBgMode = document.getElementById("info-bg-mode");
  const elHookCaseInfo = document.getElementById("info-hook-case");
  const elCcCaseInfo = document.getElementById("info-cc-case");
  const elWmMode = document.getElementById("info-wm-mode");
  const elCcMode = document.getElementById("info-cc-mode");
  const elSpeedMode = document.getElementById("info-speed-mode");

  const elJudul = document.getElementById("vt-judul");
  const elGaya = document.getElementById("vt-gaya");
  const elBrief = document.getElementById("vt-brief");
  const elFilterGaya = document.getElementById("filter-gaya");
  const elRenderBanner = document.getElementById("render-status-banner");
  const elList = document.getElementById("riwayat-vt-container");
  const elDownloadAllBar = document.getElementById("download-all-bar");
  const elDownloadAllInfo = document.getElementById("download-all-info");

  function clamp1to90(val) {
    return Math.max(1, Math.min(90, Math.round(Number(val) || 1)));
  }

  function pickRandomNameColor() {
    return RANDOM_NAME_COLORS[Math.floor(Math.random() * RANDOM_NAME_COLORS.length)];
  }

  function compactHookText(str) {
    const words = String(str || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= 7) return words.join(" ");
    return words.slice(0, 7).join(" ");
  }

  function applyTextCase(str, mode) {
    const txt = String(str || "");
    if (!txt) return "";
    if (mode === "upper") return txt.toUpperCase();
    if (mode === "lower") return txt.toLowerCase();
    if (mode === "title") {
      return txt.replace(/\S+/g, (word) => {
        const first = word.charAt(0).toUpperCase();
        const rest = word.slice(1).toLowerCase();
        return first + rest;
      });
    }
    return txt;
  }

  function getDefaultState() {
    return {
      lang: "id",
      config: {
        font: 'system-ui, -apple-system, sans-serif',
        hookCase: "mixed",
        ccCase: "mixed",
        hookStrength: "faded",
        ccStrength: "faded",
        wmStrength: "faded",
        color: "#FFFFFF",
        ccColor: "#FFFFFF",
        wmColor: "#FFFFFF",
        hookBg: "black",
        ccBg: "black",
        wmBg: "black",
        wmUsername: "",
        wmImageName: "",
        wmImageData: "",
        ccEnabled: "on",
        ccLang: "id",
        speed: "off"
      },
      files: [],
      comments: [],
      items: []
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      const def = getDefaultState();
      const legacyStrength = (parsed.config && parsed.config.bgStrength) || "faded";
      return {
        lang: parsed.lang === "en" ? "en" : "id",
        config: {
          ...def.config,
          hookStrength: legacyStrength,
          ccStrength: legacyStrength,
          wmStrength: legacyStrength,
          ...(parsed.config || {})
        },
        files: Array.isArray(parsed.files) ? parsed.files : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        items: Array.isArray(parsed.items) ? parsed.items : []
      };
    } catch (err) {
      return getDefaultState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {}
  }

  function t(key) {
    const lang = loadState().lang;
    return (I18N[lang] && I18N[lang][key]) || I18N.id[key] || key;
  }

  function getCaseLabel(mode) {
    if (mode === "upper") return t("case_upper");
    if (mode === "lower") return t("case_lower");
    if (mode === "title") return t("case_title");
    return t("case_mixed");
  }

  function getBgRgba(bgName, strength) {
    if (!bgName || bgName === "off") return "transparent";
    const isSolid = strength === "solid";
    const alpha = isSolid ? 0.96 : 0.56;
    const map = {
      black: `rgba(10, 8, 13, ${alpha})`,
      white: `rgba(255, 255, 255, ${isSolid ? 0.96 : 0.72})`,
      blue: `rgba(37, 99, 235, ${alpha})`,
      yellow: `rgba(250, 204, 21, ${isSolid ? 0.96 : 0.68})`,
      red: `rgba(225, 29, 72, ${alpha})`,
      green: `rgba(16, 185, 129, ${alpha})`
    };
    return map[bgName] || `rgba(10, 8, 13, ${alpha})`;
  }

  function formatSec(sec) {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function nowLabel(date = new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()}, ${p(date.getHours())}.${p(date.getMinutes())}.${p(date.getSeconds())}`;
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatWatermarkSummary(cfg) {
    const parts = [];
    if (cfg.wmImageName) parts.push(cfg.wmImageName);
    if (cfg.wmUsername && cfg.wmUsername.trim()) parts.push(cfg.wmUsername.trim());
    return parts.join(" • ");
  }

  function applyHookStyle(textOverride) {
    const state = loadState();
    const cfg = state.config;
    const font = cfg.font || 'system-ui, -apple-system, sans-serif';
    const hookCase = cfg.hookCase || "mixed";
    const ccCase = cfg.ccCase || "mixed";

    const hookStrength = cfg.hookStrength || "faded";
    const ccStrength = cfg.ccStrength || "faded";
    const wmStrength = cfg.wmStrength || "faded";

    const hookColor = cfg.color || "#FFFFFF";
    const ccColor = cfg.ccColor || "#FFFFFF";
    const wmColor = cfg.wmColor || "#FFFFFF";

    const hookBgCss = getBgRgba(cfg.hookBg || "black", hookStrength);
    const ccBgCss = getBgRgba(cfg.ccBg || "black", ccStrength);
    const wmBgCss = getBgRgba(cfg.wmBg || "black", wmStrength);

    const wmText = formatWatermarkSummary(cfg);
    const hasImg = Boolean(cfg.wmImageData);
    const hasTextWm = Boolean(cfg.wmUsername && cfg.wmUsername.trim());
    const ccOn = cfg.ccEnabled !== "off";
    const ccLangLabel = cfg.ccLang === "en" ? "EN" : "ID";
    const speedVal = cfg.speed || "off";

    const isImpactFont = font.toLowerCase().includes("impact");
    elHookPreview.classList.toggle("is-impact", isImpactFont);

    elHookPreview.style.fontFamily = font;
    elHookPreview.style.color = hookColor;
    elHookPreview.style.backgroundColor = hookBgCss;
    elHookPreview.style.border = hookBgCss === "transparent" ? "none" : "1px solid rgba(255,255,255,0.14)";

    if (typeof textOverride === "string" && textOverride.trim()) {
      elHookPreview.textContent = applyTextCase(compactHookText(textOverride.trim()), hookCase);
    } else {
      elHookPreview.textContent = applyTextCase(elHookPreview.textContent || t("hook_preview_default"), hookCase);
    }

    if (hasImg) {
      elWmThumb.src = cfg.wmImageData;
      elWmThumb.style.display = "block";
    } else {
      elWmThumb.removeAttribute("src");
      elWmThumb.style.display = "none";
    }

    if (wmText || hasImg) {
      elWmStatusText.textContent = `${t("wm_active_prefix")}: ${wmText || cfg.wmImageName}`;
    } else {
      elWmStatusText.textContent = t("wm_none");
    }

    const wmInner =
      hasImg || hasTextWm
        ? `${hasImg ? `<img src="${esc(cfg.wmImageData)}" alt="WM" />` : ""}${
            hasTextWm ? `<span style="color:${esc(wmColor)};">${esc(cfg.wmUsername.trim())}</span>` : ""
          }`
        : "";

    if (wmInner) {
      elPreviewAttachedWm.style.display = "inline-flex";
      elPreviewAttachedWm.style.backgroundColor = wmBgCss;
      elPreviewAttachedWm.style.color = wmColor;
      elPreviewAttachedWm.style.border = wmBgCss === "transparent" ? "none" : "1px solid rgba(255,255,255,0.14)";
      elPreviewAttachedWm.innerHTML = wmInner;
    } else {
      elPreviewAttachedWm.style.display = "none";
      elPreviewAttachedWm.innerHTML = "";
    }

    elPreviewCcSample.style.display = ccOn ? "inline-block" : "none";
    elPreviewCcSample.style.color = ccColor;
    elPreviewCcSample.style.backgroundColor = ccBgCss;
    elPreviewCcSample.style.border = ccBgCss === "transparent" ? "none" : "1px solid rgba(255,255,255,0.14)";
    elPreviewCcSample.textContent = applyTextCase(t("cc_preview_default"), ccCase);

    const hShort = hookStrength === "solid" ? t("strength_solid_short") : t("strength_faded_short");
    const cShort = ccStrength === "solid" ? t("strength_solid_short") : t("strength_faded_short");
    const wShort = wmStrength === "solid" ? t("strength_solid_short") : t("strength_faded_short");
    elBgMode.textContent = `BG: Hook ${hShort} • CC ${cShort} • WM ${wShort}`;
    elHookCaseInfo.textContent = `Hook: ${getCaseLabel(hookCase)}`;
    elCcCaseInfo.textContent = `CC: ${getCaseLabel(ccCase)}`;
    elWmMode.textContent = wmText ? `${t("wm_info_prefix")} (${wmText})` : t("wm_info_prefix");
    elCcMode.textContent = ccOn
      ? `${t("cc_info_prefix")}: ${ccLangLabel} • Tengah Bawah`
      : `${t("cc_info_prefix")}: ${t("cc_off_short")}`;
    elSpeedMode.textContent =
      speedVal === "off" ? `${t("speed_info_prefix")}: Off` : `${t("speed_info_prefix")}: ${speedVal}x`;

    document.querySelectorAll(".vt-hook-pill").forEach((pill) => {
      pill.classList.toggle("is-impact", isImpactFont);
      pill.style.fontFamily = font;
      pill.style.color = hookColor;
      pill.style.backgroundColor = hookBgCss;
      pill.style.border = hookBgCss === "transparent" ? "none" : "1px solid rgba(255,255,255,0.14)";
      const rawHook = compactHookText(pill.getAttribute("data-raw-hook") || pill.textContent || "");
      pill.textContent = applyTextCase(rawHook, hookCase);
    });

    document.querySelectorAll(".vt-hook-val").forEach((hEl) => {
      const rawHook = hEl.getAttribute("data-raw-hook") || hEl.textContent || "";
      hEl.textContent = applyTextCase(rawHook, hookCase);
    });

    document.querySelectorAll(".vt-attached-wm").forEach((wmEl) => {
      if (wmInner) {
        wmEl.style.display = "inline-flex";
        wmEl.style.backgroundColor = wmBgCss;
        wmEl.style.color = wmColor;
        wmEl.style.border = wmBgCss === "transparent" ? "none" : "1px solid rgba(255,255,255,0.14)";
        wmEl.innerHTML = wmInner;
      } else {
        wmEl.style.display = "none";
        wmEl.innerHTML = "";
      }
    });

    document.querySelectorAll(".vt-cc-zone").forEach((ccZone) => {
      ccZone.style.display = ccOn ? "flex" : "none";
    });

    document.querySelectorAll(".vt-cc-text").forEach((ccEl) => {
      ccEl.style.color = ccColor;
      ccEl.style.backgroundColor = ccBgCss;
      ccEl.style.border = ccBgCss === "transparent" ? "none" : "1px solid rgba(255,255,255,0.14)";
      const rawCc = ccEl.getAttribute("data-raw-cc") || ccEl.textContent || "";
      ccEl.textContent = applyTextCase(rawCc, ccCase);
    });
  }

  function renderFiles() {
    const st = loadState();
    if (!st.files.length) {
      elFileList.innerHTML = `<div style="font-size: 12px; color: var(--muted);">${esc(t("no_files"))}</div>`;
      return;
    }
    elFileList.innerHTML = st.files
      .map(
        (f) => `
      <div class="file-row">
        <div>
          <strong>${esc(f.name)}</strong>
          <span style="color: var(--muted); margin-left: 6px;">${f.sizeLabel ? `(${esc(f.sizeLabel)})` : ""} • ${esc(f.waktu)}</span>
        </div>
        <div class="mini-actions">
          <button type="button" class="mini-btn" data-play-source="${esc(f.id)}" data-name="${esc(f.name)}">${esc(t("btn_play_source"))}</button>
          <button type="button" class="mini-btn" data-del-file="${esc(f.id)}">${esc(t("btn_del"))}</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  function renderComments() {
    const st = loadState();
    if (!st.comments.length) {
      elKomenList.innerHTML = `<div style="font-size: 12px; color: var(--muted); margin-top: 10px;">${esc(t("no_comments"))}</div>`;
      return;
    }
    elKomenList.innerHTML = st.comments
      .map((c) => {
        const nameColor = c.nameColor || pickRandomNameColor();
        return `
      <div class="comment-item">
        <div>
          <div>
            <span class="comment-author" style="color: ${esc(nameColor)};">[${esc(c.tag)}]</span>
            <span class="comment-body">${esc(c.text)}</span>
          </div>
          <div class="comment-meta">${esc(c.waktu)}</div>
        </div>
        <button type="button" class="mini-btn" data-del-komen="${esc(c.id)}">${esc(t("btn_del"))}</button>
      </div>
    `;
      })
      .join("");
  }

  function analyzeBrief(judul, briefText) {
    const rawBrief = (briefText || "").trim();
    const rawJudul = (judul || "").trim();
    const combined = `${rawJudul} ${rawBrief}`.trim();
    const lower = combined.toLowerCase();

    const people = [];
    const nameMatches = combined.match(/\b(?:Kak|Ko|Bang|Mas|Mbak|Bu|Pak)\s+[A-Z][a-zA-Z]+\b/g) || [];
    nameMatches.forEach((m) => {
      const clean = m.trim();
      if (!people.includes(clean)) people.push(clean);
    });

    const keywords = [];
    const kwRules = [
      { re: /\bkol\b/i, tag: "#KOL", topic: "KOL & Kreator" },
      { re: /\b(tren|trend|era)\b/i, tag: "#TrenKonten", topic: "Pergeseran Tren" },
      { re: /\b(wajah|muka|ekspresi)\b/i, tag: "#FokusWajah", topic: "Ekspresi & Wajah" },
      { re: /\b(bisnis|brand|jualan|produk|marketing)\b/i, tag: "#StrategiBrand", topic: "Strategi Brand" },
      { re: /\b(algoritma|fyp|retensi|clip|klip|vt)\b/i, tag: "#KlippingVT", topic: "Klipping VT" },
      { re: /\b(podcast|obrolan|ngobrol|talk)\b/i, tag: "#ObrolanSeru", topic: "Obrolan Podcast" },
      { re: /\b(edukasi|belajar|tips|cara)\b/i, tag: "#InsightPraktis", topic: "Insight Praktis" }
    ];
    kwRules.forEach((r) => {
      if (r.re.test(lower)) keywords.push(r);
    });

    const cleaned = rawBrief
      .replace(/Deskripsi\s*Campaign\s*Details\s*🚀?/gi, "")
      .replace(/Category\s*:/gi, "")
      .replace(/Platforms\s*:/gi, "")
      .replace(/note\s*:/gi, "")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    let topicLabel = rawJudul;
    if (!topicLabel) {
      if (keywords.length >= 2) {
        topicLabel = `${keywords[0].topic} & ${keywords[1].topic}`;
      } else if (keywords.length === 1) {
        topicLabel = keywords[0].topic;
      } else if (people.length) {
        topicLabel = `Obrolan ${people.slice(0, 2).join(" & ")}`;
      } else if (cleaned) {
        topicLabel = cleaned.split(/[|•\n]/)[0].trim().split(/\s+/).slice(0, 3).join(" ");
      } else {
        topicLabel = t("default_topic");
      }
    }

    const personPhrase =
      people.length >= 2
        ? `${people[0]} & ${people[1]}`
        : people.length === 1
        ? people[0]
        : null;

    return {
      topicLabel,
      personPhrase,
      keywords,
      hasWajahAturan: /\b(wajah|muka|ekspresi|fokus)\b/i.test(lower),
      cleanedBrief: cleaned
    };
  }

  function computeAutoTimings(packIndex, targetDur) {
    const dur = Math.max(12, Number(targetDur) || 40);
    const videoDur =
      Number.isFinite(elSourceVideoEl.duration) && elSourceVideoEl.duration > dur
        ? Math.floor(elSourceVideoEl.duration)
        : 1800;
    const step = Math.max(12, dur - 5);
    const maxStart = Math.max(0, videoDur - dur);
    const cutStart = Math.min(maxStart, packIndex * step);
    const cutEnd = Math.min(videoDur, cutStart + dur);
    const hookStart = cutStart;
    const hookEnd = Math.min(cutEnd, cutStart + 3);
    return { cutStart, cutEnd, hookStart, hookEnd };
  }

  function buildRetentionAndFyp(packIndex, gaya, targetDur) {
    const baseCurve = [86, 78, 71, 66, 61, 56, 51, 46, 42, 38];
    const gayaBoost = {
      "Santai & Penasaran": 5,
      "To The Point": 4,
      "Obrolan Kreator": 3,
      "Sudut Pandang Baru": 6
    }[gaya] || 3;

    const durBonus = Number(targetDur) <= 40 ? 3 : 1;
    const wave = ((packIndex * 7) % 9) - 4;
    const fypScore = clamp1to90(70 + gayaBoost + durBonus + wave);

    const curve = baseCurve.map((val, idx) => {
      const localOffset = idx === 0 ? 3 : idx === 1 ? 1 : ((packIndex + idx * 3) % 7) - 3;
      return clamp1to90(val + localOffset + Math.round(gayaBoost / 2));
    });

    return { fypScore, curve };
  }

  function buildDoneForYouPack(judul, gaya, briefText, packIndex, targetDur, ccLang) {
    const isEn = loadState().lang === "en";
    const info = analyzeBrief(judul, briefText);
    const timing = computeAutoTimings(packIndex, targetDur);
    const analytics = buildRetentionAndFyp(packIndex, gaya, targetDur);

    const subjectRef = info.personPhrase || info.topicLabel;
    const hasTopicKw = info.keywords.length > 0;

    const hookBankId = hasTopicKw
      ? [
          `Arah tren ${info.topicLabel} mulai berubah`,
          `Kenapa pola ${info.topicLabel} sekarang beda?`,
          `${subjectRef} bahas sisi penting ${info.topicLabel}`,
          `Poin krusial di obrolan ini mulai kerasa`
        ]
      : [
          `Poin penting ${subjectRef} mulai di sini`,
          `Bagian menarik ${subjectRef} layak disimak`,
          `Inti bahasan ${subjectRef} langsung ke titiknya`,
          `Sudut pandang ${subjectRef} bikin penasaran`
        ];

    const hookBankEn = hasTopicKw
      ? [
          `How ${info.topicLabel} is shifting now`,
          `Why ${info.topicLabel} feels different today`,
          `${subjectRef} breaks down what matters`,
          `Key turning point in this segment`
        ]
      : [
          `Key takeaway from ${subjectRef} right here`,
          `Standout moment from ${subjectRef} to watch`,
          `${subjectRef} gets straight to the point`,
          `Fresh angle from ${subjectRef} worth catching`
        ];

    const activeHookPool = isEn ? hookBankEn : hookBankId;
    const hook = compactHookText(activeHookPool[Math.abs(packIndex) % activeHookPool.length]);

    const focusDetailId = info.hasWajahAturan
      ? `fokus pada ekspresi dan obrolan ${subjectRef} di frame`
      : `mengangkat inti pembahasan ${subjectRef} sesuai arahan brief`;
    const focusDetailEn = info.hasWajahAturan
      ? `focusing on ${subjectRef}'s on-camera expression and dialogue`
      : `highlighting the core point from ${subjectRef} based on the brief`;

    const desc = isEn
      ? `Clip on ${info.topicLabel}, ${focusDetailEn} with a ${gaya} tone.`
      : `Klip bahasan ${info.topicLabel}, ${focusDetailId} dengan nuansa ${gaya}.`;

    const ccLinesId = hasTopicKw
      ? [
          `Fokus: ${info.topicLabel}`,
          `${subjectRef} soroti perubahan tren`,
          `Simak detail penting bagian ini`,
          `Ringkasan singkat segmen klip`
        ]
      : [
          `Sorotan: ${subjectRef}`,
          `Inti bahasan mulai di sini`,
          `Catatan penting buat disimak`,
          `Penutup potongan klip ini`
        ];

    const ccLinesEn = hasTopicKw
      ? [
          `Focus: ${info.topicLabel}`,
          `${subjectRef} highlights the shift`,
          `Watch the detail viewers miss`,
          `Quick takeaway from this clip`
        ]
      : [
          `Highlight: ${subjectRef}`,
          `Main point starts right here`,
          `Note worth catching here`,
          `Wrap-up of this clip cut`
        ];

    const ccLines = ccLang === "en" ? ccLinesEn : ccLinesId;

    const dynamicTags = [];
    info.keywords.forEach((k) => dynamicTags.push(k.tag));

    if (info.personPhrase) {
      info.personPhrase
        .split(/\s*&\s*|\s+/)
        .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
        .filter((w) => w.length >= 3 && !["Kak", "Ko", "Bang", "Mas", "Mbak"].includes(w))
        .slice(0, 2)
        .forEach((w) => dynamicTags.push("#" + w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()));
    }

    const briefWords = info.cleanedBrief
      .split(/[^a-zA-Z0-9]+/)
      .map((w) => w.trim())
      .filter(
        (w) =>
          w.length >= 4 &&
          !["clip", "klip", "video", "wajah", "hanya", "dan", "yang", "untuk", "dengan", "dari"].includes(
            w.toLowerCase()
          )
      );

    if (!dynamicTags.length && briefWords.length) {
      briefWords.slice(0, 3).forEach((w) => {
        dynamicTags.push("#" + w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      });
    }

    if (!dynamicTags.length) {
      dynamicTags.push("#BrutalKlip", "#KlipVT");
    }

    const tags = Array.from(new Set(dynamicTags)).slice(0, 5).join(" ");

    const timeRange = `${formatSec(timing.cutStart)}–${formatSec(timing.cutEnd)}`;
    const timingSummary = isEn
      ? `Cut ${timeRange} • Hook ${formatSec(timing.hookStart)}–${formatSec(timing.hookEnd)}`
      : `Potong ${timeRange} • Hook ${formatSec(timing.hookStart)}–${formatSec(timing.hookEnd)}`;

    return {
      topic: info.topicLabel,
      hook,
      desc,
      ccLines,
      ccSample: ccLines[0],
      tags,
      timing,
      timingSummary,
      fypScore: analytics.fypScore,
      curve: analytics.curve
    };
  }

  function getCcLineAtTime(item, currentTimeSec) {
    const lines = Array.isArray(item.ccLines) && item.ccLines.length
      ? item.ccLines
      : [item.ccSample || item.hook || ""];
    const seg = item.timing || { cutStart: 0, cutEnd: 20 };
    const elapsed = Math.max(0, (Number(currentTimeSec) || seg.cutStart) - seg.cutStart);
    const idx = Math.floor(elapsed / 6) % lines.length;
    const ccCase = loadState().config.ccCase || "mixed";
    return applyTextCase(lines[idx], ccCase);
  }

  function renderRetentionLineSvg(curve) {
    const rawList = Array.isArray(curve) && curve.length ? curve : [84, 76, 68, 62, 56, 50, 45, 40, 35, 30];
    const pointsList = rawList.map((v) => clamp1to90(v));
    const w = 300;
    const h = 58;
    const padX = 8;
    const padY = 6;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;

    const coords = pointsList.map((pct, i) => {
      const x = padX + (i / Math.max(1, pointsList.length - 1)) * usableW;
      const norm = (pct - 1) / 89;
      const y = h - padY - norm * usableH;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), pct };
    });

    const linePts = coords.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPts = `${coords[0].x},${h - padY} ${linePts} ${coords[coords.length - 1].x},${h - padY}`;

    const circles = coords
      .map((p, idx) => `<circle cx="${p.x}" cy="${p.y}" r="${idx === 0 ? "3" : "2.2"}" fill="${idx === 0 ? "#34d399" : "#fb7185"}" />`)
      .join("");

    return `
      <div class="line-chart-wrap">
        <div class="y-axis-scale">
          <span>90%</span>
          <span>45%</span>
          <span>1%</span>
        </div>
        <svg class="ret-line-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Grafik Retensi Garis 1% sampai 90%">
          <line x1="${padX}" y1="${padY}" x2="${w - padX}" y2="${padY}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="${padX}" y1="${(h / 2).toFixed(1)}" x2="${w - padX}" y2="${(h / 2).toFixed(1)}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="rgba(255,255,255,0.08)" />
          <polygon points="${areaPts}" fill="rgba(255, 42, 75, 0.18)" />
          <polyline fill="none" stroke="#ff2a4b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${linePts}" />
          ${circles}
        </svg>
      </div>
    `;
  }

  function resolveVideoUrlForItem(item) {
    const st = loadState();
    const fid = (item && item.sourceId) || (st.files[0] && st.files[0].id) || "";
    return fid ? videoBlobUrls.get(fid) || "" : "";
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = line + " " + words[i];
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
    return lines;
  }

  function getPlaybackRateFromConfig(cfg) {
    const raw = cfg && cfg.speed;
    if (!raw || raw === "off") return 1;
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) return 1;
    return num;
  }

  async function renderVtClipVideoBlob(item) {
    const srcUrl = resolveVideoUrlForItem(item);
    if (!srcUrl) {
      throw new Error("NO_SOURCE_VIDEO");
    }

    const st = loadState();
    const cfg = st.config || {};
    const seg = item.timing || { cutStart: 0, cutEnd: 20, hookStart: 0, hookEnd: 3 };
    const clipLen = Math.max(4, Math.min(35, (Number(seg.cutEnd) || 20) - (Number(seg.cutStart) || 0)));
    const rate = getPlaybackRateFromConfig(cfg);
    const hookCase = cfg.hookCase || "mixed";

    const helperVideo = document.createElement("video");
    helperVideo.src = srcUrl;
    helperVideo.muted = false;
    helperVideo.volume = 1;
    helperVideo.playsInline = true;
    helperVideo.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      helperVideo.onloadedmetadata = () => resolve();
      helperVideo.onerror = () => reject(new Error("VIDEO_LOAD_ERROR"));
    });

    const mediaDur =
      Number.isFinite(helperVideo.duration) && helperVideo.duration > 0 ? helperVideo.duration : clipLen;
    const maxStart = Math.max(0, mediaDur - clipLen);
    const startSec = maxStart > 0 ? Math.min(maxStart, Number(seg.cutStart) || 0) : 0;
    const safeEndSec = Math.min(mediaDur, startSec + clipLen);

    helperVideo.currentTime = startSec;
    await new Promise((resolve) => {
      helperVideo.onseeked = () => resolve();
    });

    const canvas = document.createElement("canvas");
    canvas.width = 450;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    let wmImgEl = null;
    if (cfg.wmImageData) {
      wmImgEl = new Image();
      wmImgEl.src = cfg.wmImageData;
      await new Promise((resolve) => {
        wmImgEl.onload = () => resolve();
        wmImgEl.onerror = () => resolve();
      });
    }

    const combinedStream = new MediaStream();
    const canvasStream = canvas.captureStream(24);
    canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

    let audioCtx = null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume().catch(() => {});
        }
        const sourceNode = audioCtx.createMediaElementSource(helperVideo);
        const destNode = audioCtx.createMediaStreamDestination();
        sourceNode.connect(destNode);
        destNode.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }
    } catch (err) {}

    const mimeCandidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    const chosenMime =
      typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function"
        ? mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || ""
        : "";

    const recorderOpts = { videoBitsPerSecond: 1100000 };
    if (chosenMime) recorderOpts.mimeType = chosenMime;

    const recorder = new MediaRecorder(combinedStream, recorderOpts);

    const chunks = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    const stoppedPromise = new Promise((resolve) => {
      recorder.onstop = () => resolve();
    });

    const fontFamily = cfg.font || "sans-serif";
    const hookColor = cfg.color || "#FFFFFF";
    const ccColor = cfg.ccColor || "#FFFFFF";
    const wmColor = cfg.wmColor || "#FFFFFF";

    const hookBgCss = getBgRgba(cfg.hookBg || "black", cfg.hookStrength || "faded");
    const ccBgRaw = getBgRgba(cfg.ccBg || "black", cfg.ccStrength || "faded");
    const ccBgCss = ccBgRaw === "transparent" ? "rgba(10, 8, 13, 0.72)" : ccBgRaw;
    const wmBgCss = getBgRgba(cfg.wmBg || "black", cfg.wmStrength || "faded");

    const wmText = cfg.wmUsername && cfg.wmUsername.trim() ? cfg.wmUsername.trim() : "";
    const ccOn = cfg.ccEnabled !== "off";
    const formattedHook = applyTextCase(compactHookText(item.hook || ""), hookCase);

    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.filter = "blur(20px) brightness(0.38) saturate(1.12)";
      const vw = helperVideo.videoWidth || 16;
      const vh = helperVideo.videoHeight || 9;
      const scaleBg = Math.max(canvas.width / vw, canvas.height / vh);
      const bgW = vw * scaleBg * 1.1;
      const bgH = vh * scaleBg * 1.1;
      ctx.drawImage(helperVideo, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
      ctx.restore();

      ctx.fillStyle = "rgba(6, 5, 8, 0.34)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mainH = Math.min(358, Math.round((canvas.width / vw) * vh));
      const mainY = Math.round((canvas.height - mainH) / 2);
      ctx.drawImage(helperVideo, 0, mainY, canvas.width, mainH);

      ctx.save();
      ctx.font = `800 20px ${fontFamily}`;
      const hookLines = wrapCanvasText(ctx, formattedHook, canvas.width - 54).slice(0, 2);
      const lineH = 25;
      const boxH = hookLines.length * lineH + 14;
      const maxLineW = Math.max(150, ...hookLines.map((l) => ctx.measureText(l).width + 26));
      const boxX = Math.round((canvas.width - maxLineW) / 2);
      const boxY = Math.max(70, mainY - boxH - 44);

      if (hookBgCss !== "transparent") {
        ctx.fillStyle = hookBgCss;
        ctx.fillRect(boxX, boxY, maxLineW, boxH);
      }

      ctx.fillStyle = hookColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      hookLines.forEach((l, i) => {
        ctx.fillText(l, canvas.width / 2, boxY + 9 + (i + 0.5) * lineH);
      });

      if (wmText || wmImgEl) {
        ctx.save();
        ctx.font = "600 13px sans-serif";
        const wmW = (wmImgEl ? 20 : 0) + (wmText ? ctx.measureText(wmText).width + 16 : 16);
        const wmX = Math.round((canvas.width - wmW) / 2);
        const wmY = boxY + boxH + 6;
        if (wmBgCss !== "transparent") {
          ctx.fillStyle = wmBgCss;
          ctx.fillRect(wmX, wmY, wmW, 21);
        }
        if (wmImgEl) {
          ctx.drawImage(wmImgEl, wmX + 5, wmY + 3, 14, 14);
        }
        if (wmText) {
          ctx.fillStyle = wmColor;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(wmText, wmX + (wmImgEl ? 23 : 8), wmY + 10.5);
        }
        ctx.restore();
      }
      ctx.restore();

      if (ccOn) {
        const activeCcText = getCcLineAtTime(item, helperVideo.currentTime);
        ctx.save();
        ctx.font = "700 16px sans-serif";
        const ccLines = wrapCanvasText(ctx, activeCcText, canvas.width - 54).slice(0, 2);
        const ccH = ccLines.length * 21 + 12;
        const ccW = Math.max(140, ...ccLines.map((l) => ctx.measureText(l).width + 24));
        const ccX = Math.round((canvas.width - ccW) / 2);
        const ccY = Math.min(canvas.height - ccH - 36, mainY + mainH + 18);
        ctx.fillStyle = ccBgCss;
        ctx.fillRect(ccX, ccY, ccW, ccH);
        ctx.fillStyle = ccColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ccLines.forEach((l, i) => {
          ctx.fillText(l, canvas.width / 2, ccY + 8 + (i + 0.5) * 21);
        });
        ctx.restore();
      }
    }

    recorder.start(200);
    try {
      helperVideo.playbackRate = Math.max(0.25, Math.min(2, rate));
    } catch (err) {}
    await helperVideo.play().catch(() => {});

    let rafId = 0;
    const stepLoop = () => {
      drawFrame();
      if (helperVideo.currentTime >= safeEndSec || helperVideo.ended) {
        helperVideo.pause();
        cancelAnimationFrame(rafId);
        if (recorder.state !== "inactive") recorder.stop();
        return;
      }
      rafId = requestAnimationFrame(stepLoop);
    };
    rafId = requestAnimationFrame(stepLoop);

    const estMs = Math.max(2500, ((safeEndSec - startSec) / Math.max(0.25, rate) + 1.2) * 1000);
    const safetyTimer = setTimeout(() => {
      helperVideo.pause();
      cancelAnimationFrame(rafId);
      if (recorder.state !== "inactive") recorder.stop();
    }, estMs);

    await stoppedPromise;
    clearTimeout(safetyTimer);
    if (audioCtx && typeof audioCtx.close === "function") {
      audioCtx.close().catch(() => {});
    }

    return new Blob(chunks, { type: chosenMime || "video/mp4" });
  }

  async function autoRenderItems(targetItems) {
    const listToRender = (targetItems || []).filter((it) => Boolean(resolveVideoUrlForItem(it)));
    if (!listToRender.length) return;
    if (isRenderingVideo) {
      cancelAutoRenderFlag = true;
      await new Promise((r) => setTimeout(r, 120));
    }

    cancelAutoRenderFlag = false;
    isRenderingVideo = true;
    try {
      for (let i = 0; i < listToRender.length; i++) {
        if (cancelAutoRenderFlag) break;
        const it = listToRender[i];
        if (!loadState().items.some((x) => x.id === it.id)) continue;
        elRenderBanner.textContent = `${t("rendering_clip")} (${i + 1}/${listToRender.length})`;
        const blob = await renderVtClipVideoBlob(it);
        if (!loadState().items.some((x) => x.id === it.id)) continue;
        renderedClipBlobs.set(it.id, blob);
        const prevUrl = renderedClipUrls.get(it.id);
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        const nextUrl = URL.createObjectURL(blob);
        renderedClipUrls.set(it.id, nextUrl);
        bindVideoSourcesToCards();
      }
      if (!cancelAutoRenderFlag) {
        elRenderBanner.textContent =
          loadState().lang === "en"
            ? `Done: ${listToRender.length} MP4 clip(s) rendered & ready.`
            : `Selesai: ${listToRender.length} klip MP4 sudah dirender & siap.`;
      }
    } catch (err) {
      elRenderBanner.textContent = "";
    } finally {
      isRenderingVideo = false;
      cancelAutoRenderFlag = false;
    }
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32Bytes(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function buildZipBlob(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = encoder.encode(entry.filename);
      const dataBytes = new Uint8Array(await entry.blob.arrayBuffer());
      const checksum = crc32Bytes(dataBytes);
      const size = dataBytes.length;

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, checksum, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, dataBytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, checksum, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);

      centralParts.push(centralHeader);
      offset += localHeader.length + dataBytes.length;
    }

    const centralSize = centralParts.reduce((acc, arr) => acc + arr.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, eocd], { type: "application/zip" });
  }

  function saveBlobAsFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function bindVideoSourcesToCards() {
    const st = loadState();
    const fallbackFile = st.files[0] || null;
    const ccOn = st.config.ccEnabled !== "off";

    cardPlayers.forEach((entry, itemId) => {
      const item = st.items.find((x) => x.id === itemId);
      const renderedUrl = renderedClipUrls.get(itemId);

      if (entry.hookStack) entry.hookStack.style.display = "flex";
      if (entry.ccZone) {
        entry.ccZone.style.display = ccOn ? "flex" : "none";
        if (ccOn && entry.ccTextEl && item) {
          const line = getCcLineAtTime(item, entry.mainVideo.currentTime || 0);
          entry.ccTextEl.setAttribute("data-raw-cc", line);
          entry.ccTextEl.textContent = line;
        }
      }

      if (renderedUrl) {
        entry.isRendered = true;
        if (entry.mainVideo.src !== renderedUrl) {
          entry.mainVideo.src = renderedUrl;
        }
        entry.blurVideo.style.display = "none";
        entry.mainVideo.style.maxHeight = "190px";
        entry.mainVideo.style.height = "auto";
        entry.mainVideo.style.objectFit = "cover";
        return;
      }

      entry.isRendered = false;
      entry.blurVideo.style.display = "block";
      entry.mainVideo.style.maxHeight = "190px";
      entry.mainVideo.style.height = "auto";
      entry.mainVideo.style.objectFit = "cover";

      const fid = (item && item.sourceId) || (fallbackFile && fallbackFile.id) || "";
      const url = fid ? videoBlobUrls.get(fid) : "";
      if (url && entry.mainVideo.src !== url) {
        entry.mainVideo.src = url;
        entry.blurVideo.src = url;
      }
    });
  }

  function getFilteredItems() {
    const state = loadState();
    const gayaFilter = elFilterGaya.value;
    return state.items.filter((item) => !gayaFilter || item.gaya === gayaFilter);
  }

  function renderList() {
    cardPlayers.clear();
    try {
      const state = loadState();
      const items = getFilteredItems();
      const hookCase = state.config.hookCase || "mixed";
      const ccCase = state.config.ccCase || "mixed";

      if (!items.length) {
        elList.innerHTML = `<div class="empty-state">${t("no_vt")}</div>`;
        elDownloadAllBar.style.display = "none";
        return;
      }

      elDownloadAllBar.style.display = "flex";
      elDownloadAllInfo.textContent =
        state.lang === "en"
          ? `${items.length} VT Clip(s) Ready (.zip)`
          : `${items.length} Klip VT Siap Diunduh (.zip)`;

      elList.innerHTML = items
        .map((item, idx) => {
          const clipNum = items.length - idx;
          const fypVal = clamp1to90(item.fypScore || 78);
          const cleanHook = compactHookText(item.hook || "");
          const shownHook = applyTextCase(cleanHook, hookCase);
          const shownCc = applyTextCase(item.ccSample || cleanHook, ccCase);
          return `
        <article class="vt-card" data-id="${esc(item.id)}">
          <div class="vt-top">
            <strong>VT #${clipNum} • ${esc(item.judul)}</strong>
            <span>${esc(item.gaya)} • ${esc(item.waktu)}</span>
          </div>

          <div class="vt-card-layout">
            <div>
              <div class="vt-time-strip">
                <span>${esc(item.timingSummary || "")}</span>
                <span class="fyp-badge">${esc(t("fyp_prefix"))}: ${fypVal}%</span>
              </div>

              <div class="vt-hook-box">
                <div class="box-tag">${esc(t("box_hook"))}</div>
                <p class="vt-hook-val" data-raw-hook="${esc(cleanHook)}">${esc(shownHook)}</p>
              </div>

              <div class="vt-desc-box">
                <div class="box-tag">${esc(t("box_desc"))}</div>
                <p class="vt-desc-val">${esc(item.desc)}</p>
              </div>

              <div class="retention-box">
                <div class="retention-head">
                  <span>${esc(t("ret_title"))}</span>
                  <strong>${fypVal}% FYP</strong>
                </div>
                ${renderRetentionLineSvg(item.curve)}
              </div>

              ${
                item.watermark
                  ? `<div class="vt-meta-note">WM: ${esc(item.watermark)} • Di Bawah Hook</div>`
                  : ""
              }

              <div class="vt-foot">
                <span class="vt-tags">${esc(item.tags)}</span>
                <div class="mini-actions">
                  <button type="button" class="mini-btn" data-act="download" data-num="${clipNum}" data-id="${esc(item.id)}">${esc(t("btn_download_clip"))}</button>
                  <button type="button" class="mini-btn" data-act="regen" data-id="${esc(item.id)}">${esc(t("btn_regen"))}</button>
                  <button type="button" class="mini-btn" data-act="delete" data-id="${esc(item.id)}">${esc(t("btn_del"))}</button>
                </div>
              </div>
            </div>

            <div class="side-player-col">
              <div class="side-player-label">
                <span>${esc(t("side_player_title"))} #${clipNum}</span>
                <span>${formatSec((item.timing && item.timing.cutStart) || 0)}</span>
              </div>
              <div class="vt-916-stage">
                <video class="vt-blur-bg" muted playsinline loop aria-hidden="true"></video>
                <div class="vt-dim-scrim" aria-hidden="true"></div>

                <div class="vt-hook-wm-stack">
                  <span class="vt-hook-pill" data-raw-hook="${esc(cleanHook)}">${esc(shownHook)}</span>
                  <span class="vt-attached-wm" style="display: none;"></span>
                </div>

                <div class="vt-center-video-wrap">
                  <video class="vt-video-el" controls playsinline muted></video>
                </div>

                <div class="vt-cc-zone">
                  <span class="vt-cc-text" data-raw-cc="${esc(item.ccSample || cleanHook)}">${esc(shownCc)}</span>
                </div>
              </div>
              <div class="player-controls-bar">
                <span>9:16 VT</span>
                <button type="button" class="mini-btn" data-act="fullscreen" data-id="${esc(item.id)}">${esc(t("btn_fullscreen_vt"))}</button>
              </div>
            </div>
          </div>
        </article>
      `;
        })
        .join("");

      items.forEach((item) => {
        const cardEl = elList.querySelector(`article[data-id="${item.id}"]`);
        if (!cardEl) return;
        const stageEl = cardEl.querySelector(".vt-916-stage");
        const mainVideo = cardEl.querySelector(".vt-video-el");
        const blurVideo = cardEl.querySelector(".vt-blur-bg");
        const hookStack = cardEl.querySelector(".vt-hook-wm-stack");
        const ccZone = cardEl.querySelector(".vt-cc-zone");
        const ccTextEl = cardEl.querySelector(".vt-cc-text");

        if (mainVideo && blurVideo && stageEl) {
          const entryObj = {
            stageEl,
            mainVideo,
            blurVideo,
            hookStack,
            ccZone,
            ccTextEl,
            isRendered: false
          };
          cardPlayers.set(item.id, entryObj);
          const seg = item.timing || { cutStart: 0, cutEnd: 40, hookStart: 0, hookEnd: 3 };

          mainVideo.addEventListener("loadedmetadata", () => {
            if (!entryObj.isRendered && mainVideo.currentTime < seg.cutStart) {
              mainVideo.currentTime = seg.cutStart;
            }
          });

          mainVideo.addEventListener("play", () => {
            const line = getCcLineAtTime(item, mainVideo.currentTime);
            if (ccTextEl) {
              ccTextEl.setAttribute("data-raw-cc", line);
              ccTextEl.textContent = line;
            }
            if (!entryObj.isRendered) {
              if (mainVideo.currentTime < seg.cutStart || mainVideo.currentTime > seg.cutEnd) {
                mainVideo.currentTime = seg.cutStart;
              }
              blurVideo.currentTime = mainVideo.currentTime;
              blurVideo.play().catch(() => {});
            }
          });

          mainVideo.addEventListener("pause", () => {
            if (!entryObj.isRendered) blurVideo.pause();
          });

          mainVideo.addEventListener("seeked", () => {
            const line = getCcLineAtTime(item, mainVideo.currentTime);
            if (ccTextEl) {
              ccTextEl.setAttribute("data-raw-cc", line);
              ccTextEl.textContent = line;
            }
            if (!entryObj.isRendered) blurVideo.currentTime = mainVideo.currentTime;
          });

          mainVideo.addEventListener("timeupdate", () => {
            const cur = mainVideo.currentTime || 0;
            const line = getCcLineAtTime(item, cur);
            if (ccTextEl) {
              ccTextEl.setAttribute("data-raw-cc", line);
              ccTextEl.textContent = line;
            }
            if (!entryObj.isRendered) {
              blurVideo.currentTime = cur;
              if (cur >= seg.cutEnd) {
                mainVideo.currentTime = seg.cutStart;
                mainVideo.play().catch(() => {});
              }
            }
          });
        }
      });

      bindVideoSourcesToCards();
      applyHookStyle();
    } catch (err) {
      elList.innerHTML = `<div class="empty-state">${t("no_vt")}</div>`;
    }
  }

  function applyLanguageUI() {
    try {
      const lang = loadState().lang;
      document.documentElement.lang = lang;

      document.querySelectorAll(".lang-btn").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-lang") === lang);
      });

      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const k = el.getAttribute("data-i18n");
        if (k) el.textContent = t(k);
      });

      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const k = el.getAttribute("data-i18n-placeholder");
        if (k) el.placeholder = t(k);
      });

      applyHookStyle();
      renderFiles();
      renderComments();
      renderList();
    } catch (err) {
      renderList();
    }
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chosen = btn.getAttribute("data-lang") === "en" ? "en" : "id";
      const st = loadState();
      st.lang = chosen;
      saveState(st);
      applyLanguageUI();
    });
  });

  elFileInput.addEventListener("change", () => {
    const files = Array.from(elFileInput.files || []);
    if (!files.length) return;
    const st = loadState();
    let latestId = "";
    let latestName = "";

    files.forEach((file) => {
      const id = "vt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const kb = Math.max(1, Math.round(file.size / 1024));
      const sizeLabel = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
      const objectUrl = URL.createObjectURL(file);
      videoBlobUrls.set(id, objectUrl);

      st.files.unshift({
        id,
        name: file.name,
        sizeLabel,
        waktu: nowLabel()
      });
      latestId = id;
      latestName = file.name;
    });

    saveState(st);
    renderFiles();
    bindVideoSourcesToCards();

    if (latestId) {
      const url = videoBlobUrls.get(latestId);
      if (url) {
        elSourcePlayerWrap.classList.add("active");
        elSourcePlayerName.textContent = latestName;
        elSourceVideoEl.src = url;
      }
    }
    elFileInput.value = "";
  });

  elFileList.addEventListener("click", (e) => {
    const playBtn = e.target.closest("button[data-play-source]");
    if (playBtn) {
      const fid = playBtn.getAttribute("data-play-source");
      const fname = playBtn.getAttribute("data-name") || "Bahan Video";
      const url = videoBlobUrls.get(fid);
      if (!url) {
        alert(t("reselect_video_note"));
        elFileInput.click();
        return;
      }
      elSourcePlayerWrap.classList.add("active");
      elSourcePlayerName.textContent = fname;
      elSourceVideoEl.src = url;
      elSourceVideoEl.play().catch(() => {});
      return;
    }

    const delBtn = e.target.closest("button[data-del-file]");
    if (!delBtn) return;
    const id = delBtn.getAttribute("data-del-file");
    const oldUrl = videoBlobUrls.get(id);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      videoBlobUrls.delete(id);
    }
    const st = loadState();
    st.files = st.files.filter((x) => x.id !== id);
    saveState(st);
    renderFiles();
  });

  btnBukaTrakteer.href = TRAKTEER_URL;

  btnSalinDana.addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(TRAKTEER_URL).catch(() => {});
    }
    btnSalinDana.textContent = t("btn_copied");
    setTimeout(() => {
      btnSalinDana.textContent = t("btn_copy_link");
    }, 1400);
  });

  document.getElementById("btn-add-komen").addEventListener("click", () => {
    const text = (elKomenInput.value || "").trim();
    if (!text) {
      elKomenInput.focus();
      return;
    }
    const st = loadState();
    st.comments.unshift({
      id: "km_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      tag: elKomenTag.value,
      nameColor: pickRandomNameColor(),
      text,
      waktu: nowLabel()
    });
    saveState(st);
    elKomenInput.value = "";
    renderComments();
  });

  elKomenList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-del-komen]");
    if (!btn) return;
    const id = btn.getAttribute("data-del-komen");
    const st = loadState();
    st.comments = st.comments.filter((x) => x.id !== id);
    saveState(st);
    renderComments();
  });

  const initState = loadState();
  elFont.value = initState.config.font;
  elHookCase.value = initState.config.hookCase || "mixed";
  elCcCase.value = initState.config.ccCase || "mixed";
  elHookStrength.value = initState.config.hookStrength || "faded";
  elCcStrength.value = initState.config.ccStrength || "faded";
  elWmStrength.value = initState.config.wmStrength || "faded";
  elColor.value = initState.config.color || "#FFFFFF";
  elCcColor.value = initState.config.ccColor || "#FFFFFF";
  elWmColor.value = initState.config.wmColor || "#FFFFFF";
  elHookBg.value = initState.config.hookBg || "black";
  elCcBg.value = initState.config.ccBg || "black";
  elWmBg.value = initState.config.wmBg || "black";
  elWmUsername.value = initState.config.wmUsername || "";
  elCcEnabled.value = initState.config.ccEnabled || "on";
  elCcLang.value = initState.config.ccLang || "id";
  elSpeed.value = initState.config.speed || "off";

  applyLanguageUI();

  function handleConfigChange() {
    const st = loadState();
    st.config = {
      ...st.config,
      font: elFont.value,
      hookCase: elHookCase.value,
      ccCase: elCcCase.value,
      hookStrength: elHookStrength.value,
      ccStrength: elCcStrength.value,
      wmStrength: elWmStrength.value,
      color: elColor.value,
      ccColor: elCcColor.value,
      wmColor: elWmColor.value,
      hookBg: elHookBg.value,
      ccBg: elCcBg.value,
      wmBg: elWmBg.value,
      wmUsername: elWmUsername.value,
      ccEnabled: elCcEnabled.value,
      ccLang: elCcLang.value,
      speed: elSpeed.value
    };
    saveState(st);
    applyHookStyle();
    bindVideoSourcesToCards();
  }

  elFont.addEventListener("change", handleConfigChange);
  elHookCase.addEventListener("change", handleConfigChange);
  elCcCase.addEventListener("change", handleConfigChange);
  elHookStrength.addEventListener("change", handleConfigChange);
  elCcStrength.addEventListener("change", handleConfigChange);
  elWmStrength.addEventListener("change", handleConfigChange);
  elColor.addEventListener("change", handleConfigChange);
  elCcColor.addEventListener("change", handleConfigChange);
  elWmColor.addEventListener("change", handleConfigChange);
  elHookBg.addEventListener("change", handleConfigChange);
  elCcBg.addEventListener("change", handleConfigChange);
  elWmBg.addEventListener("change", handleConfigChange);
  elWmUsername.addEventListener("input", handleConfigChange);
  elCcEnabled.addEventListener("change", handleConfigChange);
  elCcLang.addEventListener("change", handleConfigChange);
  elSpeed.addEventListener("change", handleConfigChange);

  elWmFileInput.addEventListener("change", () => {
    const file = elWmFileInput.files && elWmFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const st = loadState();
      st.config.wmImageName = file.name;
      st.config.wmImageData = typeof reader.result === "string" ? reader.result : "";
      saveState(st);
      applyHookStyle();
    };
    reader.readAsDataURL(file);
    elWmFileInput.value = "";
  });

  document.getElementById("btn-clear-wm").addEventListener("click", () => {
    const st = loadState();
    st.config.wmImageName = "";
    st.config.wmImageData = "";
    st.config.wmUsername = "";
    elWmUsername.value = "";
    saveState(st);
    applyHookStyle();
  });

  document.getElementById("btn-racik").addEventListener("click", async () => {
    const st = loadState();
    const briefVal = elBrief.value.trim();
    const judulVal = elJudul.value.trim();
    const gayaVal = elGaya.value;
    const targetDur = Number(elDurasiTarget.value || 40);
    const count = Math.max(1, Math.min(50, Number(elJumlahPaket.value || 5)));
    const ccLang = st.config.ccLang || "id";
    const wmSummary = formatWatermarkSummary(st.config);
    const latestFile = st.files[0] || null;
    const batch = [];

    for (let i = 0; i < count; i++) {
      const seed = st.items.length + i;
      const built = buildDoneForYouPack(judulVal, gayaVal, briefVal, seed, targetDur, ccLang);

      batch.push({
        id: "bk_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2, 5),
        judul: judulVal || built.topic,
        gaya: gayaVal,
        brief: briefVal,
        sourceId: latestFile ? latestFile.id : "",
        sourceName: latestFile ? latestFile.name : "",
        timing: built.timing,
        timingSummary: built.timingSummary,
        fypScore: built.fypScore,
        curve: built.curve,
        watermark: wmSummary || "Logo/Teks Bawah Hook",
        hook: built.hook,
        desc: built.desc,
        ccLines: built.ccLines,
        ccSample: built.ccSample,
        tags: built.tags,
        variantCount: i,
        waktu: nowLabel()
      });
    }

    const orderedBatch = batch.slice().reverse();
    st.items = [...orderedBatch, ...st.items];
    saveState(st);
    if (st.items[0]) {
      applyHookStyle(st.items[0].hook);
    }
    renderList();

    if (latestFile && videoBlobUrls.get(latestFile.id)) {
      await autoRenderItems(orderedBatch);
    }
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    elBrief.value = "";
    elJudul.value = "";
  });

  elFilterGaya.addEventListener("change", renderList);

  async function handleVtCardAction(act, id, btn) {
    const st = loadState();
    const idx = st.items.findIndex((x) => x.id === id);
    if (idx === -1) return;

    const current = st.items[idx];

    if (act === "fullscreen") {
      const playerEntry = cardPlayers.get(id);
      const stage = playerEntry && playerEntry.stageEl;
      if (stage && typeof stage.requestFullscreen === "function") {
        stage.requestFullscreen().catch(() => {});
      }
      return;
    }

    if (act === "delete") {
      cancelAutoRenderFlag = true;
      renderedClipBlobs.delete(id);
      const oldRUrl = renderedClipUrls.get(id);
      if (oldRUrl) {
        URL.revokeObjectURL(oldRUrl);
        renderedClipUrls.delete(id);
      }
      st.items.splice(idx, 1);
      saveState(st);
      renderList();
      return;
    }

    if (act === "regen") {
      cancelAutoRenderFlag = true;
      renderedClipBlobs.delete(id);
      const oldRUrl = renderedClipUrls.get(id);
      if (oldRUrl) {
        URL.revokeObjectURL(oldRUrl);
        renderedClipUrls.delete(id);
      }
      const nextVariant = (current.variantCount || 0) + 1;
      const targetDur = Number(elDurasiTarget.value || 40);
      const ccLang = st.config.ccLang || "id";
      const rebuilt = buildDoneForYouPack(
        current.judul,
        current.gaya,
        current.brief,
        nextVariant,
        targetDur,
        ccLang
      );
      const updatedItem = {
        ...current,
        hook: rebuilt.hook,
        desc: rebuilt.desc,
        ccLines: rebuilt.ccLines,
        ccSample: rebuilt.ccSample,
        tags: rebuilt.tags,
        timing: rebuilt.timing,
        timingSummary: rebuilt.timingSummary,
        fypScore: rebuilt.fypScore,
        curve: rebuilt.curve,
        variantCount: nextVariant,
        waktu: nowLabel()
      };
      st.items[idx] = updatedItem;
      saveState(st);
      applyHookStyle(updatedItem.hook);
      renderList();

      if (resolveVideoUrlForItem(updatedItem)) {
        await autoRenderItems([updatedItem]);
      }
      return;
    }

    if (act === "download") {
      let videoBlob = renderedClipBlobs.get(id);
      if (!videoBlob) {
        if (!resolveVideoUrlForItem(current)) {
          alert(t("reselect_video_note"));
          elFileInput.click();
          return;
        }
        const prevLabel = btn ? btn.textContent : "";
        if (btn) btn.textContent = t("rendering_clip");
        try {
          videoBlob = await renderVtClipVideoBlob(current);
          renderedClipBlobs.set(id, videoBlob);
          const nextUrl = URL.createObjectURL(videoBlob);
          renderedClipUrls.set(id, nextUrl);
          bindVideoSourcesToCards();
        } catch (err) {
          alert(t("reselect_video_note"));
          return;
        } finally {
          if (btn && prevLabel) btn.textContent = prevLabel;
        }
      }

      const num = (btn && btn.getAttribute("data-num")) || String(idx + 1);
      const safeName =
        String(current.judul || "klip_vt")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "") || "klip_vt";
      saveBlobAsFile(videoBlob, `${safeName}_vt_${num}.mp4`);
      if (btn) {
        const oldTxt = btn.textContent;
        btn.textContent = t("btn_downloaded");
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = oldTxt;
          btn.classList.remove("copied");
        }, 1500);
      }
    }
  }

  elList.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const btn = target ? target.closest("button[data-act]") : null;
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");
    if (!act || !id) return;
    handleVtCardAction(act, id, btn).catch(() => {});
  });

  document.getElementById("btn-unduh-semua").addEventListener("click", async () => {
    const ordered = getFilteredItems().slice().reverse();
    if (!ordered.length) return;

    const btnAll = document.getElementById("btn-unduh-semua");
    const oldAllLabel = btnAll.textContent;

    try {
      const zipEntries = [];
      for (let i = 0; i < ordered.length; i++) {
        const item = ordered[i];
        let blob = renderedClipBlobs.get(item.id);
        if (!blob) {
          if (!resolveVideoUrlForItem(item)) continue;
          btnAll.textContent = `${t("rendering_clip")} (${i + 1}/${ordered.length})`;
          blob = await renderVtClipVideoBlob(item);
          renderedClipBlobs.set(item.id, blob);
          const nextUrl = URL.createObjectURL(blob);
          renderedClipUrls.set(item.id, nextUrl);
        }
        const safeName =
          String(item.judul || "klip_vt")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "") || "klip_vt";
        zipEntries.push({
          filename: `${safeName}_vt_${i + 1}.mp4`,
          blob
        });
      }

      bindVideoSourcesToCards();

      if (!zipEntries.length) {
        alert(t("reselect_video_note"));
        elFileInput.click();
        return;
      }

      btnAll.textContent = t("zipping_all");
      const zipBlob = await buildZipBlob(zipEntries);
      const basePrefix =
        String(ordered[0].judul || "hasil_klip_vt")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "") || "hasil_klip_vt";
      saveBlobAsFile(zipBlob, `${basePrefix}_semua_klip.zip`);
      btnAll.textContent = t("btn_zip_downloaded");
      setTimeout(() => {
        btnAll.textContent = oldAllLabel;
      }, 1500);
    } catch (err) {
      alert(t("reselect_video_note"));
    } finally {
      btnAll.textContent = oldAllLabel;
    }
  });
})();
