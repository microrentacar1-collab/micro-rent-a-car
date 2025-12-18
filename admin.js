// Admin panel logic — v4
(() => {
  if (window.__MR_ADMIN_LOADED__) return;
  window.__MR_ADMIN_LOADED__ = true;

  const { KEYS, DEFAULT_CONFIG, load, save, uid, escapeHtml, rentalTypeLabel, getDefaultCars, applyConfig, formatMoney } = window.MR;

  function isAuthed(){ return load(KEYS.adminAuthed, false) === true; }
  function setAuthed(v){ save(KEYS.adminAuthed, !!v); }

  async function fileToDataUrl(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = ()=>resolve(String(reader.result||""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function initAdmin(){
    const cfg = load(KEYS.config, null);
    if (!cfg) save(KEYS.config, DEFAULT_CONFIG);
    const cars = load(KEYS.cars, null);
    if (!cars || !Array.isArray(cars) || cars.length===0) save(KEYS.cars, getDefaultCars());
    const bookings = load(KEYS.bookings, null);
    if (!bookings || !Array.isArray(bookings)) save(KEYS.bookings, []);

    applyConfig(load(KEYS.config, DEFAULT_CONFIG));

    const loginCard = document.querySelector("#loginCard");
    const adminPanel = document.querySelector("#adminPanel");
    const loginForm = document.querySelector("#loginForm");

    function show(){
      if (isAuthed()){
        loginCard.classList.add("hidden");
        adminPanel.classList.remove("hidden");
        fillConfigForm();
        renderCarsTable();
        renderBookingsTable();
      } else {
        loginCard.classList.remove("hidden");
        adminPanel.classList.add("hidden");
      }
    }

    loginForm.onsubmit = (e)=>{
      e.preventDefault();
      const pw = new FormData(loginForm).get("password");
      const cfgNow = load(KEYS.config, DEFAULT_CONFIG);
      if (pw === (cfgNow.adminPassword || DEFAULT_CONFIG.adminPassword)){
        setAuthed(true);
        show();
      } else alert("كلمة المرور غير صحيحة");
    };

    document.querySelector("#logoutBtn").onclick = ()=>{ setAuthed(false); show(); };

    const configForm = document.querySelector("#configForm");
    const resetBtn = document.querySelector("#resetBtn");
    const logoFile = document.querySelector("#logoFile");
    const removeLogoBtn = document.querySelector("#removeLogoBtn");
    const changePassBtn = document.querySelector("#changePassBtn");

    function fillConfigForm(){
      const c = load(KEYS.config, DEFAULT_CONFIG);
      configForm.nameEn.value = c.nameEn;
      configForm.nameAr.value = c.nameAr;
      configForm.currency.value = c.currency;
      configForm.logoText.value = c.logoText || "MR";
      configForm.wa1.value = c.whatsappNumbers?.[0] || "";
      configForm.wa2.value = c.whatsappNumbers?.[1] || "";
      configForm.primary.value = c.theme?.primary || DEFAULT_CONFIG.theme.primary;
      configForm.secondary.value = c.theme?.secondary || DEFAULT_CONFIG.theme.secondary;
      configForm.bg.value = c.theme?.bg || DEFAULT_CONFIG.theme.bg;
      configForm.card.value = c.theme?.card || DEFAULT_CONFIG.theme.card;
      configForm.text.value = c.theme?.text || DEFAULT_CONFIG.theme.text;
      configForm.muted.value = c.theme?.muted || DEFAULT_CONFIG.theme.muted;
      configForm.headline.value = c.headline || DEFAULT_CONFIG.headline;
      configForm.subhead.value = c.subhead || DEFAULT_CONFIG.subhead;
      configForm.oldPass.value = "";
      configForm.newPass.value = "";
      if (logoFile) logoFile.value = "";
    }

    configForm.onsubmit = (e)=>{
      e.preventDefault();
      const c = load(KEYS.config, DEFAULT_CONFIG);
      const next = {
        ...c,
        nameEn: configForm.nameEn.value.trim(),
        nameAr: configForm.nameAr.value.trim(),
        currency: configForm.currency.value.trim(),
        logoText: (configForm.logoText.value.trim() || "MR").slice(0,4),
        whatsappNumbers: [configForm.wa1.value.trim(), configForm.wa2.value.trim()].filter(Boolean),
        headline: configForm.headline.value.trim(),
        subhead: configForm.subhead.value.trim(),
        theme: {
          primary: configForm.primary.value,
          secondary: configForm.secondary.value,
          bg: configForm.bg.value,
          card: configForm.card.value,
          text: configForm.text.value,
          muted: configForm.muted.value,
        },
      };
      save(KEYS.config, next);
      applyConfig(next);
      alert("✅ تم حفظ الإعدادات");
    };

    if (logoFile){
      logoFile.onchange = async ()=>{
        const file = logoFile.files?.[0];
        if (!file) return;
        if (file.size > 1.2 * 1024 * 1024){
          alert("الصورة كبيرة. اختر صورة أصغر (يفضل أقل من 1MB).");
          logoFile.value = "";
          return;
        }
        try{
          const dataUrl = await fileToDataUrl(file);
          const c = load(KEYS.config, DEFAULT_CONFIG);
          const next = { ...c, logoImageDataUrl: dataUrl };
          save(KEYS.config, next);
          applyConfig(next);
          alert("✅ تم تحديث اللوجو");
        }catch{
          alert("تعذر رفع اللوجو");
        }finally{
          logoFile.value = "";
        }
      };
    }

    removeLogoBtn.onclick = ()=>{
      const c = load(KEYS.config, DEFAULT_CONFIG);
      const next = { ...c, logoImageDataUrl: "" };
      save(KEYS.config, next);
      applyConfig(next);
      alert("✅ تم مسح صورة اللوجو");
    };

    changePassBtn.onclick = ()=>{
      const oldPass = (configForm.oldPass.value || "").trim();
      const newPass = (configForm.newPass.value || "").trim();
      if (!oldPass || !newPass) { alert("اكتب كلمة المرور الحالية والجديدة"); return; }
      const c = load(KEYS.config, DEFAULT_CONFIG);
      const current = c.adminPassword || DEFAULT_CONFIG.adminPassword;
      if (oldPass !== current){ alert("كلمة المرور الحالية غير صحيحة"); return; }
      if (newPass.length < 4){ alert("اجعل كلمة المرور 4 أحرف/أرقام أو أكثر"); return; }
      const next = { ...c, adminPassword: newPass };
      save(KEYS.config, next);
      alert("✅ تم تغيير كلمة المرور");
      configForm.oldPass.value = "";
      configForm.newPass.value = "";
    };

    resetBtn.onclick = ()=>{
      if (!confirm("إرجاع الإعدادات الافتراضية؟")) return;
      save(KEYS.config, DEFAULT_CONFIG);
      applyConfig(DEFAULT_CONFIG);
      fillConfigForm();
    };

    document.querySelector("#exportConfigBtn").onclick = ()=>{
      const cfgNow = load(KEYS.config, DEFAULT_CONFIG);
      const blob = new Blob([JSON.stringify(cfgNow, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "micro-rent-config.json";
      a.click();
      URL.revokeObjectURL(url);
    };
    const importInput = document.querySelector("#importConfigInput");
    importInput.onchange = async ()=>{
      const file = importInput.files?.[0];
      if (!file) return;
      try{
        const text = await file.text();
        const obj = JSON.parse(text);
        if (!obj.nameEn || !obj.nameAr) throw new Error("invalid");
        save(KEYS.config, {...DEFAULT_CONFIG, ...obj});
        applyConfig(load(KEYS.config, DEFAULT_CONFIG));
        fillConfigForm();
        alert("✅ تم استيراد الإعدادات");
      }catch{
        alert("ملف غير صالح");
      }finally{
        importInput.value = "";
      }
    };

    const modal = document.querySelector("#carModal");
    const closeModal = document.querySelector("#closeModal");
    const carForm = document.querySelector("#carForm");
    const deleteCarBtn = document.querySelector("#deleteCarBtn");
    const modalTitle = document.querySelector("#modalTitle");

    function openModal(car){
      modal.classList.remove("hidden");
      if (!car){
        modalTitle.textContent = "إضافة سيارة";
        carForm.reset();
        carForm.id.value = "";
        carForm.status.value = "available";
        deleteCarBtn.style.display = "none";
        return;
      }
      modalTitle.textContent = "تعديل سيارة";
      deleteCarBtn.style.display = "inline-flex";
      carForm.id.value = car.id;
      carForm.name.value = car.name || "";
      carForm.category.value = car.category || "";
      carForm.priceDaily.value = car.priceDaily ?? 0;
      carForm.priceWeekly.value = car.priceWeekly ?? 0;
      carForm.priceMonthly.value = car.priceMonthly ?? 0;
      carForm.status.value = car.status || "available";
      carForm.imageUrl.value = car.imageUrl || "";
      carForm.notes.value = car.notes || "";
    }
    function close(){ modal.classList.add("hidden"); }
    closeModal.onclick = close;
    modal.onclick = (e)=>{ if (e.target===modal) close(); };

    document.querySelector("#addCarBtn").onclick = ()=>openModal(null);

    carForm.onsubmit = (e)=>{
      e.preventDefault();
      const payload = {
        id: carForm.id.value || uid(),
        name: carForm.name.value.trim(),
        category: carForm.category.value.trim(),
        priceDaily: Number(carForm.priceDaily.value || 0),
        priceWeekly: Number(carForm.priceWeekly.value || 0),
        priceMonthly: Number(carForm.priceMonthly.value || 0),
        status: carForm.status.value,
        imageUrl: carForm.imageUrl.value.trim(),
        notes: carForm.notes.value.trim(),
      };
      const carsNow = load(KEYS.cars, []);
      const idx = carsNow.findIndex(c=>c.id===payload.id);
      if (idx>=0) carsNow[idx]=payload; else carsNow.unshift(payload);
      save(KEYS.cars, carsNow);
      close();
      renderCarsTable();
      alert("✅ تم حفظ السيارة");
    };

    deleteCarBtn.onclick = ()=>{
      const id = carForm.id.value;
      if (!id) return;
      if (!confirm("حذف السيارة؟")) return;
      save(KEYS.cars, load(KEYS.cars, []).filter(c=>c.id!==id));
      close();
      renderCarsTable();
    };

    function renderCarsTable(){
      const wrap = document.querySelector("#carsTableWrap");
      const cfgNow = load(KEYS.config, DEFAULT_CONFIG);
      const carsNow = load(KEYS.cars, []);
      wrap.innerHTML = `
        <div class="note small">أي تعديل هنا يظهر فورًا في صفحة التطبيق.</div>
        <div style="overflow:auto; margin-top:12px">
          <table class="table small">
            <thead>
              <tr>
                <th>السيارة</th><th>الفئة</th><th>يومي</th><th>أسبوعي</th><th>شهري</th><th>الحالة</th><th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              ${carsNow.map(c=>`
                <tr>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td>${escapeHtml(c.category||"-")}</td>
                  <td>${formatMoney(cfgNow, c.priceDaily)}</td>
                  <td>${formatMoney(cfgNow, c.priceWeekly)}</td>
                  <td>${formatMoney(cfgNow, c.priceMonthly)}</td>
                  <td>${c.status==="available"?"متاحة":"محجوزة"}</td>
                  <td><button class="btn btn-ghost" data-edit="${c.id}">تعديل</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      document.querySelectorAll("button[data-edit]").forEach(b=>{
        b.onclick = ()=>{
          const id = b.getAttribute("data-edit");
          const car = load(KEYS.cars, []).find(x=>x.id===id);
          openModal(car);
        };
      });
    }

    function renderBookingsTable(){
      const wrap = document.querySelector("#bookingsTableWrap");
      const bookingsNow = load(KEYS.bookings, []);
      wrap.innerHTML = `
        <div class="note small">طلبات الحجز (على نفس الجهاز). يمكنك تصديرها CSV.</div>
        <div style="overflow:auto; margin-top:12px">
          <table class="table small">
            <thead>
              <tr>
                <th>التاريخ</th><th>الاسم</th><th>الهاتف</th><th>السيارة</th><th>النوع</th><th>من</th><th>إلى</th><th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${bookingsNow.map(b=>`
                <tr>
                  <td>${escapeHtml(new Date(b.createdAt).toLocaleString("ar-EG"))}</td>
                  <td><strong>${escapeHtml(b.name||"")}</strong></td>
                  <td>${escapeHtml(b.phone||"")}</td>
                  <td>${escapeHtml(b.carName||"")}</td>
                  <td>${escapeHtml(rentalTypeLabel(b.rentalType))}</td>
                  <td>${escapeHtml(b.startDate||"")}</td>
                  <td>${escapeHtml(b.endDate||"")}</td>
                  <td>${escapeHtml(b.notes||"-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    document.querySelector("#exportBookingsBtn").onclick = ()=>{
      const bookingsNow = load(KEYS.bookings, []);
      const header = ["createdAt","name","phone","carName","rentalType","startDate","endDate","notes"];
      const rows = bookingsNow.map(b=>header.map(k=>(""+(b[k]??"")).replaceAll('"','""')));
      const csv = [header.join(","), ...rows.map(r=>r.map(v=>`"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download="bookings.csv"; a.click();
      URL.revokeObjectURL(url);
    };
    document.querySelector("#clearBookingsBtn").onclick = ()=>{
      if (!confirm("مسح كل الطلبات؟")) return;
      save(KEYS.bookings, []);
      renderBookingsTable();
    };

    document.querySelector("#resetCarsBtn").onclick = ()=>{
      if (!confirm("إرجاع سيارات الديمو؟ سيستبدل السيارات الحالية.")) return;
      save(KEYS.cars, getDefaultCars());
      renderCarsTable();
      alert("✅ تم");
    };

    show();
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    const path = (location.pathname||"").toLowerCase();
    if (path.endsWith("admin.html")) initAdmin();
  });
})();
