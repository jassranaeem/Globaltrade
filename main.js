/* Global Trade Motors — shared site script */

/* ===== Business contact: replace with real details before going live ===== */
const CONFIG = {
  whatsapp: "81900000000",            // digits only, with country code
  whatsappDisplay: "+81 90-0000-0000",
  phone: "+81 29-000-0000",
  email: "sales@globaltrade.jp",
  address: "Ibaraki Prefecture, Japan",
  hours: "Mon–Sat, 9:00–18:00 JST"
};

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const waLink = text => "https://wa.me/" + CONFIG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
const hello = "Hello Global Trade, I want to import a car from Japan.";

/* contact details wherever they appear */
document.querySelectorAll("[data-contact]").forEach(el => {
  const k = el.dataset.contact;
  if (k === "whatsapp") el.textContent = CONFIG.whatsappDisplay;
  else if (CONFIG[k]) el.textContent = CONFIG[k];
});
document.querySelectorAll("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa || hello); });

/* mobile menu */
(function () {
  const btn = $("menuBtn"), nav = $("mainNav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
  });
})();

/* current page in nav */
(function () {
  const page = document.body.dataset.page;
  document.querySelectorAll("#mainNav a[data-page]").forEach(a => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
  });
})();

/* ===== Popular models ===== */
const MODELS = [
  {make:"Toyota", name:"Land Cruiser Prado", body:"SUV · 4WD", code:"150", chassis:"TRJ150 / GDJ150", years:"2018–2023", engine:"2.7 / 2.8D", grade:"4.5+"},
  {make:"Toyota", name:"Aqua Hybrid", body:"Hatchback", code:"MXPK", chassis:"NHP10 / MXPK10", years:"2019–2023", engine:"1.5 HV", grade:"4.5+"},
  {make:"Honda", name:"Vezel e:HEV", body:"Crossover", code:"RV5", chassis:"RV3 / RV5", years:"2021–2024", engine:"1.5 HV", grade:"4.5+"},
  {make:"Toyota", name:"Alphard", body:"Luxury MPV", code:"AH30", chassis:"AGH30 / GGH30 / AYH30", years:"2018–2023", engine:"2.5 / 3.5", grade:"4.5+"},
  {make:"Suzuki", name:"Every Wagon", body:"Kei van", code:"DA17", chassis:"DA17W", years:"2019–2024", engine:"660cc", grade:"4+"},
  {make:"Nissan", name:"X-Trail", body:"SUV", code:"T32", chassis:"T32 / T33", years:"2019–2023", engine:"2.0 / HV", grade:"4.5+"}
];
(function () {
  const grid = $("modelGrid");
  if (!grid) return;
  grid.innerHTML = MODELS.map((m, i) => `
    <article class="model">
      <span class="code" aria-hidden="true">${m.code}</span>
      <div class="top"><span class="tag">${m.make}</span><span class="body">${m.body}</span></div>
      <h3>${m.name}</h3>
      <span class="chassis">Chassis ${m.chassis}</span>
      <div class="specs"><div><span>Years</span><b>${m.years}</b></div><div><span>Engine</span><b>${m.engine}</b></div><div><span>Grade</span><b>${m.grade}</b></div></div>
      <button type="button" data-i="${i}">Request this model →</button>
    </article>`).join("");
  grid.addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    const m = MODELS[+b.dataset.i];
    if (!$("reqForm")) { location.href = "contact.html?model=" + encodeURIComponent(m.make + "|" + m.name + "|" + m.years) + "#request"; return; }
    fillModel(m.make, m.name, m.years);
  });
})();
function fillModel(make, model, years) {
  if (!$("reqForm")) return;
  $("make").value = make; $("model").value = model; $("year").value = years || "";
  showForm();
  $("request").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  setTimeout(() => $("country").focus({ preventScroll: true }), 600);
}
/* prefill from ?model= when arriving at the contact page */
(function () {
  const p = new URLSearchParams(location.search).get("model");
  if (p && $("reqForm")) { const [mk, md, yr] = p.split("|"); setTimeout(() => fillModel(mk, md, yr), 300); }
})();

/* 3D tilt on cards */
document.querySelectorAll(".model, .tilt").forEach(card => {
  if (reduce) return;
  card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  });
  card.addEventListener("pointerleave", () => card.style.transform = "");
});

/* ===== Car request form ===== */
function showForm() { if ($("reqForm")) { $("reqForm").hidden = false; $("doneBox").hidden = true; } }
(function () {
  const form = $("reqForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const need = [["make","make"],["model","model"],["country","destination country"],["name","name"],["phone","WhatsApp number"]];
    const miss = need.filter(([id]) => !$(id).value.trim());
    if (miss.length) { $("formErr").textContent = "Please add your " + miss.map(m => m[1]).join(", ") + "."; $("formErr").hidden = false; $(miss[0][0]).focus(); return; }
    $("formErr").hidden = true;
    const v = id => $(id).value.trim();
    const msg = [
      "CAR REQUEST: Global Trade",
      "Car: " + v("make") + " " + v("model") + (v("year") ? " (" + v("year") + ")" : ""),
      "Min. grade: " + v("grade"),
      "Budget: " + (v("budget") ? "USD " + v("budget") : "Open"),
      "Ship to: " + v("country"),
      v("notes") ? "Notes: " + v("notes") : null,
      "",
      "Name: " + v("name"),
      "WhatsApp: " + v("phone"),
      v("email") ? "Email: " + v("email") : null
    ].filter(l => l !== null).join("\n");
    $("msgOut").textContent = msg;
    $("sendWa").href = waLink(msg);
    form.hidden = true; $("doneBox").hidden = false;
  });
  $("editReq").addEventListener("click", showForm);
  $("copyMsg").addEventListener("click", () => {
    const t = $("msgOut").textContent, b = $("copyMsg");
    const sel = () => { const r = document.createRange(); r.selectNodeContents($("msgOut")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Text selected"; };
    try { navigator.clipboard.writeText(t).then(() => { b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy text", 1800); }, sel); } catch (_) { sel(); }
  });
})();

/* ===== Gallery filter + lightbox ===== */
(function () {
  const grid = $("galleryGrid");
  if (!grid) return;
  document.querySelectorAll(".filters button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach(o => o.setAttribute("aria-pressed", o === b));
    const f = b.dataset.f;
    grid.querySelectorAll(".shot").forEach(s => { s.hidden = f !== "all" && s.dataset.cat !== f; });
  }));
  const box = $("lightbox"), img = $("lbImg"), cap = $("lbCap");
  grid.addEventListener("click", e => {
    const s = e.target.closest(".shot"); if (!s) return;
    const i = s.querySelector("img");
    img.src = i.src; img.alt = i.alt; cap.textContent = s.querySelector("figcaption").textContent;
    box.hidden = false; $("lbClose").focus();
  });
  const close = () => { box.hidden = true; };
  $("lbClose").addEventListener("click", close);
  box.addEventListener("click", e => { if (e.target === box) close(); });
  addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();
