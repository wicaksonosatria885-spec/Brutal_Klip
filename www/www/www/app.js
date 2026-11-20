const STORAGE_KEY = "brutal_klip_state_v1";

const SAFE_BACKSOUNDS = {
  komedi: "Upbeat Quirky Staccato (Royalty-Free / No Copyright)",
  horor: "Dark Ambient Pulse Low-Drone (Royalty-Free / No Copyright)",
  natural: "Warm Acoustic Lo-Fi Breeze (Royalty-Free / No Copyright)"
};

const i18n = {
  id: {
    secAccount: "Akun & Sinkronisasi",
    secBrief: "Brief Campaign & Generator VT",
    secStats: "Statistik Potensi FYP & Retensi",
    secEditor: "Tempat Rapihin VT & Riwayat",
    btnGenerate: "Analisis Potensi FYP & Buat Paket VT"
  },
  en: {
    secAccount: "Account & Sync",
    secBrief: "Campaign Brief & VT Generator",
    secStats: "FYP Potential & Retention Stats",
    secEditor: "VT Fine-Tune Workspace & History",
    btnGenerate: "Analyze FYP Potential & Generate VT Batch"
  }
};

let state = loadState();

function defaultState() {
  return {
    lang: "id",
    account: null,
    items: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function scoreFromBrief(brief, index) {
  const lenBoost = Math.min(18, Math.floor((brief.length || 20) / 15));
  const baseFyp = 72 + ((index * 7 + lenBoost) % 24);
  const retention = Math.min(92, Math.max(45, baseFyp - 6 + ((index * 3) % 10)));
  const rating = (baseFyp / 20).toFixed(1);
  return { fypScore: baseFyp, retention, rating };
}

function generateBatch() {
  const project = document.getElementById("projectName").value.trim() || "Brutal Klip Batch";
  const count = parseInt(document.getElementById("vtCount").value, 10) || 10;
  const theme = document.getElementById("themeSelect").value;
  const brief = document.getElementById("briefText").value.trim() || "Sesuai brief campaign";
  const videoName = document.getElementById("videoInput").files?.[0]?.name || "Sumber_Video";

  const opts = {
    subtitle: document.getElementById("optSubtitle").checked,
    enhance: document.getElementById("optEnhance").checked,
    faceTrack: document.getElementById("optFaceTrack").checked,
    watermark: document.getElementById("optWatermark").checked,
    reminder: document.getElementById("optReminder").checked
  };

  const nowDate = new Date().toLocaleDateString("id-ID");
  const keyword = brief.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");

  for (let i = 1; i <= count; i++) {
    const metrics = scoreFromBrief(brief, i);
    const title = `${project} - VT #${i} (${videoName})`;
    const hook =
      state.lang === "id"
        ? `[FYP ${metrics.fypScore}%] Jangan skip! Bagian ini paling krusial untuk "${keyword || project}"`
        : `[FYP ${metrics.fypScore}%] Don't scroll! Key moment for "${keyword || project}"`;

    const description =
      state.lang === "id"
        ? `${hook}\nRingkasan brief: ${brief}\nCatatan rapihin: Subtitle=${opts.subtitle}, Jernih=${opts.enhance}, FaceTrack=${opts.faceTrack}, Watermark=${opts.watermark}`
        : `${hook}\nBrief summary: ${brief}\nEdit flags: Subtitle=${opts.subtitle}, Enhance=${opts.enhance}, FaceTrack=${opts.faceTrack}, Watermark=${opts.watermark}`;

    const hashtags = `#fyp #brutalklip #${theme} #campaign #clipping`;

    state.items.unshift({
      id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name: title,
      date: nowDate,
      theme,
      hook,
      description,
      hashtags,
      backsound: SAFE_BACKSOUNDS[theme],
      fypScore: metrics.fypScore,
      retention: metrics.retention,
      rating: metrics.rating,
      notes: ""
    });
  }

  saveState();
  renderAll();
}

function updateItem(id, field, value) {
  const target = state.items.find((x) => x.id === id);
  if (!target) return;
  target[field] = value;
  saveState();
  renderStatsAndChart();
}

function deleteItem(id) {
  state.items = state.items.filter((x) => x.id !== id);
  saveState();
  renderAll();
}

function renderStatsAndChart() {
  const total = state.items.length;
  const avgFyp = total
    ? Math.round(state.items.reduce((a, b) => a + b.fypScore, 0) / total)
    : 0;
  const avgRet = total
    ? Math.round(state.items.reduce((a, b) => a + b.retention, 0) / total)
    : 0;

  document.getElementById("statsSummary").innerHTML = `
    <div class="stat-box"><span>Total VT</span><strong>${total}</strong></div>
    <div class="stat-box"><span>Avg FYP Potential</span><strong>${avgFyp}%</strong></div>
    <div class="stat-box"><span>Avg Retention</span><strong>${avgRet}%</strong></div>
  `;

  const canvas = document.getElementById("fypChart");
  const ctx = canvas.getContext("2d");
  const w = (canvas.width = canvas.clientWidth || 600);
  const h = (canvas.height = 140);
  ctx.clearRect(0, 0, w, h);

  const sample = state.items.slice(0, 15).reverse();
  if (!sample.length) return;

  const barW = Math.max(12, Math.floor((w - 40) / sample.length) - 6);
  sample.forEach((item, idx) => {
    const barH = Math.round((item.fypScore / 100) * (h - 32));
    const x = 20 + idx * (barW + 6);
    const y = h - barH - 16;
    ctx.fillStyle = item.fypScore >= 80 ? "#22c55e" : "#38bdf8";
    ctx.fillRect(x, y, barW, barH);
  });
}

function renderList() {
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  const themeFilter = document.getElementById("filterTheme").value;

  const filtered = state.items.filter((it) => {
    const matchTheme = themeFilter === "all" || it.theme === themeFilter;
    const matchText =
      !q ||
      it.name.toLowerCase().includes(q) ||
      it.hook.toLowerCase().includes(q) ||
      it.hashtags.toLowerCase().includes(q) ||
      it.date.toLowerCase().includes(q);
    return matchTheme && matchText;
  });

  const container = document.getElementById("vtList");
  if (!filtered.length) {
    container.innerHTML = `<p class="muted">Belum ada VT yang cocok.</p>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (it) => `
      <div class="vt-item">
        <div class="vt-header">
          <strong>${it.name}</strong>
          <div>
            <span class="pill">Rating ${it.rating}/5</span>
            <span class="pill">FYP ${it.fypScore}%</span>
            <span class="pill">Retensi ${it.retention}%</span>
            <span class="pill">${it.date}</span>
          </div>
        </div>
        <label>Hook</label>
        <input type="text" value="${escapeHtml(it.hook)}" onchange="updateItem('${it.id}', 'hook', this.value)" />
        <label style="margin-top:8px;">Deskripsi</label>
        <textarea rows="2" onchange="updateItem('${it.id}', 'description', this.value)">${escapeHtml(it.description)}</textarea>
        <div class="grid-2" style="margin-top:8px;">
          <div>
            <label>Tagar / Hashtag</label>
            <input type="text" value="${escapeHtml(it.hashtags)}" onchange="updateItem('${it.id}', 'hashtags', this.value)" />
          </div>
          <div>
            <label>Back Sound (Bebas Hak Cipta)</label>
            <input type="text" value="${escapeHtml(it.backsound)}" onchange="updateItem('${it.id}', 'backsound', this.value)" />
          </div>
        </div>
        <label style="margin-top:8px;">Catatan Rapihin Sendiri</label>
        <input type="text" placeholder="Trim detik ke-..., geser posisi wajah, dll." value="${escapeHtml(it.notes)}" onchange="updateItem('${it.id}', 'notes', this.value)" />
        <button style="margin-top:8px; background:#334155;" class="btn-primary" onclick="deleteItem('${it.id}')">Hapus</button>
      </div>
    `
    )
    .join("");
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyLang() {
  const dict = i18n[state.lang] || i18n.id;
  document.getElementById("secAccount").textContent = dict.secAccount;
  document.getElementById("secBrief").textContent = dict.secBrief;
  document.getElementById("secStats").textContent = dict.secStats;
  document.getElementById("secEditor").textContent = dict.secEditor;
  document.getElementById("btnGenerate").textContent = dict.btnGenerate;
  document.getElementById("btnLangId").classList.toggle("active", state.lang === "id");
  document.getElementById("btnLangEn").classList.toggle("active", state.lang === "en");
}

function renderAll() {
  applyLang();
  renderStatsAndChart();
  renderList();
  if (state.account) {
    document.getElementById("accountInfo").textContent =
      `Akun: ${state.account.email} • Mode Offline/Online siap`;
  }
}

document.getElementById("btnLangId").addEventListener("click", () => {
  state.lang = "id";
  saveState();
  renderAll();
});

document.getElementById("btnLangEn").addEventListener("click", () => {
  state.lang = "en";
  saveState();
  renderAll();
});

document.getElementById("btnLogin").addEventListener("click", () => {
  const email = document.getElementById("userEmail").value.trim();
  const pass = document.getElementById("userPass").value.trim();
  if (!email) return;
  state.account = { email, syncKey: pass ? "configured" : "local" };
  saveState();
  renderAll();
});

document.getElementById("btnGenerate").addEventListener("click", generateBatch);
document.getElementById("searchInput").addEventListener("input", renderList);
document.getElementById("filterTheme").addEventListener("change", renderList);

renderAll();
