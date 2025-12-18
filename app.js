// Micro Rent A Car PWA — v4 (safe single-load)
(() => {
  if (window.__MR_APP_LOADED__) return;
  window.__MR_APP_LOADED__ = true;

  const KEYS = {
    config: "mr_config_v4",
    cars: "mr_cars_v4",
    bookings: "mr_bookings_v4",
    adminAuthed: "mr_admin_authed_v4",
  };

  const DEFAULT_CONFIG = {
    nameEn: "Micro Rent A Car",
    nameAr: "مايكرو لتأجير السيارات",
    currency: "AED",
    whatsappNumbers: ["0507655219", "0508555597"],
    logoText: "MR",
    logoImageDataUrl: "", // base64 data URL (optional)
    headline: "استأجر سيارتك بسهولة في دقائق",
    subhead: "يومي • أسبوعي • شهري — العملة: AED",
    theme: {
      primary: "#6ee7ff",
      secondary: "#a78bfa",
      bg: "#0b0f14",
      card: "#111826",
      text: "#e8eef7",
      muted: "#a8b3c7",
    },
    adminPassword: "MR2026#",
  };

  const $ = (s)=>document.querySelector(s);
  const $$ = (s)=>Array.from(document.querySelectorAll(s));
  const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

  function load(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch{ return fallback; }
  }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  function escapeHtml(s=""){ return String(s).replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }
  function formatMoney(cfg, v){ const n = Number(v||0); return `${n.toLocaleString("en-US")} ${cfg.currency}`; }
  function rentalTypeLabel(v){ return v==="daily"?"يومي":v==="weekly"?"أسبوعي":"شهري"; }

  function toWhatsAppUrl(number, message){
    const digits = (number||"").replace(/\D/g,"");
    let wa = digits;
    if (wa.startsWith("0")) wa = "971" + wa.slice(1);
    const text = encodeURIComponent(message);
    return `https://wa.me/${wa}?text=${text}`;
  }

  function getDefaultCars(){
    return [
      { id: uid(), name:"Kia Seltos", category:"SUV", priceDaily:150, priceWeekly:900, priceMonthly:3000, status:"available",
        imageUrl:"https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=60", notes:"" },
      { id: uid(), name:"Nissan Kicks", category:"SUV", priceDaily:140, priceWeekly:850, priceMonthly:2800, status:"available",
        imageUrl:"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=60", notes:"" },
      { id: uid(), name:"Kia Cerato", category:"Sedan", priceDaily:120, priceWeekly:720, priceMonthly:2400, status:"booked",
        imageUrl:"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=60", notes:"" },
    ];
  }

  function ensureData(){
    const cfg = load(KEYS.config, null);
    if (!cfg) save(KEYS.config, DEFAULT_CONFIG);
    const cars = load(KEYS.cars, null);
    if (!cars || !Array.isArray(cars) || cars.length===0) save(KEYS.cars, getDefaultCars());
    const bookings = load(KEYS.bookings, null);
    if (!bookings || !Array.isArray(bookings)) save(KEYS.bookings, []);
  }
  async function seedConfigFromFileIfNeeded(){
    const existing = load(KEYS.config, null);
    if (existing) return;
    try{
      const res = await fetch("./config.json", { cache: "no-store" });
      if (!res.ok) return;
      const obj = await res.json();
      if (!obj || !obj.nameEn || !obj.nameAr) return;
      const merged = { ...DEFAULT_CONFIG, ...obj, theme: { ...DEFAULT_CONFIG.theme, ...(obj.theme||{}) } };
      save(KEYS.config, merged);
    }catch{}
  }


  function applyLogo(cfg){
    const logoBox = $("#logoBox");
    const logoText = $("#logoText");
    if (!logoBox) return;

    // Clear previous
    logoBox.innerHTML = "";
    const imgData = cfg.logoImageDataUrl || "";
    if (imgData){
      const img = document.createElement("img");
      img.alt = "logo";
      img.src = imgData;
      logoBox.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.id = "logoText";
      span.textContent = (cfg.logoText || "MR").toUpperCase();
      logoBox.appendChild(span);
    }
  }

  function applyConfig(cfg){
    $("#brandEn") && ($("#brandEn").textContent = cfg.nameEn);
    $("#brandAr") && ($("#brandAr").textContent = cfg.nameAr);
    $("#footerName") && ($("#footerName").textContent = cfg.nameEn);
    $("#currency") && ($("#currency").textContent = cfg.currency);
    $("#headline") && ($("#headline").textContent = cfg.headline || DEFAULT_CONFIG.headline);

    // Subhead (keep currency bold if present)
    if ($("#subhead")){
      $("#subhead").innerHTML = escapeHtml(cfg.subhead || DEFAULT_CONFIG.subhead)
        .replaceAll(escapeHtml(cfg.currency), `<strong>${escapeHtml(cfg.currency)}</strong>`);
    }

    document.title = `${cfg.nameEn} | ${cfg.nameAr}`;
    applyLogo(cfg);

    const t = cfg.theme || DEFAULT_CONFIG.theme;
    const r = document.documentElement.style;
    r.setProperty("--primary", t.primary);
    r.setProperty("--secondary", t.secondary);
    r.setProperty("--bg", t.bg);
    r.setProperty("--card", t.card);
    r.setProperty("--text", t.text);
    r.setProperty("--muted", t.muted);

    const meta = document.querySelector('meta[name="theme-color"]');
    meta && meta.setAttribute("content", t.bg);

    const msg = `مرحبًا ${cfg.nameEn} / ${cfg.nameAr}\nأريد حجز سيارة. الرجاء إرسال المتاح والأسعار.\nالمدة: (يومي/أسبوعي/شهري)\nالتواريخ: \nالاسم: \nالهاتف: `;
    const wa = toWhatsAppUrl(cfg.whatsappNumbers?.[0] || DEFAULT_CONFIG.whatsappNumbers[0], msg);
    $("#waQuick") && ($("#waQuick").href = wa);
    $("#waFooter") && ($("#waFooter").href = wa);
  }

  function initPWAInstall(){
    let deferredPrompt = null;
    const btn = $("#installBtn");
    window.addEventListener("beforeinstallprompt", (e)=>{
      e.preventDefault();
      deferredPrompt = e;
      if (btn) btn.style.display = "inline-flex";
    });
    btn && (btn.onclick = async ()=>{
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.style.display = "none";
    });
    if ("serviceWorker" in navigator){
      navigator.serviceWorker.register("./sw.js").catch(()=>{});
    }
  }

  async function initPublic(){
    await seedConfigFromFileIfNeeded();
    ensureData();
    const cfg = load(KEYS.config, DEFAULT_CONFIG);
    applyConfig(cfg);
    $("#year") && ($("#year").textContent = new Date().getFullYear());
    initPWAInstall();

    const cars = load(KEYS.cars, []);
    const carSelect = $("#carSelect");
    if (carSelect){
      carSelect.innerHTML = cars.map(c=>`<option value="${c.id}">${escapeHtml(c.name)} — ${c.status==="available"?"متاحة":"محجوزة"}</option>`).join("");
    }

    const grid = $("#carsGrid");
    const search = $("#search");
    const availability = $("#availability");

    function render(){
      if (!grid) return;
      const cfgNow = load(KEYS.config, DEFAULT_CONFIG);
      const q = (search?.value||"").trim().toLowerCase();
      const av = availability?.value || "all";
      const carsNow = load(KEYS.cars, [])
        .filter(c=>!q || (c.name||"").toLowerCase().includes(q) || (c.category||"").toLowerCase().includes(q))
        .filter(c=>av==="all" ? true : c.status===av);

      grid.innerHTML = carsNow.map(c=>{
        const statusBadge = c.status==="available" ? `<span class="badge ok">✅ متاحة</span>` : `<span class="badge no">⛔ محجوزة</span>`;
        const cat = c.category ? `<span class="badge">${escapeHtml(c.category)}</span>` : "";
        const img = c.imageUrl ? escapeHtml(c.imageUrl) : "";
        const message = `مرحبًا ${cfgNow.nameEn} / ${cfgNow.nameAr}\nأريد حجز السيارة التالية:\n- السيارة: ${c.name}\n- نوع الإيجار: \n- التواريخ: \n- الاسم: \n- الهاتف: \nملاحظات:`;
        const wa = toWhatsAppUrl(cfgNow.whatsappNumbers?.[0] || DEFAULT_CONFIG.whatsappNumbers[0], message);
        return `
          <div class="card car">
            <img alt="${escapeHtml(c.name)}" src="${img}" loading="lazy" />
            <h3>${escapeHtml(c.name)}</h3>
            <div class="badges">${statusBadge}${cat}</div>
            <div class="prices">
              <div class="price"><div class="k">يومي</div><div class="v">${formatMoney(cfgNow, c.priceDaily)}</div></div>
              <div class="price"><div class="k">أسبوعي</div><div class="v">${formatMoney(cfgNow, c.priceWeekly)}</div></div>
              <div class="price"><div class="k">شهري</div><div class="v">${formatMoney(cfgNow, c.priceMonthly)}</div></div>
            </div>
            ${c.notes ? `<div class="note small">${escapeHtml(c.notes)}</div>` : ""}
            <div class="form-actions" style="margin-top:12px">
              <a class="btn" href="${wa}">احجز على واتساب</a>
            </div>
          </div>
        `;
      }).join("");
    }

    search && (search.oninput = render);
    availability && (availability.onchange = render);
    render();

    const bookingForm = $("#bookingForm");
    const sendToWhatsApp = $("#sendToWhatsApp");

    function buildBookingMessage(cfg, data, car){
      return `مرحبًا ${cfg.nameEn} / ${cfg.nameAr}\nطلب حجز:\n- الاسم: ${data.name}\n- الهاتف: ${data.phone}\n- السيارة: ${car?.name||""}\n- نوع الإيجار: ${rentalTypeLabel(data.rentalType)}\n- البداية: ${data.startDate}\n- النهاية: ${data.endDate}\n- ملاحظات: ${data.notes||""}`;
    }

    if (bookingForm){
      bookingForm.onsubmit = (e)=>{
        e.preventDefault();
        const fd = new FormData(bookingForm);
        const data = Object.fromEntries(fd.entries());
        const car = load(KEYS.cars, []).find(c=>c.id===data.carId);
        const booking = { id: uid(), createdAt: new Date().toISOString(), ...data, carName: car?.name||"", status:"new" };
        const bookings = load(KEYS.bookings, []);
        bookings.unshift(booking);
        save(KEYS.bookings, bookings);
        alert("✅ تم إرسال الطلب وحفظه.");
        bookingForm.reset();
      };

      sendToWhatsApp && (sendToWhatsApp.onclick = ()=>{
        const cfgNow = load(KEYS.config, DEFAULT_CONFIG);
        const fd = new FormData(bookingForm);
        const data = Object.fromEntries(fd.entries());
        const car = load(KEYS.cars, []).find(c=>c.id===data.carId);
        const msg = buildBookingMessage(cfgNow, data, car);
        window.open(toWhatsAppUrl(cfgNow.whatsappNumbers?.[0] || DEFAULT_CONFIG.whatsappNumbers[0], msg), "_blank");
      });
    }
  }

  // Expose safe API for admin.js
  window.MR = { KEYS, DEFAULT_CONFIG, load, save, uid, escapeHtml, rentalTypeLabel, getDefaultCars, applyConfig, formatMoney, toWhatsAppUrl };

  document.addEventListener("DOMContentLoaded", ()=>{
    const path = (location.pathname||"").toLowerCase();
    if (path.endsWith("index.html") || !path.endsWith("admin.html")) initPublic();
  });
})();
