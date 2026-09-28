/* INFINERO Vertrieb – App */
(function () {
  "use strict";

  // ---------------------------------------------------------------- Stammdaten
  const PRODUKTE = [
    { code: "PAKET-1", name: "Stufe 1 · Website", setup: 990, monat: 59 },
    { code: "PAKET-2", name: "Stufe 2 · + Web-Chatbot", setup: 1680, monat: 119 },
    { code: "PAKET-3", name: "Stufe 3 · + Messaging-Bot", setup: 2370, monat: 199 },
    { code: "PAKET-4", name: "Stufe 4 · + KI-Caller", setup: 3360, monat: 399 },
    { code: "WEBSITE", name: "Website (einzeln)", setup: 990, monat: 59 },
    { code: "WEBCHAT", name: "Web-Chatbot (einzeln)", setup: 690, monat: 79 },
    { code: "MSGBOT", name: "Messaging-Bot je Kanal", setup: 690, monat: 99 },
    { code: "KICALLER", name: "KI-Caller (einzeln)", setup: 990, monat: 249 },
    { code: "UPGRADE-2", name: "Upgrade Stufe 1 → 2", setup: 690, monat: 60 },
    { code: "UPGRADE-3", name: "Upgrade Stufe 2 → 3", setup: 690, monat: 80 },
    { code: "UPGRADE-4", name: "Upgrade Stufe 3 → 4", setup: 990, monat: 200 },
  ];
  const INTERESSE = [["WEBSITE", "Website"], ["WEBCHAT", "Web-Chatbot"], ["MSGBOT", "WhatsApp/Messenger-Bot"], ["KICALLER", "KI-Caller"]];
  const STATUS = {
    neu: ["Neu", "accent"], nicht_erreicht: ["Nicht erreicht", ""], rueckruf: ["Rückruf", "warn"],
    info_angefragt: ["Infos angefragt", "accent"], interesse: ["Interesse", "ok"], termin: ["Termin", "ok"],
    angebot: ["Angebot", "warn"], gewonnen: ["Kunde", "ok"], kein_interesse: ["Kein Interesse", "bad"], kein_kontakt: ["Nicht erreichbar", "bad"],
  };
  const MAX_VERSUCHE = 5;
  const SIGNATUR = ["INFINERO – KI-Infrastruktur für Unternehmen", "Closewitzer Straße 19 · 07743 Jena"];
  const MAILTEXT = {
    WEBSITE: ["Moderne Website", "individuell gestaltet, fürs Handy optimiert und bei Google gut auffindbar", 990, 59],
    WEBCHAT: ["Web-Chatbot", "beantwortet Kundenfragen rund um die Uhr direkt auf Ihrer Website und nimmt Anfragen entgegen", 690, 79],
    MSGBOT: ["WhatsApp-/Messenger-Bot", "antwortet automatisch auf Nachrichten, vereinbart Termine und entlastet Ihr Team (je Kanal)", 690, 99],
    KICALLER: ["KI-Telefonassistent", "nimmt Anrufe an, wenn Sie gerade keine Zeit haben, beantwortet Fragen und notiert Rückrufwünsche", 990, 249],
  };
  const WARUM_MONATLICH = "Warum monatlich statt einmalig? Weil im Preis wirklich alles steckt: Hosting, Domain & Sicherheit, laufende Pflege und Updates, die Aktualisierung Ihrer Rechtstexte – und jede Änderung, die Sie sich wünschen: Öffnungs- und Urlaubszeiten, Aktionen, Preise, Fotos, Farben. Eine kurze Nachricht genügt, wir setzen es um – ohne Extra-Rechnung. Gefällt Ihnen Ihr Design irgendwann nicht mehr, gestalten wir Ihre Seite neu.";
  // Info-Mail-Vorlagen je Zielgruppe (Texte von Ziu). {firma} wird ersetzt.
  const VORLAGEN = {
    gastro: {
      betreff: "Ihr Tisch bleibt nie mehr unbesetzt – Ihre Infos von INFINERO",
      gespraech: "das freundliche Telefonat", danach: "schön, dass Sie {firma} nach vorne bringen möchten.",
      einleitung: "Kurz zusammengefasst, worüber wir gesprochen haben:",
      nutzen: "Gerade in der Gastronomie geht das meiste Geschäft verloren, wenn im Service niemand ans Telefon kann. Genau da setzen wir an: kein verpasster Anruf, keine verpasste Reservierung – rund um die Uhr.",
      web: "Ihr aktueller Webauftritt lässt online noch Reservierungen liegen, gerade auf dem Smartphone. Eine moderne Seite mit Online-Reservierung ändert das.",
      demo: "So könnte das für einen Betrieb wie Ihren aussehen – schauen Sie sich unsere Live-Demo an:",
      termin: "Wenn Sie mögen, zeige ich Ihnen das in einem kurzen, unverbindlichen Termin (ca. 15 Min.) live an Ihrem Fall",
      stopp: "Und falls Sie keine weiteren Informationen wünschen, sagen Sie einfach kurz Bescheid – dann melden wir uns nicht wieder.",
    },
    beauty: {
      betreff: "Mehr Termine – auch wenn Sie längst Feierabend haben",
      gespraech: "das nette Telefonat", danach: "ich freue mich, dass {firma} das Thema angehen möchte.",
      einleitung: "Das ist der Überblick zu dem, was Sie interessiert:",
      nutzen: "Viele Kundinnen fragen genau dann an, wenn Sie gerade an der Kundin arbeiten oder längst Feierabend haben. Mit automatischer Beantwortung und Terminbuchung über WhatsApp geht keine Anfrage mehr verloren – ohne dass Sie ständig aufs Handy schauen müssen.",
      web: "Ihr aktueller Auftritt online wirkt noch nicht so hochwertig wie Ihre Arbeit im Studio. Eine ruhige, moderne Seite mit Online-Buchung passt das an.",
      demo: "So fühlt sich das für ein Studio wie Ihres an – hier unsere Live-Demo:",
      termin: "Gern zeige ich Ihnen das in einem kurzen, unverbindlichen Termin (ca. 15 Min.) direkt an Ihrem Beispiel",
      stopp: "Und falls Sie keine weiteren Informationen wünschen, geben Sie mir einfach kurz Bescheid – dann melden wir uns nicht wieder.",
    },
    handwerk: {
      betreff: "Keine verpasste Anfrage mehr – Ihr Angebot von INFINERO",
      gespraech: "das Gespräch", danach: "gut, dass wir bei {firma} ins Tun kommen.",
      einleitung: "Hier noch einmal, worüber wir gesprochen haben:",
      nutzen: "Als Handwerker sind Sie auf der Baustelle, nicht am Telefon – und genau da gehen Aufträge verloren. Mit einer Website, die Anfragen bringt, und einem Assistenten, der verpasste Anrufe zurückholt, landet jede Anfrage bei Ihnen statt beim Wettbewerb.",
      web: "Ihr aktueller Webauftritt bringt online noch zu wenige Anfragen – gerade mobil. Eine moderne Seite mit klarer Rückruf-Funktion ändert das.",
      demo: "So sieht das für einen Betrieb wie Ihren aus – schauen Sie in unsere Live-Demo:",
      termin: "Wenn Sie mögen, gehe ich das in einem kurzen, unverbindlichen Termin (ca. 15 Min.) mit Ihnen durch",
      stopp: "Und falls Sie keine weiteren Informationen wünschen, sagen Sie einfach kurz Bescheid – dann melden wir uns nicht wieder.",
    },
  };
  const SATZ_V = 0.5, SATZ_T = 0.25;
  const ART = { vor_ort: "Vor Ort", telefon: "Telefon", video: "Video" };

  // ---------------------------------------------------------------- Motivation
  const SPRUECHE = [
    "Jedes Nein bringt dich einem Ja näher.", "100 Anrufe sind 100 Chancen.", "Nicht der Beste gewinnt, sondern der, der dranbleibt.",
    "Heute ist ein guter Tag für einen Abschluss.", "Ein Lächeln hört man durchs Telefon.", "Wer nicht fragt, verkauft nicht.",
    "Der nächste Anruf kann der Abschluss des Monats sein.", "Einwände sind versteckte Kaufsignale.", "Disziplin schlägt Motivation – wähl die nächste Nummer.",
    "Du verkaufst keine Website. Du verkaufst mehr Kunden.", "Kleine Schritte jeden Tag – große Zahlen am Monatsende.", "Ein Termin ist ein halber Abschluss.",
    "Mut ist, trotzdem noch einmal anzurufen.", "Erfolg ist die Summe vieler kleiner Gespräche.", "Sei die beste Stimme, die sie heute hören.",
    "Zuhören verkauft mehr als Reden.", "Der Kunde kauft zuerst dich – dann das Produkt.", "Heute säen, morgen ernten.",
    "Konstanz schlägt Talent.", "Keine Ausreden, nur Ergebnisse.", "Wer 100-mal anruft, muss nicht auf Glück hoffen.",
    "Ein „Vielleicht“ ist ein „Ja“, das noch Infos braucht.", "Deine Energie ist ansteckend – zeig sie.", "Nicht zählen, was fehlt. Zählen, was geht.",
    "Die beste Zeit für den nächsten Anruf ist jetzt.", "Mach heute, wofür du dir morgen dankbar bist.", "Ablehnung ist nicht persönlich – sie ist Statistik.",
    "Ein guter Tag beginnt mit dem ersten Anruf.", "Stark anfangen, stärker aufhören.", "Hunger schlägt Glück.",
    "Fokus aufs Gespräch, nicht aufs Nein.", "Jeder Anruf macht dich besser.", "Du bist nur einen Anruf von einem richtig guten Tag entfernt.",
    "Wer aufgibt, kann nicht gewinnen.", "Aus „keine Zeit“ wird „Wann passt es Ihnen besser?“", "Zahlen lügen nicht – mach sie groß.",
    "Groß denken, konsequent wählen.", "Heute ist ein Rekordtag in Arbeit.", "Der Hörer ist leichter, als er aussieht.", "Profis rufen auch an, wenn sie keine Lust haben.",
  ];
  const spruchDesTages = () => { const d = new Date(), n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); return SPRUECHE[n % SPRUECHE.length]; };
  const ruhig = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function feiern(titel, text, gross = true) {
    const o = document.createElement("div"); o.className = "feier" + (gross ? " gross" : ""); o.setAttribute("role", "status");
    const b = document.createElement("div"); b.className = "feier-box";
    const h = document.createElement("b"); h.textContent = titel; const s = document.createElement("span"); s.textContent = text || "";
    b.append(h, s); o.append(b);
    if (!ruhig()) {
      const c = document.createElement("canvas"); o.prepend(c); c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
      const x = c.getContext("2d"), farben = ["#8AA6FF", "#5FD39A", "#F2C063", "#FF8A80", "#FFFFFF", "#C3A6FF"];
      const teile = Array.from({ length: gross ? 160 : 70 }, () => ({ x: c.width / 2, y: c.height * 0.45, vx: (Math.random() - .5) * 26 * devicePixelRatio,
        vy: (Math.random() * -22 - 6) * devicePixelRatio, r: (4 + Math.random() * 5) * devicePixelRatio, f: farben[Math.floor(Math.random() * farben.length)], w: Math.random() * 6 }));
      let t0 = null;
      const frame = ts => { t0 ??= ts; const dt = ts - t0; x.clearRect(0, 0, c.width, c.height);
        teile.forEach(p => { p.vy += 0.7 * devicePixelRatio; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.w += .2;
          x.save(); x.translate(p.x, p.y); x.rotate(p.w); x.fillStyle = p.f; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
        if (dt < 2200) requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    }
    o.addEventListener("click", () => o.remove()); document.body.append(o); setTimeout(() => o.remove(), gross ? 2600 : 1800);
    if (navigator.vibrate) try { navigator.vibrate(gross ? [40, 60, 40] : 30); } catch (e) {}
  }

  // ---------------------------------------------------------------- Helfer
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eur = n => (Math.round((+n || 0) * 100) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const pad = n => String(n).padStart(2, "0");
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dDE = s => { if (!s) return ""; const d = new Date(s); return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }); };
  const tagDE = d => d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const telHref = t => "tel:" + String(t || "").replace(/[^\d+]/g, "");
  const webHref = w => (/^https?:\/\//i.test(w = String(w || "").trim()) ? w : "https://" + w);
  const webText = w => String(w || "").trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[/?#].*$/, "");
  const webLink = w => `<a class="web" href="${esc(webHref(w))}" target="_blank" rel="noopener">${esc(webText(w))} ↗</a>`;
  const WEB = { keine: ["keine Website", "accent"], veraltet: ["Website veraltet", "warn"], unklar: ["Alter unklar", ""], ok: ["Website modern", ""] };
  const istHeute = s => s && isoDate(new Date(s)) === isoDate(new Date());
  function naechsterWerktag(tage = 1, h = 9, m = 0) {
    const d = new Date(); let n = 0;
    while (n < tage) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n++; }
    d.setHours(h, m, 0, 0); return d;
  }
  const lokal = (datum, zeit) => new Date(`${datum}T${zeit || "09:00"}:00`);
  function provision(d) {
    const base = +d.setup || 0, sign = d.art === "storno" ? -1 : 1;
    if (d.vertriebler && d.vertriebler !== "INH") return { an: d.vertriebler, betrag: sign * base * SATZ_V, satz: SATZ_V };
    if (d.tippgeber) return { an: "Tipp: " + d.tippgeber, betrag: sign * base * SATZ_T, satz: SATZ_T };
    return { an: null, betrag: 0, satz: 0 };
  }
  const ICON = {
    heute: '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/>',
    leads: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
    termine: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    deals: '<path d="M5 12l4 4 10-10"/>',
    prov: '<circle cx="12" cy="12" r="8"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.9 0-3 1-3 2.2 0 3 6 1.6 6 4.6 0 1.2-1.2 2.2-3 2.2-1.4 0-2.5-.6-3.1-1.6"/>',
    cockpit: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    statistik: '<path d="M4 19V11M10 19V5M16 19v-6M22 19H2"/>',
    auftraege: '<rect x="3" y="4" width="5" height="16" rx="1.2"/><rect x="10" y="4" width="5" height="11" rx="1.2"/><rect x="17" y="4" width="4" height="14" rx="1.2"/>',
    tel: '<path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"/>',
  };

  // ---------------------------------------------------------------- Zustand
  const store = window.InfineroStore.create();
  const S = { profil: null, view: null, team: [], tab: "heute", filter: "offen", q: "", data: {}, loadingMore: false };
  const inhaber = () => S.view && S.view.rolle === "inhaber";           // Rolle der gewählten Ansicht
  const darfWechseln = () => S.profil && S.profil.rolle === "inhaber";  // nur der Inhaber kann Ansichten wechseln
  const eigeneAnsicht = () => S.view && S.profil && S.view.kuerzel === S.profil.kuerzel;
  const ANSICHT_KEY = "infinero-ansicht", THEME_KEY = "infinero-theme";
  // Sichtschutz für die Inhaber-Ansicht (kein Ersatz für den Login)
  const PW_HASH = "50a2d869";
  const fnv = s => { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const name = k => (S.team.find(t => t.kuerzel === k) || {}).name || k;

  let toastT;
  function toast(text, undo) {
    const el = $("#toast"); el.innerHTML = ""; const s = document.createElement("span"); s.textContent = text; el.append(s);
    if (undo) { const b = document.createElement("button"); b.type = "button"; b.textContent = "Rückgängig"; b.onclick = () => { el.hidden = true; undo(); }; el.append(b); }
    el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), undo ? 6000 : 2400);
  }
  function fehler(e) {
    console.error(e);
    const m = (e && (e.message || e.error_description)) || "";
    if (/duplicate key|leads_(domain|tel)_uq/.test(m)) return toast("Diesen Kontakt gibt es schon (gleiche Website oder Telefonnummer).");
    if (/row-level security|permission/.test(m)) return toast("Dafür fehlt dir die Berechtigung.");
    toast("Nicht gespeichert – bitte nochmal versuchen.");
  }

  // ---------------------------------------------------------------- Tabs
  function tabs() {
    const t = [["heute", "Heute"], ["leads", "Leads"], ["termine", "Termine"], ["auftraege", "Aufträge"], ["deals", "Provision"], ["statistik", "Statistik"]];
    if (inhaber()) t.push(["cockpit", "Cockpit"]);
    $("#tablist").innerHTML = t.map(([k, l]) => `<button class="tab" role="tab" type="button" data-tab="${k}" aria-selected="${S.tab === k}"><svg viewBox="0 0 24 24">${ICON[k === "cockpit" ? "cockpit" : k]}</svg>${l}</button>`).join("");
    $("#tabs").hidden = false;
  }
  async function zeige(tab) {
    if (tab) S.tab = tab;
    tabs();
    $("#fab").hidden = !["heute", "leads"].includes(S.tab);
    const v = $("#view");
    try {
      if (S.tab === "heute") v.innerHTML = await viewHeute();
      else if (S.tab === "leads") v.innerHTML = await viewLeads();
      else if (S.tab === "termine") v.innerHTML = await viewTermine();
      else if (S.tab === "deals") v.innerHTML = await viewDeals();
      else if (S.tab === "auftraege") v.innerHTML = await viewAuftraege();
      else if (S.tab === "statistik") { v.innerHTML = await viewStatistik(); }
      else if (S.tab === "cockpit") v.innerHTML = await viewCockpit();
    } catch (e) { fehler(e); v.innerHTML = `<div class="empty">Daten konnten nicht geladen werden. Internetverbindung prüfen und neu öffnen.</div>`; }
  }

  // ---------------------------------------------------------------- Heute
  function callCard(l, opts = {}) {
    const st = STATUS[l.status] || [l.status, ""];
    const wb = !l.website ? WEB.keine : WEB[l.website_bewertung];
    const web = wb ? `<span class="pill ${wb[1]}">${wb[0]}</span>` : "";
    const wv = l.wiedervorlage ? new Date(l.wiedervorlage) : null;
    return `<article class="card${opts.prio ? " prio" : ""}" data-card="${l.id}">
      <div class="head"><h3><button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3>${l.status !== "neu" ? `<span class="pill ${st[1]}">${st[0]}</span>` : web}</div>
      <div class="meta">${l.branche ? `<span>${esc(l.branche)}</span>` : ""}${l.ort ? `<span>${esc(l.ort)}</span>` : ""}${l.versuche ? `<span>Versuch ${l.versuche + 1}</span>` : ""}${wv ? `<span class="${wv < new Date() ? "due" : ""}">${istHeute(l.wiedervorlage) ? "heute " + hhmm(wv) : dDE(l.wiedervorlage) + " " + hhmm(wv)}</span>` : ""}${l.status !== "neu" ? web : ""}</div>
      ${l.naechster_schritt ? `<div class="meta"><span>${esc(l.naechster_schritt)}</span></div>` : ""}
      ${l.website_befund && ["veraltet", "unklar"].includes(l.website_bewertung) ? `<div class="befund">${esc(l.website_befund)}</div>` : ""}
      ${(() => { const z = (S.zg || []).find(x => x.id === l.zielgruppe); return z && z.demo_url ? `<div class="demo"><span>Demo ${esc(z.name)}:</span> <a href="${esc(z.demo_url)}" target="_blank" rel="noopener">${esc(z.demo_url.replace(/^https?:\/\//, ""))}</a> <button class="btn small" type="button" data-copy="${esc(z.demo_url)}">Link kopieren</button></div>` : ""; })()}
      ${l.telefon ? `<div class="call"><a class="tel" href="${esc(telHref(l.telefon))}"><svg viewBox="0 0 24 24">${ICON.tel}</svg>${esc(l.telefon)}</a>${l.website ? webLink(l.website) : ""}</div>` : `<div class="meta"><span class="due">Keine Telefonnummer</span>${l.website ? webLink(l.website) : ""}</div>`}
      <div class="outcomes">
        <button class="oc n" type="button" data-oc="nicht" data-id="${l.id}">Nicht erreicht</button>
        <button class="oc k" type="button" data-oc="kein" data-id="${l.id}">Kein Interesse</button>
        <button class="oc i" type="button" data-oc="info" data-id="${l.id}">Infos per Mail</button>
        <button class="oc y" type="button" data-oc="ja" data-id="${l.id}">Interesse</button>
      </div>
      <div class="sub"><button type="button" data-oc="rueckruf" data-id="${l.id}">Rückruf vereinbaren</button><button type="button" data-open="${l.id}">Details</button></div>
    </article>`;
  }
  function terminCard(t) {
    const b = new Date(t.beginn), l = t.lead || {};
    return `<article class="card prio">
      <div class="head"><h3><span class="time">${hhmm(b)}</span> · ${l.id ? `<button type="button" data-open="${l.id}">${esc(l.firma)}</button>` : "Termin"}</h3><span class="pill ok">${esc(ART[t.art] || t.art)}</span></div>
      <div class="meta"><span>mit ${esc((t.mit || []).map(name).join(" & "))}</span>${t.ort ? `<span>${esc(t.ort)}</span>` : ""}</div>
      ${t.notiz ? `<div class="meta"><span>${esc(t.notiz)}</span></div>` : ""}
      <div class="call">${l.telefon ? `<a class="tel" href="${esc(telHref(l.telefon))}"><svg viewBox="0 0 24 24">${ICON.tel}</svg>${esc(l.telefon)}</a>` : ""}
        <button class="btn small" type="button" data-terminok="${t.id}">Erledigt</button></div>
    </article>`;
  }
  async function viewHeute() {
    if (!S.data.startGeladen && eigeneAnsicht() || !S.data.startGeladen && store.mode === "demo") { S.data.startGeladen = true; try { const n = await store.tageslisteStart(); if (n) toast(`${n} neue Leads für heute zugeteilt`); } catch (e) { console.warn(e); } }
    const h = await store.heute(); S.data.heute = h;
    const ziel = S.view.tagesziel ?? 100;
    S.data.anrufeHeute = h.anrufe || 0; const heuteAnrufe = S.data.anrufeHeute;
    const fokus = (S.zg || []).find(z => z.id === (new Date().getDay() === 1 ? "handwerk" : (S.cfg || {}).fokus));
    const zielAnrufe = S.view.rolle === "inhaber" ? 0 : 100;
    return `
      <div class="spruch"><span class="lbl">Spruch des Tages</span><p>${esc(spruchDesTages())}</p></div>
      ${fokus ? `<div class="fokus"><span>${new Date().getDay() === 1 ? "Montag" : "Diese Woche"}:</span> <b>${esc(fokus.name)}</b>${fokus.anrufzeit ? `<span class="meta">${esc(fokus.anrufzeit)}</span>` : ""}</div>` : ""}
      ${zielAnrufe ? `<div class="ziel"><div class="kv"><span>Anrufe heute</span><b class="money"><span id="kpiCalls">${heuteAnrufe}</span> / ${zielAnrufe}</b></div><div class="bar"><i id="zielbar" style="width:${Math.min(100, heuteAnrufe / zielAnrufe * 100)}%"></i></div></div>` : ""}
      <div class="kpis"><div><span>Termine</span><b>${h.termine.length}</b></div><div><span>Wiedervorlagen</span><b>${h.faellig.length}</b></div><div><span>Neue Leads</span><b>${h.neue.length}</b></div><div><span>${zielAnrufe ? "Noch offen" : "Anrufe heute"}</span><b>${zielAnrufe ? Math.max(0, zielAnrufe - heuteAnrufe) : heuteAnrufe}</b></div></div>
      <h2 class="sec">Termine heute <span class="n">${h.termine.length}</span></h2>
      <div class="list">${h.termine.length ? h.termine.map(terminCard).join("") : `<div class="empty">Heute keine Termine.</div>`}</div>
      <h2 class="sec">Wiedervorlagen &amp; Rückrufe <span class="n">${h.faellig.length}</span></h2>
      <div class="list" id="listFaellig">${h.faellig.length ? h.faellig.map(l => callCard(l, { prio: true })).join("") : `<div class="empty">Nichts fällig.</div>`}</div>
      <h2 class="sec">Neue Leads <span class="n">${h.neue.length}${ziel ? " · Tagesziel " + ziel : ""}</span></h2>
      <div class="list" id="listNeu">${h.neue.length ? h.neue.map(l => callCard(l)).join("") : `<div class="empty">Keine neuen Leads mehr in deiner Liste.</div>`}</div>
      <button class="btn block more" type="button" id="more">+${schritt()} Leads laden</button>
      <p class="hint">Nicht bearbeitete Leads bleiben in deiner Liste und stehen morgen wieder hier.</p>`;
  }

  const schritt = () => (inhaber() ? 10 : 20);

  // ---------------------------------------------------------------- Anruf-Ergebnisse
  function aus(id) {
    const c = document.querySelector(`[data-card="${id}"]`); if (c) { c.classList.add("weg"); setTimeout(() => c.remove(), 220); }
    const n = S.data.anrufeHeute = (S.data.anrufeHeute || 0) + 1;
    const k = $("#kpiCalls"); if (k) k.textContent = n;
    const bar = $("#zielbar"); if (bar) bar.style.width = Math.min(100, n) + "%";
    if (S.view.rolle !== "inhaber") {
      if (n === 100) feiern("Tagesziel geschafft!", "100 Anrufe – richtig stark. Alles ab jetzt ist Bonus.");
      else if (n % 25 === 0) toast(`${n} Anrufe – weiter so!`);
    }
  }
  function findLead(id) { const h = S.data.heute || {}; return [...(h.faellig || []), ...(h.neue || []), ...(S.data.leads || [])].find(l => l.id === id) || S.data.detail; }
  async function ergebnis(id, typ, patch, text) {
    const alt = findLead(id) || {};
    const vorher = {}; Object.keys(patch).forEach(k => (vorher[k] = alt[k] ?? null));
    await store.leadUpdate(id, { ...patch, letzter_kontakt: new Date().toISOString() });
    await store.aktivitaet({ lead_id: id, typ: "anruf", ergebnis: typ, text: text || null });
    return vorher;
  }
  async function schnell(id, art) {
    const l = findLead(id); if (!l) return;
    let patch, text, label;
    if (art === "nicht") {
      const v = (l.versuche || 0) + 1;
      patch = v >= MAX_VERSUCHE ? { status: "kein_kontakt", versuche: v, wiedervorlage: null } : { status: "nicht_erreicht", versuche: v, wiedervorlage: naechsterWerktag(1, 9).toISOString() };
      label = v >= MAX_VERSUCHE ? `Nach ${v} Versuchen abgelegt` : "Nicht erreicht – morgen wieder dran";
    } else {
      patch = { status: "kein_interesse", gesperrt: true, wiedervorlage: null };
      label = "Kein Interesse – wird nicht mehr angerufen";
    }
    aus(id);
    try {
      const vorher = await ergebnis(id, art === "nicht" ? "nicht_erreicht" : "kein_interesse", patch, text);
      toast(label, async () => { try { await store.leadUpdate(id, vorher); await store.aktivitaet({ lead_id: id, typ: "notiz", text: "Ergebnis rückgängig gemacht" }); S.data.anrufeHeute--; zeige(); } catch (e) { fehler(e); } });
    } catch (e) { fehler(e); zeige(); }
  }

  function produktChips(sel = []) {
    return `<div class="chips">${INTERESSE.map(([c, n]) => `<button class="chip" type="button" data-prod="${c}" aria-pressed="${sel.includes(c)}">${n}</button>`).join("")}</div>`;
  }
  const gewaehlt = root => [...root.querySelectorAll("[data-prod][aria-pressed=true]")].map(b => b.dataset.prod);
  function sheet(title, body, back) {
    $("#sheet").innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="wrap">
      <header><button class="btn small" type="button" data-close${back ? ` data-back="${back}"` : ""}>Zurück</button><h2>${esc(title)}</h2></header>${body}</div></div>`;
    document.body.style.overflow = "hidden";
    return $("#sheet .sheet");
  }
  function schliessen(neu = true) { $("#sheet").innerHTML = ""; document.body.style.overflow = ""; if (neu) zeige(); }

  function infoMail(l, ki) {
    const v = VORLAGEN[l.zielgruppe] || VORLAGEN.handwerk;
    const z = (S.zg || []).find(x => x.id === l.zielgruppe);
    const ich = (store.mode === "live" && S.team.find(t => t.kuerzel === S.profil.kuerzel)) || S.view;
    const euro = n => n.toLocaleString("de-DE") + " €";
    const prods = (l.interesse_produkte || []).filter(c => MAILTEXT[c]);
    const produkte = (prods.length ? prods : ["WEBSITE"]).map(c => { const [t, d, e, m] = MAILTEXT[c]; return `• ${t} – ${d}\n  Einrichtung ${euro(e)}, danach ${euro(m)} im Monat`; }).join("\n\n");
    const kollege = l.owner && l.owner !== ich.kuerzel ? ` mit meinem Kollegen ${name(l.owner)}` : "";
    const link = ich.termin_link || (S.cfg && S.cfg.termin_link);
    const teile = [
      l.ansprechpartner ? `Guten Tag ${l.ansprechpartner},` : "Guten Tag,",
      `vielen Dank für ${v.gespraech}${kollege} – ${v.danach.replace("{firma}", l.firma)}`,
      ki || "",
      `${v.einleitung}\n\n${produkte}\n\n(alle Preise netto, zzgl. USt.)`,
      WARUM_MONATLICH,
      v.nutzen,
      !l.website || l.website_bewertung === "veraltet" || l.website_bewertung === "keine" ? v.web : "",
      z && z.demo_url ? `${v.demo}\n👉 ${z.demo_url}` : "",
      link ? `${v.termin}:\n👉 ${link}` : `${v.termin} – antworten Sie einfach auf diese Mail mit Ihrem Wunschtermin.`,
      v.stopp,
      ["Mit besten Grüßen", ich.name, ...SIGNATUR, [ich.telefon ? "Tel.: " + ich.telefon : "", "kontakt@infinero.de", "infinero.de"].filter(Boolean).join(" · ")].join("\n"),
    ];
    return { an: l.email || "", betreff: v.betreff, text: teile.filter(Boolean).join("\n\n") };
  }
  const mailtoVon = (an, betreff, text) => `mailto:${encodeURIComponent(an)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;

  // Vorschau: Vorlage + persönlicher Absatz von Claude, vor dem Öffnen noch änderbar
  async function infoMailSheet(id) {
    let l; try { l = await store.lead(id); } catch (e) { return fehler(e); }
    const root = sheet("Info-Mail · " + l.firma, `
      <form id="imf" class="form">
        <div class="field full"><label for="im_an">An</label><input id="im_an" type="email" value="${esc(l.email)}"></div>
        <div class="field full"><label for="im_b">Betreff</label><input id="im_b"></div>
        <div class="field full"><label for="im_t">Text</label><textarea id="im_t" rows="18"></textarea></div>
        <p class="hint full" id="im_ki">✨ Claude schreibt den persönlichen Absatz …</p>
        <div class="full actions" id="im_direkt" hidden><button class="btn primary" type="button" id="im_send">Direkt senden</button></div>
        <p class="hint full" id="im_direkt_hint" hidden>Geht sofort von <b>kontakt@infinero.de</b> raus – Antworten und eine Kopie landen im Postfach kontakt@.</p>
        <div class="full actions"><a class="btn" id="im_open" href="#">In Mail-App öffnen</a><button class="btn" type="button" data-mailok="${l.id}">Als gesendet markieren</button></div>
        <p class="hint full" id="im_app_hint">Mail-App: Absender <b>kontakt@infinero.de</b> wählen. Nach dem Senden „Als gesendet markieren“.</p>
      </form>`);
    const q = s => root.querySelector(s);
    const setzen = ki => { const d = infoMail(l, ki); q("#im_b").value = d.betreff; q("#im_t").value = d.text; aktualisieren(); };
    const aktualisieren = () => { q("#im_open").href = mailtoVon(q("#im_an").value.trim(), q("#im_b").value, q("#im_t").value); };
    ["#im_an", "#im_b", "#im_t"].forEach(s => q(s).addEventListener("input", aktualisieren));
    setzen("");
    store.mailBereit().then(ok => { if (ok) { q("#im_direkt").hidden = false; q("#im_direkt_hint").hidden = false; q("#im_open").classList.remove("primary"); } else q("#im_open").classList.add("primary"); });
    q("#im_send").addEventListener("click", async e => {
      const an = q("#im_an").value.trim(), b = e.currentTarget;
      if (!an) return toast("Bitte Empfänger eintragen");
      if (!confirm(`Info-Mail jetzt an ${an} senden?`)) return;
      b.disabled = true; b.textContent = "Wird gesendet …";
      try { await store.mailSenden({ lead_id: l.id, an, betreff: q("#im_b").value, text: q("#im_t").value }); toast("Info-Mail gesendet ✓"); schliessen(); }
      catch (err) { b.disabled = false; b.textContent = "Direkt senden"; toast("Nicht gesendet: " + err.message); }
    });
    try {
      const r = await Promise.race([store.kiAbsatz(l.id), new Promise((_, x) => setTimeout(() => x(new Error("Zeitüberschreitung")), 25000))]);
      if (r.absatz) { setzen(r.absatz); q("#im_ki").textContent = "✨ Persönlicher Absatz von Claude eingefügt (2. Absatz) – bei Bedarf einfach anpassen."; }
      else q("#im_ki").textContent = "Ohne persönlichen Absatz (" + (r.grund || "keine Antwort") + ") – die Vorlage ist vollständig.";
    } catch (e) { q("#im_ki").textContent = "Claude gerade nicht erreichbar – die Vorlage ist vollständig und kann so raus."; }
  }

  // Online-Auftrag: Link zur Auftragsseite (Angebot → Zustimmung → Zahlung über Stripe)
  const auftragLink = a => new URL("auftrag.html?t=" + encodeURIComponent(a.token || ""), location.href).href;
  function auftragMail(a) {
    const l = a.lead || {};
    const ich = (store.mode === "live" && S.team.find(t => t.kuerzel === S.profil.kuerzel)) || S.view;
    const p = (PRODUKTE.find(x => x.code === a.produkt) || {}).name || a.produkt;
    const text = [
      l.ansprechpartner ? `Guten Tag ${l.ansprechpartner},` : "Guten Tag,",
      "vielen Dank für Ihre Zusage – wir freuen uns sehr auf die Zusammenarbeit!",
      `Unter folgendem Link finden Sie Ihr Angebot (${p}) mit allen Konditionen. Dort können Sie den Auftrag mit wenigen Klicks erteilen und Ihre Zahlungsart hinterlegen (SEPA-Lastschrift oder Karte):\n👉 ${auftragLink(a)}`,
      "Sobald der Auftrag da ist, melden wir uns für ein kurzes Onboarding-Gespräch, in dem wir alles für Ihre Website besprechen.",
      "Bei Fragen erreichen Sie mich jederzeit.",
      ["Mit besten Grüßen", ich.name, ...SIGNATUR, [ich.telefon ? "Tel.: " + ich.telefon : "", "kontakt@infinero.de", "infinero.de"].filter(Boolean).join(" · ")].join("\n"),
    ].join("\n\n");
    return { an: l.email || "", betreff: `Ihr Auftrag bei INFINERO – ${l.firma || p}`, text };
  }
  function auftragMailSheet(a) {
    const l = a.lead || {}, m = auftragMail(a), link = auftragLink(a);
    const root = sheet("Online-Auftrag · " + (l.firma || ""), `
      <form class="form">
        <div class="field full"><label for="am_an">An</label><input id="am_an" type="email" value="${esc(m.an)}"></div>
        <div class="field full"><label for="am_b">Betreff</label><input id="am_b" value="${esc(m.betreff)}"></div>
        <div class="field full"><label for="am_t">Text</label><textarea id="am_t" rows="14">${esc(m.text)}</textarea></div>
        <div class="full actions" id="am_direkt" hidden><button class="btn primary" type="button" id="am_send">Direkt senden</button></div>
        <div class="full actions"><a class="btn" id="am_open" href="#">In Mail-App öffnen</a><button class="btn" type="button" id="am_copy">Nur Link kopieren</button></div>
        <p class="hint full">Der Kunde sieht Angebot und Konditionen, stimmt zu und hinterlegt die Zahlung bei Stripe. Danach steht der Auftrag hier automatisch auf „Beauftragt“ – mit Abschluss und Provision.</p>
      </form>`);
    const q = x => root.querySelector(x);
    const aktualisieren = () => { q("#am_open").href = mailtoVon(q("#am_an").value.trim(), q("#am_b").value, q("#am_t").value); };
    ["#am_an", "#am_b", "#am_t"].forEach(x => q(x).addEventListener("input", aktualisieren)); aktualisieren();
    const verschickt = async () => { if (a.stufe === "zusage") { await store.auftragUpdate(a.id, { stufe: "auftrag_raus", gesendet_am: new Date().toISOString() }); a.stufe = "auftrag_raus"; } };
    store.mailBereit().then(ok => { if (ok) { q("#am_direkt").hidden = false; } else q("#am_open").classList.add("primary"); });
    q("#am_send").addEventListener("click", async e => {
      const an = q("#am_an").value.trim(), b = e.currentTarget;
      if (!an) return toast("Bitte Empfänger eintragen");
      if (!confirm(`Online-Auftrag jetzt an ${an} senden?`)) return;
      b.disabled = true; b.textContent = "Wird gesendet …";
      try { await store.mailSenden({ lead_id: a.lead_id, an, betreff: q("#am_b").value, text: q("#am_t").value, art: "auftrag" }); await verschickt(); toast("Online-Auftrag gesendet ✓"); schliessen(false); zeige("auftraege"); }
      catch (err) { b.disabled = false; b.textContent = "Direkt senden"; toast("Nicht gesendet: " + err.message); }
    });
    q("#am_open").addEventListener("click", () => { verschickt().catch(() => {}); });
    q("#am_copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(link); toast("Link kopiert – z. B. per WhatsApp schicken"); } catch (err) { prompt("Link kopieren:", link); }
      verschickt().catch(() => {});
    });
  }

  function infoSheet(id) {
    const l = findLead(id);
    const root = sheet("Infos per Mail · " + l.firma, `
      <form id="f" class="form">
        <div class="field full"><label for="i_mail">E-Mail-Adresse</label><input id="i_mail" type="email" inputmode="email" autocomplete="off" value="${esc(l.email)}" required></div>
        <div class="field"><label for="i_ap">Ansprechpartner</label><input id="i_ap" placeholder="z. B. Herr Müller" value="${esc(l.ansprechpartner)}"></div>
        <div class="field"><label for="i_wv">Nachfassen am</label><input id="i_wv" type="date" value="${isoDate(naechsterWerktag(3))}"></div>
        <div class="full"><div class="lbl">Interessiert an</div>${produktChips(l.interesse_produkte || [])}</div>
        <label class="check full"><input id="i_ok" type="checkbox" required><span>Der Kontakt hat zugestimmt, dass wir ihm Infos per E-Mail schicken.</span></label>
        <div class="field full"><label for="i_n">Notiz</label><input id="i_n" placeholder="z. B. will Preise für Website + Chatbot"></div>
        <div class="full"><button class="btn primary block" type="submit">Speichern</button></div>
      </form><p class="hint">Danach im Lead auf „Info-Mail öffnen“ tippen – die fertige Mail (Vorlage der Zielgruppe mit Produkten, Preisen und Demo-Link) öffnet sich in der Mail-App. Als Absender immer <b>kontakt@infinero.de</b> wählen. Offene Mails sieht Ziu auch im Cockpit.</p>`);
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const f = root; const prods = gewaehlt(f);
      const patch = { status: "info_angefragt", email: f.querySelector("#i_mail").value.trim(), ansprechpartner: f.querySelector("#i_ap").value.trim() || null,
        einwilligung_email: new Date().toISOString(), info_mail: "offen", interesse_produkte: prods,
        wiedervorlage: lokal(f.querySelector("#i_wv").value, "10:00").toISOString(), naechster_schritt: "Nachfassen nach Info-Mail" };
      try { aus(id); await ergebnis(id, "info", patch, f.querySelector("#i_n").value.trim()); schliessen(); toast("Info-Anfrage gespeichert"); } catch (err) { fehler(err); }
    });
  }

  // Demo-Kurzfassung (Fragenkatalog A): 6 Felder, damit Ziu die Demo ohne Rückfrage bauen kann
  const STILE = ["modern", "klassisch", "edel", "verspielt", "rustikal", "minimalistisch"];
  const BILDER = [["alt", "Bilder von alter Website/Instagram nehmen"], ["kunde", "Kunde schickt Fotos"], ["stock", "Stockfotos sind ok"]];
  function demoFelder(di = {}, l = {}) {
    return `<div class="field full"><label for="dm_leist">Was bieten sie an? (3–5 wichtigste Leistungen)</label><textarea id="dm_leist" rows="3">${esc(di.leistungen)}</textarea></div>
      <div class="field full"><label for="dm_bes">Was unterscheidet sie? (Meisterbetrieb, seit …, Notdienst …)</label><input id="dm_bes" value="${esc(di.besonders)}"></div>
      <div class="field"><label for="dm_stil">Stil</label><select id="dm_stil"><option value="">–</option>${STILE.map(x => `<option${di.stil === x ? " selected" : ""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="dm_farben">Farben (Logo, Fahrzeuge, Wunsch)</label><input id="dm_farben" value="${esc(di.farben)}"></div>
      <div class="field full"><label for="dm_vorlage">Vorlage: alte Website / Instagram / Google-Profil</label><input id="dm_vorlage" value="${esc(di.vorlage || l.website || "")}"></div>
      <div class="field"><label for="dm_bilder">Bilder</label><select id="dm_bilder">${BILDER.map(([k, t]) => `<option value="${k}"${di.bilder === k ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label for="dm_bis">Demo fertig bis</label><input id="dm_bis" type="date" value="${esc(di.bis || "")}"></div>`;
  }
  function demoLesen(root) {
    const v = s => (root.querySelector(s) || {}).value?.trim() || null;
    return { leistungen: v("#dm_leist"), besonders: v("#dm_bes"), stil: v("#dm_stil"), farben: v("#dm_farben"), vorlage: v("#dm_vorlage"), bilder: v("#dm_bilder"), bis: v("#dm_bis") };
  }
  function demoText(di) {
    if (!di) return "";
    const b = (BILDER.find(x => x[0] === di.bilder) || [])[1];
    return [di.leistungen && `Leistungen: ${di.leistungen}`, di.besonders && `Besonders: ${di.besonders}`, (di.stil || di.farben) && `Stil/Farben: ${[di.stil, di.farben].filter(Boolean).join(", ")}`,
      di.vorlage && `Vorlage: ${di.vorlage}`, b && `Bilder: ${b}`, di.bis && `Fertig bis ${dDE(di.bis)}`].filter(Boolean).map(x => `<div>${esc(x)}</div>`).join("");
  }
  async function demoSheet(id) {
    let l; try { l = await store.lead(id); } catch (e) { return fehler(e); }
    const root = sheet("Demo-Infos · " + l.firma, `<form id="f" class="form">${demoFelder(l.demo_infos || {}, l)}<div class="full"><button class="btn primary block" type="submit">Speichern</button></div></form>`, id);
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault();
      try { await store.leadUpdate(id, { demo_infos: demoLesen(root), demo_website: l.demo_website || "offen" }); toast("Demo-Infos gespeichert"); detail(id); } catch (err) { fehler(err); }
    });
  }

  function interesseSheet(id, modus = "termin") {
    const l = findLead(id);
    const team = S.team.map(t => `<button class="chip" type="button" data-mit="${t.kuerzel}" aria-pressed="${t.kuerzel === S.view.kuerzel}">${esc(t.name)}</button>`).join("");
    const root = sheet((modus === "rueckruf" ? "Rückruf · " : "Interesse · ") + l.firma, `
      <div class="seg" role="group" aria-label="Was wurde vereinbart?">
        <button type="button" data-mode="termin" aria-pressed="${modus === "termin"}">Termin</button>
        <button type="button" data-mode="rueckruf" aria-pressed="${modus === "rueckruf"}">Rückruf</button>
        <button type="button" data-mode="nur" aria-pressed="${modus === "nur"}">Nur Interesse</button>
      </div>
      <form id="f" class="form" style="margin-top:12px">
        <div class="field when"><label for="t_d">Datum</label><input id="t_d" type="date" value="${isoDate(naechsterWerktag(1))}"></div>
        <div class="field when"><label for="t_t">Uhrzeit</label><input id="t_t" type="time" value="10:00" step="900"></div>
        <div class="field full m-termin"><div class="lbl">Termin mit</div><div class="chips">${team}</div></div>
        <div class="field m-termin"><label for="t_art">Art</label><select id="t_art"><option value="vor_ort">Vor Ort</option><option value="telefon">Telefon</option><option value="video">Video</option></select></div>
        <div class="field m-termin"><label for="t_dauer">Dauer</label><select id="t_dauer"><option>30</option><option selected>45</option><option>60</option><option>90</option></select></div>
        <div class="field full m-termin"><label for="t_ort">Ort</label><input id="t_ort" value="${esc([l.strasse, [l.plz, l.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "))}"></div>
        <div class="field"><label for="t_ap">Ansprechpartner</label><input id="t_ap" value="${esc(l.ansprechpartner)}"></div>
        <div class="field"><label for="t_mail">E-Mail (falls genannt)</label><input id="t_mail" type="email" value="${esc(l.email)}"></div>
        <div class="full"><div class="lbl">Interessiert an</div>${produktChips(l.interesse_produkte || [])}</div>
        <label class="check full"><input id="t_demo" type="checkbox"${l.demo_website ? " checked" : ""}><span>Individuelle Demo-Website gewünscht (Ziu baut sie vor dem Termin)</span></label>
        <div class="full demoinfos form" id="t_demoinfos"${l.demo_website ? "" : " hidden"}><p class="hint full" style="margin:0">Kurz abfragen – damit Ziu die Demo ohne Rückfrage bauen kann:</p>${demoFelder(l.demo_infos || {}, l)}</div>
        <div class="field full"><label for="t_n">Notiz</label><input id="t_n" placeholder="z. B. Inhaber will Angebot für Stufe 2"></div>
        <div class="full"><button class="btn primary block" type="submit">Speichern</button></div>
      </form>`);
    let mode = modus;
    const upd = () => {
      root.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      root.querySelectorAll(".m-termin").forEach(x => (x.hidden = mode !== "termin"));
      root.querySelectorAll(".when").forEach(x => (x.hidden = mode === "nur"));
    };
    upd();
    root.addEventListener("click", e => { const b = e.target.closest("[data-mode]"); if (b) { mode = b.dataset.mode; upd(); } });
    root.querySelector("#t_demo").addEventListener("change", e => { root.querySelector("#t_demoinfos").hidden = !e.target.checked; });
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const q = s => root.querySelector(s);
      const wann = lokal(q("#t_d").value, q("#t_t").value);
      const mit = [...root.querySelectorAll("[data-mit][aria-pressed=true]")].map(b => b.dataset.mit);
      if (mode === "termin" && !mit.length) return toast("Bitte auswählen, wer zum Termin geht.");
      const patch = { ansprechpartner: q("#t_ap").value.trim() || null, email: q("#t_mail").value.trim() || null, interesse_produkte: gewaehlt(root) };
      if (q("#t_demo").checked) { if (!l.demo_website) patch.demo_website = "offen"; patch.demo_infos = demoLesen(root); }
      const notiz = q("#t_n").value.trim();
      if (mode === "termin") Object.assign(patch, { status: "termin", wiedervorlage: wann.toISOString(), naechster_schritt: `Termin ${dDE(wann)} ${hhmm(wann)}` });
      else if (mode === "rueckruf") Object.assign(patch, { status: "rueckruf", wiedervorlage: wann.toISOString(), naechster_schritt: `Rückruf ${dDE(wann)} ${hhmm(wann)}` });
      else Object.assign(patch, { status: "interesse", wiedervorlage: naechsterWerktag(2, 10).toISOString(), naechster_schritt: notiz || "Interesse – nachfassen" });
      try {
        aus(id);
        await ergebnis(id, mode === "nur" ? "interesse" : mode, patch, notiz);
        if (mode === "termin") {
          const t = await store.terminAnlegen({ lead_id: id, beginn: wann.toISOString(), dauer_min: +q("#t_dauer").value, art: q("#t_art").value, mit, ort: q("#t_ort").value.trim() || null, notiz: notiz || null });
          terminGespeichert({ ...t, lead: { ...l, ...patch } });
          feiern("Termin!", `${l.firma} · ${tagDE(wann)}, ${hhmm(wann)} Uhr`, false);
        } else { schliessen(); toast(mode === "rueckruf" ? "Rückruf eingeplant" : "Interesse gespeichert"); }
      } catch (err) { fehler(err); }
    });
  }

  // ---------------------------------------------------------------- Kalender
  const icsDate = d => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  function terminText(t) {
    const l = t.lead || {};
    return { titel: `Termin ${l.firma || ""} (${(t.mit || []).map(name).join(" & ")})`,
      details: [ART[t.art] || t.art, l.telefon ? "Tel. " + l.telefon : "", t.notiz || "", "INFINERO Vertrieb"].filter(Boolean).join("\n"),
      ort: t.ort || [l.strasse, l.plz, l.ort].filter(Boolean).join(" ") };
  }
  function googleLink(t) {
    const x = terminText(t), b = new Date(t.beginn), e = new Date(b.getTime() + (t.dauer_min || 30) * 60000);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(x.titel)}&dates=${icsDate(b)}/${icsDate(e)}&details=${encodeURIComponent(x.details)}&location=${encodeURIComponent(x.ort)}`;
  }
  function icsLink(t) {
    const x = terminText(t), b = new Date(t.beginn), e = new Date(b.getTime() + (t.dauer_min || 30) * 60000);
    const f = s => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, m => "\\" + m);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//INFINERO//Vertrieb//DE", "BEGIN:VEVENT", `UID:termin-${t.id}@infinero`, `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(b)}`, `DTEND:${icsDate(e)}`, `SUMMARY:${f(x.titel)}`, `DESCRIPTION:${f(x.details)}`, `LOCATION:${f(x.ort)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  }
  function kalenderButtons(t) {
    return `<a class="btn small primary" href="${icsLink(t)}" download="termin-${t.id}.ics">In Apple Kalender</a><a class="btn small" href="${esc(googleLink(t))}" target="_blank" rel="noopener">Google</a>`;
  }
  function terminGespeichert(t) {
    const root = sheet("Termin gespeichert", `<div class="block">
      <div class="kv"><span>${esc(tagDE(new Date(t.beginn)))}, ${hhmm(new Date(t.beginn))} Uhr</span><span class="pill ok">${esc(ART[t.art])}</span></div>
      <div class="kv"><span>mit ${esc(t.mit.map(name).join(" & "))}</span></div>
      <div class="actions">${kalenderButtons(t)}</div>
      <p class="hint">„In Apple Kalender“ öffnet den Termin im Kalender des iPhones – dort auf „Hinzufügen“ tippen.</p></div>
      <div class="actions"><button class="btn primary" type="button" data-close>Fertig</button></div>`);
    return root;
  }

  // ---------------------------------------------------------------- Leads
  async function viewLeads() {
    const f = [["offen", "In Arbeit"], ["mein", "Meine"], ["info", "Infos angefragt"], ["interesse", "Interesse/Termin"], ["kunden", "Kunden"], ["zu", "Abgelehnt"], ["alle", "Alle"]];
    if (inhaber()) f.push(["pool", "Pool"]);
    const rows = await store.leads({ q: S.q, filter: S.filter, nurEigene: !inhaber() }); S.data.leads = rows;
    return `<div class="search"><input id="q" type="search" placeholder="Firma, Ort, Branche, Telefon …" value="${esc(S.q)}" aria-label="Leads durchsuchen"></div>
      <div class="chips scroll">${f.map(([k, t]) => `<button class="chip" type="button" data-filter="${k}" aria-pressed="${S.filter === k}">${t}</button>`).join("")}</div>
      <div class="list" style="margin-top:8px">${rows.length ? rows.map(leadRow).join("") : `<div class="empty">Keine Leads in dieser Ansicht.</div>`}</div>
      ${rows.length >= 300 ? `<p class="hint">Es werden die 300 zuletzt geänderten angezeigt – Suche nutzen.</p>` : ""}`;
  }
  function leadRow(l) {
    const st = STATUS[l.status] || [l.status, ""];
    return `<article class="card"><div class="head"><h3><button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3><span class="pill ${l.gesperrt && l.status !== "kein_interesse" ? "bad" : st[1]}">${l.gesperrt && l.status !== "kein_interesse" ? "Gesperrt" : st[0]}</span></div>
      <div class="meta">${[l.branche, l.ort, l.owner ? name(l.owner) : "Pool", l.wiedervorlage ? "WV " + dDE(l.wiedervorlage) : "", l.demo_website ? "Demo: " + l.demo_website.replace("_", " ") : ""].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}</div></article>`;
  }

  async function detail(id) {
    let l; try { l = await store.lead(id); } catch (e) { return fehler(e); }
    S.data.detail = l;
    const st = STATUS[l.status] || [l.status, ""];
    const felder = [["firma", "Firma"], ["ansprechpartner", "Ansprechpartner"], ["telefon", "Telefon"], ["email", "E-Mail"], ["website", "Website"], ["branche", "Branche"], ["strasse", "Straße"], ["plz", "PLZ"], ["ort", "Ort"], ["naechster_schritt", "Nächster Schritt"]];
    const root = sheet(l.firma, `
      <div class="block">
        <div class="kv"><span class="pill ${st[1]}">${st[0]}</span><span class="meta">${esc(l.lead_nr || "")} · ${esc(l.owner ? name(l.owner) : "Pool")}${l.versuche ? " · " + l.versuche + " Versuche" : ""}</span></div>
        ${l.telefon ? `<div class="call"><a class="tel" href="${esc(telHref(l.telefon))}"><svg viewBox="0 0 24 24">${ICON.tel}</svg>${esc(l.telefon)}</a></div>` : ""}
        ${l.website ? `<div class="kv">${webLink(l.website)}${WEB[l.website_bewertung] ? `<span class="pill ${WEB[l.website_bewertung][1]}">${WEB[l.website_bewertung][0]}</span>` : ""}</div>${l.website_befund ? `<div class="befund">${esc(l.website_befund)}</div>` : ""}` : ""}
        ${l.email ? `<div class="kv"><span class="v">${esc(l.email)}</span>${l.einwilligung_email ? `<span class="pill ok">Einwilligung ${dDE(l.einwilligung_email)}</span>` : ""}</div>` : ""}
        ${l.email && l.info_mail === "offen" ? `<div class="actions"><button class="btn small primary" type="button" data-infomail="${l.id}">Info-Mail öffnen</button><button class="btn small" type="button" data-mailok="${l.id}">Als gesendet markieren</button></div>` : ""}
        ${l.interesse_produkte && l.interesse_produkte.length ? `<div class="meta"><span>Interesse: ${esc(l.interesse_produkte.join(", "))}</span></div>` : ""}
        ${l.demo_website ? `<div class="demobox"><div class="kv"><b>Demo-Website: ${esc(l.demo_website.replace("_", " "))}</b><button class="btn small" type="button" data-demoinfo="${l.id}">${l.demo_infos ? "Infos bearbeiten" : "Infos erfassen"}</button></div>${demoText(l.demo_infos) || `<div class="due">Noch keine Infos für die Demo erfasst.</div>`}</div>` : ""}
        ${l.gesperrt ? `<div class="due">Keine Werbung – nicht mehr kontaktieren.</div>` : ""}
      </div>
      ${!l.gesperrt && !["gewonnen"].includes(l.status) ? `<div class="outcomes" style="margin-top:10px">
        <button class="oc n" type="button" data-oc="nicht" data-id="${l.id}">Nicht erreicht</button>
        <button class="oc k" type="button" data-oc="kein" data-id="${l.id}">Kein Interesse</button>
        <button class="oc i" type="button" data-oc="info" data-id="${l.id}">Infos per Mail</button>
        <button class="oc y" type="button" data-oc="ja" data-id="${l.id}">Interesse</button></div>` : ""}
      <div class="actions">${(() => { const offen = (l._auftraege || []).find(a => ["zusage", "auftrag_raus"].includes(a.stufe));
          return offen ? `<button class="btn primary" type="button" data-auftrag="${offen.id}">Auftrag ansehen</button>` : `<button class="btn primary" type="button" data-zusage="${l.id}">${l._deals.length ? "Neue Zusage (Folgeauftrag)" : "Zusage"}</button>`; })()}
        <button class="btn" type="button" data-deal="${l.id}">Unterschrieben – Abschluss melden</button>
        ${l.status === "termin" || l.status === "interesse" || l.status === "info_angefragt" ? `<button class="btn" type="button" data-setstatus="angebot" data-id="${l.id}">Angebot verschickt</button>` : ""}
        ${!l.gesperrt ? `<button class="btn danger" type="button" data-sperren="${l.id}">Keine Werbung</button>` : ""}</div>
      ${l._termine.length ? `<h2 class="sec">Termine</h2><div class="list">${l._termine.map(t => `<div class="block"><div class="kv"><span>${esc(tagDE(new Date(t.beginn)))}, ${hhmm(new Date(t.beginn))}</span><span class="pill ${t.status === "geplant" ? "ok" : ""}">${esc(t.status)}</span></div><div class="meta"><span>mit ${esc(t.mit.map(name).join(" & "))}</span><span>${esc(ART[t.art])}</span></div>${t.status === "geplant" ? `<div class="actions">${kalenderButtons({ ...t, lead: l })}</div>` : ""}</div>`).join("")}</div>` : ""}
      ${(l._auftraege || []).length ? `<h2 class="sec">Aufträge</h2><div class="list">${l._auftraege.map(a => auftragCard({ ...a, lead: l })).join("")}</div>` : ""}
      ${l._deals.length ? `<h2 class="sec">Abschlüsse</h2><div class="list">${l._deals.map(dealCard).join("")}</div>` : ""}
      <h2 class="sec">Daten</h2>
      <form id="f" class="form">
        ${felder.map(([k, t]) => `<div class="field${k === "firma" || k === "naechster_schritt" ? " full" : ""}"><label for="d_${k}">${t}</label><input id="d_${k}" name="${k}" value="${esc(l[k])}"></div>`).join("")}
        <div class="field"><label for="d_wv">Wiedervorlage</label><input id="d_wv" name="wv" type="datetime-local" value="${l.wiedervorlage ? isoDate(new Date(l.wiedervorlage)) + "T" + hhmm(new Date(l.wiedervorlage)) : ""}"></div>
        ${inhaber() ? `<div class="field"><label for="d_owner">Betreut von</label><select id="d_owner" name="owner"><option value="">Pool</option>${S.team.map(t => `<option value="${t.kuerzel}"${l.owner === t.kuerzel ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>` : ""}
        ${inhaber() && l.demo_website ? `<div class="field"><label for="d_demo">Demo-Website</label><select id="d_demo" name="demo"><option value="offen"${l.demo_website === "offen" ? " selected" : ""}>offen</option><option value="in_arbeit"${l.demo_website === "in_arbeit" ? " selected" : ""}>in Arbeit</option><option value="fertig"${l.demo_website === "fertig" ? " selected" : ""}>fertig</option></select></div>` : ""}
        <div class="field full"><label for="d_notiz">Neue Notiz</label><textarea id="d_notiz" name="notiz"></textarea></div>
        <div class="full"><button class="btn primary block" type="submit">Speichern</button></div>
      </form>
      ${l._akt.length ? `<h2 class="sec">Verlauf</h2><div class="log">${l._akt.map(a => `<div><time>${dDE(a.zeit)} ${hhmm(new Date(a.zeit))}</time>${esc(name(a.von))}: ${esc([a.ergebnis ? (STATUS[a.ergebnis] || [a.ergebnis])[0] : a.typ, a.text].filter(Boolean).join(" – "))}</div>`).join("")}</div>` : ""}
      ${inhaber() ? `<div class="actions" id="delwrap"><button class="btn danger small" type="button" data-askdel="${l.id}">Lead löschen</button></div>` : ""}`);
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.target), patch = {};
      felder.forEach(([k]) => (patch[k] = (fd.get(k) || "").toString().trim() || null));
      if (!patch.firma) return toast("Firmenname fehlt.");
      if (patch.website) patch.website = patch.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
      const wv = fd.get("wv"); patch.wiedervorlage = wv ? new Date(wv).toISOString() : null;
      if (inhaber() && fd.has("owner")) patch.owner = fd.get("owner") || null;
      if (fd.has("demo")) patch.demo_website = fd.get("demo");
      try {
        await store.leadUpdate(l.id, patch);
        const n = (fd.get("notiz") || "").toString().trim(); if (n) await store.aktivitaet({ lead_id: l.id, typ: "notiz", text: n });
        toast("Gespeichert"); detail(l.id);
      } catch (err) { fehler(err); }
    });
  }

  function neuerLead() {
    const root = sheet("Neuer Lead", `<form id="f" class="form">
      ${[["firma", "Firma *"], ["telefon", "Telefon"], ["branche", "Branche"], ["ort", "Ort"], ["ansprechpartner", "Ansprechpartner"], ["email", "E-Mail"], ["website", "Website"], ["plz", "PLZ"]].map(([k, t]) => `<div class="field${k === "firma" ? " full" : ""}"><label for="n_${k}">${t}</label><input id="n_${k}" name="${k}"${k === "firma" ? " required" : ""}></div>`).join("")}
      <div class="field"><label for="n_q">Quelle</label><select id="n_q" name="quelle"><option>Eigenrecherche</option><option>Empfehlung</option><option>Laufkundschaft</option><option>Messe</option><option>Sonstiges</option></select></div>
      <div class="field full"><label for="n_n">Notiz</label><input id="n_n" name="notiz"></div>
      <div class="full"><button class="btn primary block" type="submit">Lead anlegen</button></div></form>
      <p class="hint">Der Lead landet in deiner Liste unter „Heute → Neue Leads“.</p>`);
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault(); const fd = new FormData(e.target), d = {};
      for (const [k, v] of fd.entries()) d[k] = v.toString().trim() || null;
      if (d.website) d.website = d.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
      d.owner = S.view.kuerzel; d.zugeteilt_am = new Date().toISOString(); d.prio = d.website ? 0 : 10; d.website_bewertung = d.website ? null : "keine";
      try { await store.leadAnlegen(d); schliessen(); toast("Lead angelegt"); } catch (err) { fehler(err); }
    });
  }

  // ---------------------------------------------------------------- Termine
  async function viewTermine() {
    const von = new Date(); von.setHours(0, 0, 0, 0); const bis = new Date(von); bis.setDate(bis.getDate() + 21);
    const ts = (await store.termine(von, bis)).filter(t => inhaber() || (t.mit || []).includes(S.view.kuerzel));
    const byDay = {}; ts.forEach(t => (byDay[isoDate(new Date(t.beginn))] ||= []).push(t));
    return `<h2 class="sec">Termine (nächste 3 Wochen)</h2>
      ${Object.keys(byDay).length ? Object.entries(byDay).map(([d, list]) => `<div class="day">${esc(tagDE(new Date(d + "T12:00")))}</div><div class="list">${list.map(t => {
        const l = t.lead || {};
        return `<article class="card"><div class="head"><h3><span class="time">${hhmm(new Date(t.beginn))}</span> · ${l.id ? `<button type="button" data-open="${l.id}">${esc(l.firma)}</button>` : "Termin"}</h3><span class="pill ${t.status === "erledigt" ? "" : "ok"}">${t.status === "erledigt" ? "erledigt" : esc(ART[t.art])}</span></div>
          <div class="meta"><span>mit ${esc(t.mit.map(name).join(" & "))}</span>${t.ort ? `<span>${esc(t.ort)}</span>` : ""}${t.notiz ? `<span>${esc(t.notiz)}</span>` : ""}</div>
          ${t.status === "geplant" ? `<div class="actions">${kalenderButtons(t)}<button class="btn small" type="button" data-terminok="${t.id}">Erledigt</button><button class="btn small danger" type="button" data-terminab="${t.id}">Abgesagt</button></div>` : ""}</article>`;
      }).join("")}</div>`).join("") : `<div class="empty">Keine Termine in den nächsten drei Wochen.</div>`}
`;
  }

  // ---------------------------------------------------------------- Abschlüsse & Provision
  const dealStatus = d => (d.provision_ausgezahlt ? ["Provision ausgezahlt", ""] : d.zahlung_eingegangen ? ["Bezahlt · Provision fällig", "ok"] : ["Zahlung offen", "warn"]);
  function dealCard(d) {
    const st = dealStatus(d), p = provision(d);
    return `<article class="card"><div class="head"><h3>${esc(d.kunde_firma)}</h3><span class="pill ${st[1]}">${st[0]}</span></div>
      <div class="meta"><span>${esc(d.produkt)}</span><span>${d.art === "folge" ? "Folgeauftrag" : d.art === "storno" ? "Storno" : "Neukunde"}</span><span>${dDE(d.datum)}</span>${d.beleg_id ? `<span>${esc(d.beleg_id)}</span>` : ""}</div>
      <div class="meta"><span>Setup <b class="money">${eur(d.setup)}</b></span><span>mtl. <span class="money">${eur(d.monatlich)}</span></span><span>${p.an ? `Provision ${esc(name(p.an))}: <b class="money">${eur(p.betrag)}</b>` : "keine Provision"}</span></div>
      ${inhaber() ? `<div class="actions">${!d.zahlung_eingegangen ? `<button class="btn small" type="button" data-pay="${d.id}">Zahlung eingegangen</button>` : ""}${d.zahlung_eingegangen && !d.provision_ausgezahlt && p.betrag ? `<button class="btn small" type="button" data-payout="${d.id}">Provision ausgezahlt</button>` : ""}</div>` : ""}</article>`;
  }
  async function viewDeals() {
    const ds = (await store.deals()).filter(d => inhaber() || d.vertriebler === S.view.kuerzel); S.data.deals = ds;
    return `${inhaber() ? "" : `<h2 class="sec">Meine Provision</h2>${provHTML(ds)}`}<h2 class="sec">Abschlüsse</h2><p class="hint">Abschlüsse meldest du im Lead über „Abschluss melden“. Erst wenn Ziu den Zahlungseingang bestätigt, wird die Provision fällig.</p>
      <div class="list" style="margin-top:10px">${ds.length ? ds.map(dealCard).join("") : `<div class="empty">Noch keine Abschlüsse gemeldet.</div>`}</div>`;
  }
  function provHTML(ds) {
    const mine = ds.filter(d => provision(d).betrag);
    const sum = f => mine.filter(f).reduce((a, d) => a + provision(d).betrag, 0);
    const groups = {};
    mine.filter(d => d.zahlung_eingegangen).forEach(d => { const p = provision(d), k = d.zahlung_eingegangen.slice(0, 7) + "|" + p.an; (groups[k] ||= { m: d.zahlung_eingegangen.slice(0, 7), an: p.an, items: [] }).items.push(d); });
    const monat = m => new Date(m + "-15").toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    return `<div class="sum"><div class="hi"><span>Fällig, noch nicht ausgezahlt</span><b>${eur(sum(d => d.zahlung_eingegangen && !d.provision_ausgezahlt))}</b></div>
      <div><span>Wartet auf Kundenzahlung</span><b>${eur(sum(d => !d.zahlung_eingegangen))}</b></div><div><span>Ausgezahlt</span><b>${eur(sum(d => d.provision_ausgezahlt))}</b></div></div>
      ${Object.values(groups).sort((a, b) => b.m.localeCompare(a.m)).map(g => { const tot = g.items.reduce((a, d) => a + provision(d).betrag, 0), paid = g.items.every(d => d.provision_ausgezahlt);
        return `<div class="block" style="margin-top:8px"><div class="kv"><b>${esc(monat(g.m))}${inhaber() ? " · " + esc(name(g.an)) : ""}</b><span class="money">${eur(tot)}</span></div>
          <div>${g.items.map(d => `<div class="row"><span>${esc(d.kunde_firma)} · ${esc(d.produkt)}</span><span class="money">${eur(provision(d).betrag)}</span></div>`).join("")}</div>
          <p class="hint">${paid ? "Ausgezahlt." : !inhaber() ? `Bitte Rechnung über ${eur(tot)} netto (ggf. zzgl. 19 % USt.) an INFINERO stellen – Leistungszeitraum ${esc(monat(g.m))}. Auszahlung bis zum 10. des Folgemonats.` : "Wartet auf Rechnung bzw. Auszahlung bis zum 10."}</p></div>`; }).join("")}
      <p class="hint">Provision gibt es nur auf den Netto-Setup-Preis: 50 % für den Vertriebler oder 25 % für einen Tippgeber, der den Kontakt direkt an Ziu gegeben hat. Monatliche Beträge sind provisionsfrei.</p>`;
  }

  function dealSheet(id) {
    const l = S.data.detail; if (!l || l.id !== id) return;
    const frueher = (l._deals || []).filter(d => d.art !== "storno");
    const art = frueher.length ? "folge" : "neu";
    const vertr = frueher.length ? frueher[0].vertriebler : (l.owner || S.view.kuerzel);
    const tipp = frueher.length ? (frueher[0].tippgeber || "") : "";
    const root = sheet((art === "folge" ? "Folgeauftrag · " : "Abschluss · ") + l.firma, `<form id="f" class="form">
      <div class="field full"><label for="p">Produkt</label><select id="p">${PRODUKTE.map(p => `<option value="${p.code}">${esc(p.name)} – ${eur(p.setup)} + ${eur(p.monat)}/Monat</option>`).join("")}</select></div>
      <div class="field"><label for="s">Setup netto (€)</label><input id="s" type="number" step="0.01" min="0" inputmode="decimal" value="${PRODUKTE[0].setup}"></div>
      <div class="field"><label for="m">Monatlich netto (€)</label><input id="m" type="number" step="0.01" min="0" inputmode="decimal" value="${PRODUKTE[0].monat}"></div>
      <div class="field"><label for="dt">Unterschrieben am</label><input id="dt" type="date" value="${isoDate(new Date())}"></div>
      <div class="field"><label for="v">Vertriebler</label>${inhaber() && !frueher.length ? `<select id="v">${S.team.map(t => `<option value="${t.kuerzel}"${t.kuerzel === vertr ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select>` : `<input id="v" value="${esc(vertr)}" readonly>`}</div>
      ${inhaber() ? `<div class="field full" id="tw"><label for="tg">Tippgeber (nur bei Tipp direkt an Ziu)</label><input id="tg" value="${esc(tipp)}"${frueher.length ? " readonly" : ""}></div>` : ""}
      <div class="field full"><label for="nz">Notiz</label><input id="nz" placeholder="z. B. 2 Kanäle: WhatsApp + Instagram"></div>
      <div class="calc full" id="calc"></div>
      <div class="full"><button class="btn primary block" type="submit">Abschluss melden</button></div></form>`, id);
    const q = s => root.querySelector(s);
    const calc = () => {
      const d = { setup: +q("#s").value, vertriebler: q("#v").value, tippgeber: q("#tg") ? q("#tg").value.trim() : "" };
      if (d.vertriebler !== "INH") d.tippgeber = ""; if (q("#tw")) q("#tw").hidden = d.vertriebler !== "INH";
      const p = provision(d); q("#calc").innerHTML = p.an ? `Provision ${esc(name(p.an))}: <b>${eur(p.betrag)}</b> (${p.satz * 100} % vom Setup)` : "Keine Provision (Inhaber verkauft direkt, ohne Tippgeber).";
    };
    q("#p").addEventListener("change", () => { const p = PRODUKTE.find(x => x.code === q("#p").value); q("#s").value = p.setup; q("#m").value = p.monat; calc(); });
    root.addEventListener("input", calc); calc();
    q("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const d = { lead_id: l.id, kunde_firma: l.firma, produkt: q("#p").value, art, setup: +q("#s").value || 0, monatlich: +q("#m").value || 0,
        datum: q("#dt").value, vertriebler: q("#v").value, tippgeber: q("#tg") && q("#v").value === "INH" ? (q("#tg").value.trim() || null) : null, notiz: q("#nz").value.trim() || null };
      try {
        const deal = await store.dealAnlegen(d);
        const offen = (l._auftraege || []).find(a => ["zusage", "auftrag_raus"].includes(a.stufe) && a.produkt === d.produkt);
        const beauftragt = { stufe: "beauftragt", beauftragt_am: new Date().toISOString(), beauftragt_name: "Abschluss gemeldet (unterschrieben)", abschluss_id: deal && deal.id };
        if (offen) await store.auftragUpdate(offen.id, beauftragt);
        else await store.auftragAnlegen({ lead_id: l.id, produkt: d.produkt, setup: d.setup, monatlich: d.monatlich, vertriebler: d.vertriebler, tippgeber: d.tippgeber, notiz: d.notiz, ...beauftragt });
        if (l.status !== "gewonnen") { await store.leadUpdate(l.id, { status: "gewonnen", wiedervorlage: null, naechster_schritt: "Kunde – Umsetzung" }); await store.aktivitaet({ lead_id: l.id, typ: "status", ergebnis: "gewonnen", text: "Abschluss " + d.produkt }); }
        schliessen(false); zeige("deals");
        const pv = provision(d);
        feiern("Abschluss!", `${l.firma} · ${d.produkt}` + (pv.an && pv.an === S.view.kuerzel ? ` · +${eur(pv.betrag)} Provision` : ` · ${eur(d.setup)} Setup`));
      } catch (err) { fehler(err); }
    });
  }

  // ---------------------------------------------------------------- Aufträge (vom Ja bis zur fertigen Website)
  const STUFEN = [["zusage", "Zusage", "warn"], ["auftrag_raus", "Auftrag raus", ""], ["beauftragt", "Beauftragt", "ok"], ["onboarding", "Onboarding", "accent"],
    ["in_arbeit", "In Arbeit", "accent"], ["abnahme", "Abnahme", "warn"], ["live", "Live", "ok"]];
  const STUFE = Object.fromEntries([...STUFEN, ["storniert", "Storniert", "bad"]].map(x => [x[0], x]));
  const NAECHSTE = { zusage: "auftrag_raus", auftrag_raus: "beauftragt", beauftragt: "onboarding", onboarding: "in_arbeit", in_arbeit: "abnahme", abnahme: "live" };
  const WEITER_TEXT = { zusage: "Auftrag ist verschickt", beauftragt: "Onboarding-Gespräch geführt", onboarding: "Alle Infos da – Umsetzung starten",
    in_arbeit: "Zur Abnahme an den Kunden", abnahme: "Abgenommen – ist live" };
  const tageSeit = s => Math.max(0, Math.floor((Date.now() - new Date(s)) / 864e5));
  function handlungsbedarf(a) {
    const t = tageSeit(a.stufe_seit);
    return { zusage: t >= 2 && "Auftrag noch nicht verschickt", auftrag_raus: t >= 3 && "Nachfassen – noch nicht beauftragt",
      beauftragt: t >= 3 && "Onboarding-Gespräch führen", onboarding: t >= 5 && "Fehlen noch Infos vom Kunden?", abnahme: t >= 5 && "Abnahme nachfassen" }[a.stufe] || "";
  }
  function auftragCard(a) {
    const st = STUFE[a.stufe] || [a.stufe, a.stufe, ""], hb = handlungsbedarf(a), t = tageSeit(a.stufe_seit);
    return `<article class="card auftrag${hb ? " hb" : ""}"><div class="head"><h3><button type="button" data-auftrag="${a.id}">${esc((a.lead && a.lead.firma) || "Auftrag")}</button></h3><span class="pill ${st[2]}">${esc(st[1])}</span></div>
      <div class="meta"><span>${esc(a.produkt)}</span><span class="money">${eur(a.setup)}</span>${+a.monatlich ? `<span>+ ${eur(a.monatlich)}/Monat</span>` : ""}</div>
      <div class="meta"><span>${esc(name(a.vertriebler))}</span><span>${t === 0 ? "seit heute" : t === 1 ? "seit gestern" : `seit ${t} Tagen`}</span>${a.lead && a.lead.ort ? `<span>${esc(a.lead.ort)}</span>` : ""}</div>
      ${hb ? `<div class="due">${esc(hb)}</div>` : ""}</article>`;
  }
  async function viewAuftraege() {
    const as = await store.auftraege(); S.data.auftraege = as;
    const aktiv = as.filter(a => a.stufe !== "storniert"), hb = aktiv.filter(handlungsbedarf);
    if (!as.length) return `<h2 class="sec">Aufträge</h2><div class="empty">Noch keine Aufträge. Sagt ein Kunde am Telefon zu, im Lead auf <b>„Zusage“</b> tippen – dann wandert er hier von Stufe zu Stufe bis zur fertigen Website.</div>`;
    const summe = f => aktiv.filter(f).reduce((x, a) => x + (+a.setup || 0), 0);
    return `<div class="sum"><div class="hi"><span>Offen (Zusage/Auftrag raus)</span><b>${eur(summe(a => ["zusage", "auftrag_raus"].includes(a.stufe)))}</b></div>
        <div><span>Beauftragt, in Umsetzung</span><b>${eur(summe(a => ["beauftragt", "onboarding", "in_arbeit", "abnahme"].includes(a.stufe)))}</b></div><div><span>Live</span><b>${aktiv.filter(a => a.stufe === "live").length}</b></div></div>
      ${hb.length ? `<h2 class="sec">Jetzt dran <span class="n">${hb.length}</span></h2><div class="list">${hb.map(auftragCard).join("")}</div>` : ""}
      <h2 class="sec">Tafel</h2><p class="hint">Wischen für alle Stufen. Karte antippen für Details und den nächsten Schritt.</p>
      <div class="tafel">${STUFEN.map(([k, t]) => { const xs = aktiv.filter(a => a.stufe === k);
        return `<section class="spalte" aria-label="${esc(t)}"><h3>${esc(t)} <span class="n">${xs.length}</span></h3>${xs.map(auftragCard).join("") || `<div class="leer">–</div>`}</section>`; }).join("")}</div>
      ${as.length > aktiv.length ? `<p class="hint">${as.length - aktiv.length} stornierte Aufträge ausgeblendet.</p>` : ""}`;
  }
  const ZAHLUNG = { offen: "offen", bezahlt: "bezahlt ✓", fehlgeschlagen: "fehlgeschlagen ⚠" };
  const ABO = { aktiv: "aktiv", gekuendigt: "gekündigt", beendet: "beendet" };
  const RSTATUS = { paid: "bezahlt", open: "offen", draft: "Entwurf", void: "storniert", uncollectible: "uneinbringlich" };
  async function auftragSheet(id) {
    let a; try { a = await store.auftrag(id); } catch (e) { return fehler(e); }
    const l = a.lead || {}, i = STUFEN.findIndex(x => x[0] === a.stufe), naechste = NAECHSTE[a.stufe];
    const kannZurueck = inhaber() && i > 0 && a.stufe !== "beauftragt";
    const kannStorno = a.stufe !== "storniert" && a.stufe !== "live" && (inhaber() || ["zusage", "auftrag_raus"].includes(a.stufe));
    const root = sheet(l.firma || "Auftrag", `
      <ol class="stepper">${STUFEN.map(([k, t], j) => `<li class="${j < i ? "done" : j === i ? "jetzt" : ""}">${esc(t)}</li>`).join("")}</ol>
      ${a.stufe === "storniert" ? `<div class="due">Dieser Auftrag ist storniert.</div>` : ""}
      <div class="block">
        <div class="kv"><span>Produkt</span><b>${esc((PRODUKTE.find(p => p.code === a.produkt) || {}).name || a.produkt)}</b></div>
        <div class="kv"><span>Einrichtung</span><b class="money">${eur(a.setup)}</b></div>
        <div class="kv"><span>Monatlich</span><span class="money">${eur(a.monatlich)} · ${a.laufzeit_monate} Monate</span></div>
        <div class="kv"><span>Vertriebler</span><span>${esc(name(a.vertriebler))}${a.tippgeber ? " · Tipp: " + esc(a.tippgeber) : ""}</span></div>
        <div class="kv"><span>Zusage</span><span>${dDE(a.erstellt_am)}${a.beauftragt_am ? ` · beauftragt ${dDE(a.beauftragt_am)}` : ""}${a.live_am ? ` · live ${dDE(a.live_am)}` : ""}</span></div>
        ${a.notiz ? `<div class="meta"><span>${esc(a.notiz)}</span></div>` : ""}
        ${a.zahlung_status || a.abo_status ? `<div class="kv"><span>Zahlung</span><span>${esc(ZAHLUNG[a.zahlung_status] || a.zahlung_status || "–")}${a.abo_status ? " · Abo " + esc(ABO[a.abo_status] || a.abo_status) : ""}</span></div>` : ""}
        ${a.beauftragt_name && a.zustimmung ? `<div class="kv"><span>Online zugestimmt</span><span>${esc(a.beauftragt_name)} · ${dDE(a.zustimmung.zeit)}</span></div>` : ""}
        <div id="rechnungen"></div>
      </div>
      <div class="block">
        <div class="kv"><b>${esc(l.firma || "")}</b><button class="btn small" type="button" data-open="${l.id}">Lead öffnen</button></div>
        <div class="meta">${[l.ansprechpartner, l.ort, l.branche].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}</div>
        ${l.telefon ? `<div class="call"><a class="tel" href="${esc(telHref(l.telefon))}"><svg viewBox="0 0 24 24">${ICON.tel}</svg>${esc(l.telefon)}</a>${l.email ? `<span class="v">${esc(l.email)}</span>` : ""}</div>` : ""}
      </div>
      ${a.stufe === "storniert" ? "" : `<h2 class="sec">Nächster Schritt</h2><div class="block">
        ${["zusage", "auftrag_raus"].includes(a.stufe) ? `<p class="hint" style="margin:0 0 8px">${a.stufe === "zusage" ? "Schick dem Kunden den Online-Auftrag: Er sieht das Angebot, stimmt zu und hinterlegt die Zahlung – der Rest läuft automatisch." : `Online-Auftrag ist raus${a.gesendet_am ? " seit " + dDE(a.gesendet_am) : ""}. Sobald der Kunde bezahlt/zustimmt, springt der Auftrag von selbst auf „Beauftragt“.`}</p>
          <div class="actions"><button class="btn primary" type="button" data-online="${a.id}">${a.stufe === "zusage" ? "Online-Auftrag senden" : "Link erneut senden"}</button></div>
          <details class="hint"><summary>Anders beauftragt (Papier/PDF)?</summary><div class="actions" style="margin-top:8px"><button class="btn small" type="button" data-beauftragen="${a.id}">Kunde hat beauftragt</button></div></details>`
        : naechste ? `<div class="actions"><button class="btn primary" type="button" data-stufe="${naechste}" data-aid="${a.id}">${esc(WEITER_TEXT[a.stufe])}</button></div>`
        : `<p class="hint" style="margin:0">Fertig – der Kunde ist live. 🎉</p>`}
        ${a.stufe === "beauftragt" ? `<p class="hint">Der Fragenkatalog fürs Onboarding-Gespräch kommt hier als Formular hinein, sobald Ziu ihn freigegeben hat.</p>` : ""}
        <div class="actions">${kannZurueck ? `<button class="btn small" type="button" data-stufe="${STUFEN[i - 1][0]}" data-aid="${a.id}">Eine Stufe zurück</button>` : ""}
          ${kannStorno ? `<button class="btn small danger" type="button" data-stornieren="${a.id}">Stornieren</button>` : ""}</div>
      </div>`}`);
    if (inhaber() && (a.stripe_customer_id || a.zahlung_status)) store.rechnungen(a.id).then(rs => {
      const z = root.querySelector("#rechnungen"); if (!z || !rs.length) return;
      z.innerHTML = rs.map(r => `<div class="kv"><span>${esc(r.nummer || "Rechnung")} · ${dDE(r.datum)}</span><span class="money">${eur(r.brutto)} · ${esc(RSTATUS[r.status] || r.status)}${r.pdf_url ? ` · <a href="${esc(r.pdf_url)}" target="_blank" rel="noopener">PDF</a>` : ""}</span></div>`).join("");
    }).catch(() => {});
    root.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b) return;
      const d = b.dataset;
      if (d.stufe) { e.stopPropagation(); await stufeSetzen(a, d.stufe); }
      if (d.online) { e.stopPropagation(); auftragMailSheet(a); return; }
      if (d.beauftragen) { e.stopPropagation(); if (confirm(`${l.firma} hat verbindlich beauftragt (${a.produkt}, ${eur(a.setup)})? Damit gilt es als Abschluss.`)) await beauftragen(a); }
      if (d.stornieren) { e.stopPropagation(); if (confirm("Auftrag wirklich stornieren?" + (a.abschluss_id ? " Der Abschluss bleibt bestehen – bei Bedarf Storno im Vault anlegen." : ""))) await stufeSetzen(a, "storniert"); }
    });
  }
  async function stufeSetzen(a, stufe) {
    const patch = { stufe };
    if (stufe === "live") patch.live_am = isoDate(new Date());
    if (stufe === "onboarding") patch.onboarding_am = new Date().toISOString();
    if (stufe === "auftrag_raus") patch.gesendet_am = new Date().toISOString();
    try {
      await store.auftragUpdate(a.id, patch);
      await store.aktivitaet({ lead_id: a.lead_id, typ: "status", text: `Auftrag ${a.produkt}: ${STUFE[stufe][1]}` });
      if (stufe === "live") feiern("Live!", `${(a.lead && a.lead.firma) || ""} ist online.`);
      else toast(STUFE[stufe][1]);
      schliessen(false); zeige("auftraege");
    } catch (err) { fehler(err); }
  }
  async function beauftragen(a) {
    try {
      const l = await store.lead(a.lead_id);
      const art = (l._deals || []).some(d => d.art !== "storno") ? "folge" : "neu";
      const d = { lead_id: l.id, kunde_firma: l.firma, produkt: a.produkt, art, setup: +a.setup || 0, monatlich: +a.monatlich || 0,
        datum: isoDate(new Date()), vertriebler: a.vertriebler, tippgeber: a.tippgeber || null, notiz: a.notiz || null };
      const deal = await store.dealAnlegen(d);
      await store.auftragUpdate(a.id, { stufe: "beauftragt", beauftragt_am: new Date().toISOString(), beauftragt_name: "manuell bestätigt", abschluss_id: deal && deal.id });
      if (l.status !== "gewonnen") await store.leadUpdate(l.id, { status: "gewonnen", wiedervorlage: null, naechster_schritt: "Onboarding-Gespräch" });
      await store.aktivitaet({ lead_id: l.id, typ: "status", ergebnis: "gewonnen", text: "Beauftragt: " + a.produkt });
      schliessen(false); zeige("auftraege");
      const pv = provision(d);
      feiern("Beauftragt!", `${l.firma} · ${a.produkt}` + (pv.an && pv.an === S.view.kuerzel ? ` · +${eur(pv.betrag)} Provision` : ` · ${eur(d.setup)} Einrichtung`));
    } catch (err) { fehler(err); }
  }
  function zusageSheet(id) {
    const l = S.data.detail; if (!l || l.id !== id) return;
    const frueher = (l._deals || []).filter(d => d.art !== "storno");
    const vertr = frueher.length ? frueher[0].vertriebler : (l.owner || S.view.kuerzel);
    const tipp = frueher.length ? (frueher[0].tippgeber || "") : "";
    const vorschlag = PRODUKTE.find(p => (l.interesse_produkte || []).includes(p.code)) || PRODUKTE[0];
    const root = sheet("Zusage · " + l.firma, `<form id="f" class="form">
      <p class="hint full" style="margin:0">Der Kunde hat am Telefon Ja gesagt. Das ist noch kein Abschluss – der zählt, sobald er beauftragt (Vertrag bzw. Online-Auftrag).</p>
      <div class="field full"><label for="p">Produkt</label><select id="p">${PRODUKTE.map(p => `<option value="${p.code}"${p.code === vorschlag.code ? " selected" : ""}>${esc(p.name)} – ${eur(p.setup)} + ${eur(p.monat)}/Monat</option>`).join("")}</select></div>
      <div class="field"><label for="s">Einrichtung netto (€)</label><input id="s" type="number" step="0.01" min="0" inputmode="decimal" value="${vorschlag.setup}"></div>
      <div class="field"><label for="m">Monatlich netto (€)</label><input id="m" type="number" step="0.01" min="0" inputmode="decimal" value="${vorschlag.monat}"></div>
      <div class="field"><label for="lz">Laufzeit (Monate)</label><input id="lz" type="number" min="1" step="1" inputmode="numeric" value="12"></div>
      <div class="field"><label for="v">Vertriebler</label>${inhaber() && !frueher.length ? `<select id="v">${S.team.map(t => `<option value="${t.kuerzel}"${t.kuerzel === vertr ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select>` : `<input id="v" value="${esc(vertr)}" readonly>`}</div>
      ${inhaber() ? `<div class="field full" id="tw"><label for="tg">Tippgeber (nur bei Tipp direkt an Ziu)</label><input id="tg" value="${esc(tipp)}"${frueher.length ? " readonly" : ""}></div>` : ""}
      <div class="field full"><label for="nz">Notiz (z. B. Sonderwünsche, Rabatt, Starttermin)</label><input id="nz"></div>
      <div class="full"><button class="btn primary block" type="submit">Zusage speichern</button></div></form>`, id);
    const q = s => root.querySelector(s);
    const tw = () => { if (q("#tw")) q("#tw").hidden = q("#v").value !== "INH"; }; tw(); q("#v").addEventListener("change", tw);
    q("#p").addEventListener("change", () => { const p = PRODUKTE.find(x => x.code === q("#p").value); q("#s").value = p.setup; q("#m").value = p.monat; });
    q("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const a = { lead_id: l.id, produkt: q("#p").value, setup: +q("#s").value || 0, monatlich: +q("#m").value || 0, laufzeit_monate: +q("#lz").value || 12,
        vertriebler: q("#v").value, tippgeber: q("#tg") && q("#v").value === "INH" ? (q("#tg").value.trim() || null) : null, notiz: q("#nz").value.trim() || null, stufe: "zusage" };
      try {
        await store.auftragAnlegen(a);
        await store.leadUpdate(l.id, { status: "angebot", wiedervorlage: naechsterWerktag(3, 10).toISOString(), naechster_schritt: "Beauftragung nachfassen" });
        await store.aktivitaet({ lead_id: l.id, typ: "status", ergebnis: "angebot", text: `Zusage: ${a.produkt} (${eur(a.setup)})` });
        schliessen(false); zeige("auftraege");
        feiern("Zusage!", `${l.firma} · ${a.produkt} – jetzt Auftrag raus.`, false);
      } catch (err) { fehler(err); }
    });
  }

  // ---------------------------------------------------------------- Statistik
  function zeitraum(k) {
    const h = new Date(), iso = isoDate, v = new Date(h);
    if (k === "7") v.setDate(h.getDate() - 6);
    else if (k === "30") v.setDate(h.getDate() - 29);
    else if (k === "monat") v.setDate(1);
    else if (k === "vormonat") { const a = new Date(h.getFullYear(), h.getMonth() - 1, 1), b = new Date(h.getFullYear(), h.getMonth(), 0); return { von: iso(a), bis: iso(b) }; }
    else v.setFullYear(h.getFullYear() - 1);
    return { von: iso(v), bis: iso(h) };
  }
  const FELDER_STAT = ["anrufe", "erreicht", "infos", "interesse", "termine", "abschluesse", "setup"];
  async function viewStatistik() {
    const st = (S.stat ||= { zeitraum: "30", person: null, dim: "zielgruppe" });
    const person = st.person || (inhaber() ? "EF" : S.view.kuerzel);
    const { von, bis } = zeitraum(st.zeitraum);
    const nur = person === "team" ? null : person;
    const [roh, gruppen] = await Promise.all([store.statistikTage(von, bis), store.statistikGruppen(von, bis, st.dim, nur)]);
    const proTag = {};
    roh.filter(r => !nur || r.kuerzel === nur).forEach(r => { const x = (proTag[r.tag.slice(0, 10)] ||= Object.fromEntries(FELDER_STAT.map(f => [f, 0]))); FELDER_STAT.forEach(f => (x[f] += +r[f] || 0)); });
    const tage = Object.entries(proTag).map(([tag, w]) => ({ tag, ...w })).sort((a, b) => a.tag.localeCompare(b.tag));
    S.data.statTage = tage;
    const sum = f => tage.reduce((a, r) => a + r[f], 0);
    const arbeitstage = tage.filter(r => r.anrufe > 0).length || 1;
    const quote = (a, b) => (b ? Math.round(a / b * 100) + " %" : "–");
    const ziel = nur === "INH" ? 0 : 100;
    const chip = (grp, k, l, akt) => `<button class="chip" type="button" data-stat="${grp}" data-wert="${k}" aria-pressed="${akt === k}">${l}</button>`;
    const tagKurz = s => new Date(s + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
    // Balkendiagramm: Anrufe pro Tag, Linie = Tagesziel
    const W = 700, H = 230, L = 48, B = 32, T = 14, n = tage.length;
    const max = Math.max(ziel ? ziel * 1.15 : 10, ...tage.map(r => r.anrufe)) || 10;
    const y = v => T + (H - T - B) * (1 - v / max), bw = n ? Math.min(28, (W - L - 8) / n * 0.72) : 0, step = n ? (W - L - 8) / n : 0;
    const ticks = [0, Math.round(max / 2), Math.round(max)].filter((v, i, a) => a.indexOf(v) === i);
    const svg = n ? `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Anrufe pro Tag">
      ${ticks.map(v => `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${v}</text>`).join("")}
      ${tage.map((r, i) => { const x = L + 4 + i * step + (step - bw) / 2, h = Math.max(0, H - B - y(r.anrufe)), rr = Math.min(4, bw / 2, h);
        return `<path d="M${x},${H - B} v${-(h - rr)} q0,${-rr} ${rr},${-rr} h${bw - 2 * rr} q${rr},0 ${rr},${rr} v${h - rr} z" class="barm${r.anrufe >= ziel && ziel ? " voll" : ""}" data-bar="${r.tag}"><title>${tagKurz(r.tag)}: ${r.anrufe} Anrufe, ${r.termine} Termine, ${r.abschluesse} Abschlüsse</title></path>
          <rect x="${L + 4 + i * step}" y="${T}" width="${step}" height="${H - T - B}" fill="transparent" data-bar="${r.tag}"/>
          ${i % Math.ceil(n / 7) === 0 ? `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" class="ax">${new Date(r.tag + "T12:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</text>` : ""}`; }).join("")}
      ${ziel ? `<line x1="${L}" x2="${W}" y1="${y(ziel)}" y2="${y(ziel)}" class="ziellinie"/><text x="${W - 4}" y="${y(ziel) - 5}" text-anchor="end" class="ax">Ziel ${ziel}</text>` : ""}
    </svg>` : "";
    const dimName = { zielgruppe: "Zielgruppe", ort: "Stadt", branche: "Branche", produkt: "Produkt" };
    return `<h2 class="sec">Statistik</h2>
      <div class="chips scroll">${[["EF", "Elias"], ["INH", "Ziu"], ["team", "Team"]].map(([k, l]) => chip("person", k, l, person)).join("")}</div>
      <div class="chips scroll" style="margin-top:6px">${[["7", "7 Tage"], ["30", "30 Tage"], ["monat", "Dieser Monat"], ["vormonat", "Letzter Monat"], ["alles", "12 Monate"]].map(([k, l]) => chip("zeitraum", k, l, st.zeitraum)).join("")}</div>
      <div class="kpis six" style="margin-top:10px">
        <div><span>Anrufe</span><b>${sum("anrufe")}</b></div><div><span>Ø pro Arbeitstag</span><b>${Math.round(sum("anrufe") / arbeitstage)}</b></div>
        <div><span>Erreicht</span><b>${quote(sum("erreicht"), sum("anrufe"))}</b></div><div><span>Termine</span><b>${sum("termine")}</b></div>
        <div><span>Abschlüsse</span><b>${sum("abschluesse")}</b></div><div><span>Setup-Umsatz</span><b>${eur(sum("setup")).replace(",00", "")}</b></div></div>
      <h2 class="sec">Anrufe pro Tag</h2>
      <div class="block">${svg || `<p class="hint" style="margin:0">Im gewählten Zeitraum noch keine Daten.</p>`}<p class="hint" id="bardetail" style="margin:0">${n ? "Balken antippen für Details. Grün = Tagesziel erreicht." : ""}</p></div>
      <h2 class="sec">Tag für Tag</h2>
      <div class="block tablewrap"><table class="stats"><thead><tr><th>Tag</th><th>Anrufe</th><th>Erreicht</th><th>Infos</th><th>Termine</th><th>Abschl.</th><th>Setup</th></tr></thead>
        <tbody>${tage.length ? tage.slice().reverse().map(r => `<tr><td>${tagKurz(r.tag)}</td><td>${r.anrufe}</td><td>${r.erreicht}</td><td>${r.infos}</td><td>${r.termine}</td><td>${r.abschluesse}</td><td>${r.setup ? eur(r.setup).replace(",00", "") : "–"}</td></tr>`).join("") : `<tr><td colspan="7">Keine Daten.</td></tr>`}</tbody></table></div>
      <h2 class="sec">Was läuft am besten?</h2>
      <div class="seg" role="group" aria-label="Auswertung nach">${Object.entries(dimName).map(([k, l]) => `<button type="button" data-stat="dim" data-wert="${k}" aria-pressed="${st.dim === k}">${l}</button>`).join("")}</div>
      <div class="block tablewrap" style="margin-top:8px"><table class="stats"><thead><tr><th>${dimName[st.dim]}</th>${st.dim === "produkt" ? "" : "<th>Anrufe</th><th>Termine</th><th>Termin-Quote</th>"}<th>Abschl.</th><th>Setup</th></tr></thead>
        <tbody>${gruppen.length ? gruppen.slice(0, 12).map(g => `<tr><td>${esc(g.gruppe)}</td>${st.dim === "produkt" ? "" : `<td>${g.anrufe}</td><td>${g.termine}</td><td>${quote(g.termine, g.anrufe)}</td>`}<td>${g.abschluesse}</td><td>${+g.setup ? eur(g.setup).replace(",00", "") : "–"}</td></tr>`).join("") : `<tr><td colspan="6">Keine Daten.</td></tr>`}</tbody></table></div>
      ${store.mode === "demo" ? `<p class="hint">Demo: Verlauf der letzten Wochen ist beispielhaft erzeugt.</p>` : ""}
      ${inhaber() ? `<div class="actions"><button class="btn small" type="button" id="statcsv">Statistik als CSV speichern</button></div>` : ""}`;
  }
  function statCSV() {
    const r = S.data.statTage || [], cols = ["tag", ...FELDER_STAT];
    const csv = "\ufeff" + [cols.join(","), ...r.map(x => cols.map(c => x[c]).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `statistik-${isoDate(new Date())}.csv`; document.body.append(a); a.click(); a.remove();
  }

  // ---------------------------------------------------------------- Cockpit (Inhaber)
  async function viewCockpit() {
    const [c, ds] = await Promise.all([store.cockpit(), store.deals()]);
    const st = {}; c.akt.forEach(a => { const s = (st[a.von] ||= { anrufe: 0, nicht: 0, kein: 0, info: 0, pos: 0 }); s.anrufe++;
      if (a.ergebnis === "nicht_erreicht") s.nicht++; else if (a.ergebnis === "kein_interesse") s.kein++; else if (a.ergebnis === "info") s.info++; else s.pos++; });
    const rows = Object.entries(st);
    const cfg = S.cfg || { fokus: "handwerk", auto_wechsel: true }, zg = S.zg || [];
    const naechste = c.rotation.filter(r => !r.zielgruppe || r.zielgruppe === cfg.fokus).slice(0, 5);
    return `<h2 class="sec">Wochenfokus</h2>
      <div class="block"><form id="fokusf" class="form">
        <div class="field"><label for="fk">Zielgruppe dieser Woche</label><select id="fk">${zg.map(z => `<option value="${z.id}"${z.id === cfg.fokus ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></div>
        <label class="check"><input id="fkauto" type="checkbox"${cfg.auto_wechsel ? " checked" : ""}><span>Jeden Montag automatisch zur nächsten Zielgruppe wechseln</span></label>
        <div class="full"><button class="btn small" type="submit">Speichern</button></div></form>
        <p class="hint">Montags kommen immer zuerst Handwerker dran – Salons und Restaurants haben dann oft Ruhetag.</p></div>
      <h2 class="sec">Demo-Websites je Zielgruppe</h2>
      <div class="block"><form id="demof" class="form">${zg.map(z => `<div class="field full"><label for="du_${z.id}">${esc(z.name)}</label><input id="du_${z.id}" data-demo-url="${z.id}" type="url" inputmode="url" placeholder="https://infinero.de/…" value="${esc(z.demo_url)}"></div>`).join("")}
        <div class="full"><button class="btn small" type="submit">Links speichern</button></div></form>
        <p class="hint">Der passende Link erscheint auf jeder Anrufkarte und in den Info-Mails – Elias kann ihn direkt kopieren und schicken.</p></div>
      <h2 class="sec">Standard-Link zur Terminbuchung</h2>
      <div class="block"><form id="terminf" class="form"><div class="field full"><label for="tl">Nur falls jemand keinen eigenen Link im Profil hat</label><input id="tl" type="url" inputmode="url" placeholder="https://…" value="${esc(cfg.termin_link)}"></div>
        <div class="full"><button class="btn small" type="submit">Speichern</button></div></form>
        <p class="hint">Jeder trägt seinen eigenen Cal.com-Link im Profil ein (Name oben rechts) – die Mail nimmt den Link des Absenders. Ohne Link bittet die Mail um eine Antwort mit Wunschtermin.</p></div>
      <h2 class="sec">Heute im Team</h2>
      <div class="block tablewrap"><table class="stats"><thead><tr><th>Wer</th><th>Anrufe</th><th>N.&nbsp;err.</th><th>Nein</th><th>Info</th><th>Ja</th></tr></thead>
      <tbody>${rows.length ? rows.map(([k, s]) => `<tr><td>${esc(name(k))}</td><td>${s.anrufe}</td><td>${s.nicht}</td><td>${s.kein}</td><td>${s.info}</td><td>${s.pos}</td></tr>`).join("") : `<tr><td colspan="6">Heute noch keine Anrufe erfasst.</td></tr>`}</tbody></table></div>
      <h2 class="sec">Info-Mails offen <span class="n">${c.info.length}</span></h2>
      <div class="list">${c.info.length ? c.info.map(l => `<article class="card"><div class="head"><h3><button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3><span class="pill accent">${esc((l.interesse_produkte || []).join(", ") || "allgemein")}</span></div>
        <div class="kv"><span class="v">${esc(l.email || "keine E-Mail")}</span></div>
        <div class="actions">${l.email ? `<button class="btn small primary" type="button" data-infomail="${l.id}">Mail öffnen</button>` : ""}<button class="btn small" type="button" data-mailok="${l.id}">Als gesendet markieren</button></div>
        <div class="meta"><span>${esc(l.ansprechpartner || "")}</span><span>Einwilligung ${dDE(l.einwilligung_email)}</span><span>${esc(name(l.owner))}</span></div></article>`).join("") : `<div class="empty">Keine offenen Info-Anfragen.</div>`}</div>
      <p class="hint">„Mail öffnen“ erstellt eine fertige, persönliche Mail in deiner Mail-App (Produkte mit Preisen, Demo-Link, Website-Befund). Absender <b>kontakt@infinero.de</b> wählen, kurz prüfen, senden, dann „Als gesendet markieren“.</p>
      <h2 class="sec">Demo-Websites <span class="n">${c.demo.length}</span></h2>
      <div class="list">${c.demo.length ? c.demo.map(l => `<article class="card"><div class="head"><h3><button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3><span class="pill ${l.demo_website === "offen" ? "warn" : "accent"}">${l.demo_website === "offen" ? "offen" : "in Arbeit"}</span></div>
        <div class="meta"><span>${esc(l.branche || "")}</span><span>${esc(l.ort || "")}</span>${l.website ? `<span>${webLink(l.website)}</span>` : ""}<span>${esc(l.naechster_schritt || "")}</span></div>
        ${l.demo_infos ? `<div class="demobox">${demoText(l.demo_infos)}</div>` : `<div class="due">Keine Demo-Infos erfasst</div>`}
        <div class="actions">${l.demo_website === "offen" ? `<button class="btn small" type="button" data-demo="in_arbeit" data-id="${l.id}">In Arbeit</button>` : ""}<button class="btn small" type="button" data-demo="fertig" data-id="${l.id}">Fertig</button></div></article>`).join("") : `<div class="empty">Keine Demo-Websites angefragt.</div>`}</div>
      <h2 class="sec">Lead-Nachschub</h2>
      <div class="block"><div class="kv"><span>Leads im Pool (noch niemandem zugeteilt)</span><b class="money">${c.pool}</b></div>
        <div><div class="lbl">Als Nächstes gesucht (${esc((zg.find(z => z.id === cfg.fokus) || {}).name || cfg.fokus)})</div>${naechste.map(r => `<div class="row"><span>${esc(r.stadt)} · ${esc(r.branche)}</span><span class="meta">Ring ${r.ring}</span></div>`).join("") || `<p class="hint">Für diese Zielgruppe ist die Rotation abgearbeitet.</p>`}</div>
        <p class="hint">Der automatische Nachschub füllt den Pool jede Nacht nach der Städte-Rotation auf. Zusätzlich kannst du hier eine CSV-Datei (z. B. Export aus Outscraper oder Excel) hochladen – Dubletten werden übersprungen.</p>
        <div class="actions"><label class="btn small" for="csvin">CSV importieren</label><input id="csvin" type="file" accept=".csv,text/csv" hidden><button class="btn small" type="button" id="csvout">Master-Lead-Liste als CSV</button></div></div>
      <h2 class="sec">Provisionen</h2>${provHTML(ds)}`;
  }

  // CSV
  function parseCSV(text) {
    text = text.replace(/^\ufeff/, ""); const first = text.split(/\r?\n/)[0] || "";
    const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : (first.includes("\t") ? "\t" : ",");
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
    return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }
  const ALIAS = { firma: ["firma", "name", "title", "company", "company_name", "unternehmen", "firmenname"], branche: ["branche", "category", "type", "kategorie", "subtypes", "categories"],
    telefon: ["telefon", "phone", "phone_1", "phone_number", "tel", "telefonnummer"], email: ["email", "e-mail", "email_1", "mail"], website: ["website", "site", "url", "domain", "webseite", "homepage"],
    strasse: ["strasse", "straße", "street", "adresse"], plz: ["plz", "postal_code", "postcode", "zip", "postleitzahl"], ort: ["ort", "city", "stadt"],
    ansprechpartner: ["ansprechpartner", "contact_name", "owner_name", "full_name"], bewertung_google: ["rating", "bewertung"], quelle: ["quelle"], notiz: ["notizen", "notiz", "notes"] };
  const mapRow = r => { const o = {}; for (const [z, ns] of Object.entries(ALIAS)) { const n = ns.find(n => r[n]); if (n) o[z] = r[n]; } if (o.website) o.website = o.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, ""); return o; };
  async function csvImport(file) {
    try {
      const rows = parseCSV(await file.text()).map(mapRow).filter(r => r.firma);
      if (!rows.length) return toast("Keine Zeilen mit Firmennamen gefunden.");
      let neu = 0, doppelt = 0;
      for (let i = 0; i < rows.length; i += 500) { const r = await store.importieren(rows.slice(i, i + 500), "CSV-Import " + file.name); neu += r.neu; doppelt += r.doppelt; }
      toast(`${neu} neue Leads importiert, ${doppelt} Dubletten übersprungen`); zeige();
    } catch (e) { fehler(e); }
  }
  async function csvExport() {
    const cols = ["lead_nr", "erfasst_am", "quelle", "owner", "firma", "branche", "ansprechpartner", "telefon", "email", "website", "strasse", "plz", "ort", "website_bewertung", "status", "gesperrt", "versuche", "letzter_kontakt", "wiedervorlage", "naechster_schritt", "interesse_produkte", "info_mail", "einwilligung_email", "demo_website", "kunden_id"];
    const cell = v => { v = Array.isArray(v) ? v.join("; ") : String(v ?? ""); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const rows = await store.alleLeads();
    const csv = "\ufeff" + [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `master-leads-${isoDate(new Date())}.csv`; document.body.append(a); a.click(); a.remove();
  }

  // ---------------------------------------------------------------- Profil
  function profilSheet() {
    const andere = S.team.filter(x => x.kuerzel !== S.view.kuerzel);
    const root = sheet(S.view.name, `<div class="block">
      <div class="kv"><span>Ansicht</span><b>${esc(S.view.name)} (${esc(S.view.kuerzel)})</b></div>
      ${store.mode === "live" ? `<div class="kv"><span>Angemeldet als</span><span>${esc(S.profil.name)}</span></div>` : ""}
      <div class="kv"><span>Neue Leads pro Tag</span><span>${S.view.tagesziel ?? 100} · nachladen in ${schritt()}er-Schritten</span></div></div>
      ${darfWechseln() && andere.length ? `<h2 class="sec">Ansicht wechseln</h2><div class="actions">${andere.map(x => `<button class="btn" type="button" data-ansicht="${x.kuerzel}">Zu ${esc(x.name.split(" ")[0])}${x.rolle === "inhaber" ? " (Passwort)" : ""}</button>`).join("")}</div>
        <div id="pw" hidden><form id="pwf" class="form" style="margin-top:10px"><div class="field"><label for="pwi">Passwort</label><input id="pwi" type="password" autocomplete="off" autocapitalize="off"></div><div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Öffnen</button></div></form></div>` : ""}
      ${(() => { const me = S.team.find(t => t.kuerzel === S.profil.kuerzel) || {}; return `<h2 class="sec">Für meine Info-Mails</h2><div class="block"><form id="telf" class="form">
        <div class="field"><label for="tel1">Meine Telefonnummer</label><input id="tel1" type="tel" inputmode="tel" placeholder="z. B. 0151 23456789" value="${esc(me.telefon)}"></div>
        <div class="field full"><label for="tl1">Mein Link zur Terminbuchung (Cal.com)</label><input id="tl1" type="url" inputmode="url" placeholder="https://cal.com/…" value="${esc(me.termin_link)}"></div>
        <div class="full"><button class="btn small" type="submit">Speichern</button></div></form>
        <p class="hint">Beides steht in den Info-Mails, die du verschickst – Kunden buchen damit direkt in deinem Kalender.</p>
        <details id="calcom"><summary>Cal.com mit der App verbinden (einmalig)</summary><div id="calcomin" class="hint">Lädt …</div></details></div>`; })()}
      <h2 class="sec">Benachrichtigungen</h2><div class="block" id="pushblock">${pushHTML()}</div>
      ${store.mode === "live" ? `<h2 class="sec">Passwort ändern</h2><div class="block"><form id="pwneu" class="form"><div class="field"><label for="pn1">Neues Passwort</label><input id="pn1" type="password" autocomplete="new-password" minlength="8" required></div><div class="field" style="justify-content:flex-end"><button class="btn small" type="submit">Speichern</button></div></form></div>` : ""}
      <h2 class="sec">Darstellung</h2><div class="seg" role="group" aria-label="Design">
        <button type="button" data-theme-set="dark" aria-pressed="${aktuellesTheme() === "dark"}">Dunkel</button><button type="button" data-theme-set="light" aria-pressed="${aktuellesTheme() === "light"}">Hell</button></div>
      <h2 class="sec">App aufs Handy</h2><div class="block"><p class="hint" style="margin:0">iPhone (Safari): Teilen → „Zum Home-Bildschirm“. Android (Chrome): Menü ⋮ → „App installieren“.</p></div>
      <div class="actions">${store.mode === "demo" ? `<button class="btn" type="button" id="reset">Demo zurücksetzen</button>` : `<button class="btn danger" type="button" id="logout">Abmelden</button>`}</div>`);
    let ziel = null;
    root.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "logout") { await store.signOut(); location.reload(); }
      if (b.id === "pushan") { b.disabled = true; await pushAktivieren(); root.querySelector("#pushblock").innerHTML = pushHTML(); }
      if (b.id === "pushaus") { await pushDeaktivieren(); root.querySelector("#pushblock").innerHTML = pushHTML(); }
      if (b.id === "reset") { await store.zuruecksetzen(); location.reload(); }
      if (b.dataset.themeSet) { setTheme(b.dataset.themeSet); root.querySelectorAll("[data-theme-set]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); }
      if (b.dataset.ansicht) {
        const x = S.team.find(m => m.kuerzel === b.dataset.ansicht);
        if (x.rolle === "inhaber") { ziel = x.kuerzel; root.querySelector("#pw").hidden = false; root.querySelector("#pwi").focus(); }
        else ansichtSetzen(x.kuerzel);
      }
    });
    root.querySelector("#calcom").addEventListener("toggle", async e => {
      if (!e.target.open || e.target.dataset.geladen) return;
      try { const w = await store.calcomWebhook(); e.target.dataset.geladen = "1";
        root.querySelector("#calcomin").innerHTML = `<ol style="padding-left:18px;margin:8px 0">
          <li>Cal.com → Einstellungen → Entwickler → <b>Webhooks</b> → „Neu“</li>
          <li>Abonnenten-URL: <code style="word-break:break-all">${esc(w.url)}</code> <button class="btn small" type="button" data-copy="${esc(w.url)}">Kopieren</button></li>
          <li>Geheimnis (Secret): <code style="word-break:break-all">${esc(w.secret)}</code> <button class="btn small" type="button" data-copy="${esc(w.secret)}">Kopieren</button></li>
          <li>Ereignisse: <b>Buchung erstellt, verschoben, storniert</b> → Speichern</li></ol>
          Danach landet jede Online-Buchung automatisch als Termin in der App (mit Push). Erinnerungen kommen morgens um 7 Uhr und 60 Minuten vor jedem Termin.`;
      } catch (err) { root.querySelector("#calcomin").textContent = "Konnte nicht geladen werden."; }
    });
    root.querySelector("#telf").addEventListener("submit", async e => { e.preventDefault(); try { await store.setProfil(root.querySelector("#tel1").value.trim(), root.querySelector("#tl1").value.trim()); S.team = await store.team(); toast("Gespeichert"); } catch (err) { fehler(err); } });
    const pn = root.querySelector("#pwneu");
    if (pn) pn.addEventListener("submit", async e => { e.preventDefault(); try { await store.passwortAendern(root.querySelector("#pn1").value); toast("Passwort geändert"); root.querySelector("#pn1").value = ""; } catch (err) { toast("Mindestens 8 Zeichen – bitte nochmal versuchen."); } });
    const f = root.querySelector("#pwf");
    if (f) f.addEventListener("submit", e => {
      e.preventDefault();
      if (fnv(root.querySelector("#pwi").value.trim().toLowerCase()) === PW_HASH) ansichtSetzen(ziel);
      else { toast("Passwort falsch"); root.querySelector("#pwi").value = ""; }
    });
  }
  // ---------------------------------------------------------------- Push
  const pushMoeglich = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const istIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const installiert = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  function pushHTML() {
    const wer = store.mode === "live" ? S.profil.name.split(" ")[0] : "dich";
    const info = `<p class="hint" style="margin:0">Meldung aufs Handy für ${esc(wer)}: neue Abschlüsse im Team, „Zahlung eingegangen – Provision fällig“ und neue Termine mit dir.</p>`;
    if (istIOS() && !installiert()) return info + `<p class="hint">Auf dem iPhone geht das nur mit installierter App: Teilen → „Zum Home-Bildschirm“, App von dort öffnen und hier aktivieren (ab iOS 16.4).</p>`;
    if (!pushMoeglich()) return info + `<p class="hint">Dieser Browser unterstützt keine Benachrichtigungen.</p>`;
    if (Notification.permission === "denied") return info + `<p class="hint">Benachrichtigungen sind blockiert. In den Handy-Einstellungen für diese App erlauben.</p>`;
    const an = lsGet("infinero-push") === "an" && Notification.permission === "granted";
    return info + `<div class="actions">${an ? `<span class="pill ok">Aktiv auf diesem Gerät</span><button class="btn small" type="button" id="pushaus">Ausschalten</button>` : `<button class="btn primary" type="button" id="pushan">Benachrichtigungen aktivieren</button>`}</div>`;
  }
  const b64 = s => { const p = "=".repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  async function pushAktivieren() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return toast("Ohne Erlaubnis keine Benachrichtigungen.");
      const reg = await navigator.serviceWorker.ready;
      if (store.mode === "demo") {
        lsSet("infinero-push", "an");
        await reg.showNotification("Neuer Abschluss", { body: "Elektriker Meyer (Beispiel): PAKET-3 · Setup 2.370,00 € – gemeldet von Elias", icon: "icons/icon-192.png" });
        return toast("Test-Benachrichtigung gesendet (Demo)");
      }
      const key = await store.pushSchluessel();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const j = sub.toJSON();
      await store.pushAbo({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, geraet: navigator.userAgent.slice(0, 120) });
      lsSet("infinero-push", "an"); toast("Benachrichtigungen aktiv");
    } catch (e) { console.error(e); toast("Aktivieren hat nicht geklappt – ist die Push-Funktion in Supabase eingerichtet?"); }
  }
  async function pushDeaktivieren() {
    try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) { await store.pushAbmelden(sub.endpoint); await sub.unsubscribe(); } } catch (e) { console.error(e); }
    lsSet("infinero-push", "aus"); toast("Benachrichtigungen aus");
  }

  function ansichtSetzen(k) {
    S.view = S.team.find(m => m.kuerzel === k) || S.view; store.setAnsicht(S.view.kuerzel); lsSet(ANSICHT_KEY, S.view.kuerzel);
    S.data = {}; S.filter = "offen"; S.tab = "heute"; kopf(); schliessen(false); zeige();
    toast("Ansicht: " + S.view.name);
  }
  function kopf() {
    $("#me").textContent = S.view.name.split(" ")[0] + " · " + S.view.kuerzel; $("#me").hidden = false; $("#theme").hidden = false;
    $("#sub").textContent = inhaber() ? "Cockpit · Termine · Abschlüsse" : "Anrufen · Termine · Abschlüsse";
  }
  const aktuellesTheme = () => document.documentElement.dataset.theme || "dark";
  function setTheme(th) {
    document.documentElement.dataset.theme = th; lsSet(THEME_KEY, th);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = th === "dark" ? "#0D1218" : "#EEF1F5";
  }

  // ---------------------------------------------------------------- Events
  document.addEventListener("click", async e => {
    const bar = e.target.closest("[data-bar]");
    if (bar) { const r = (S.data.statTage || []).find(x => x.tag === bar.dataset.bar); const d = $("#bardetail");
      if (r && d) d.textContent = `${new Date(r.tag + "T12:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}: ${r.anrufe} Anrufe · ${r.erreicht} erreicht · ${r.infos} Infos · ${r.termine} Termine · ${r.abschluesse} Abschlüsse`; return; }
    const t = e.target.closest("button,[data-open],label"); if (!t) return;
    const ds = t.dataset, id = ds.id ? +ds.id : null;
    if (ds.tab) { window.scrollTo(0, 0); return zeige(ds.tab); }
    if (ds.filter) { S.filter = ds.filter; return zeige(); }
    if (ds.open) return detail(+ds.open);
    if (t.hasAttribute("data-close")) { if (ds.back) return detail(+ds.back); return schliessen(); }
    if (ds.oc) {
      if (ds.oc === "nicht" || ds.oc === "kein") { const imSheet = !!t.closest(".sheet"); if (imSheet) schliessen(false); await schnell(id, ds.oc); if (imSheet) zeige(); return; }
      if (ds.oc === "info") return infoSheet(id);
      if (ds.oc === "ja") return interesseSheet(id, "termin");
      if (ds.oc === "rueckruf") return interesseSheet(id, "rueckruf");
    }
    if (ds.prod) { t.setAttribute("aria-pressed", String(t.getAttribute("aria-pressed") !== "true")); return; }
    if (ds.mit) { t.setAttribute("aria-pressed", String(t.getAttribute("aria-pressed") !== "true")); return; }
    if (ds.deal) return dealSheet(+ds.deal);
    if (ds.zusage) return zusageSheet(+ds.zusage);
    if (ds.demoinfo) return demoSheet(+ds.demoinfo);
    if (ds.auftrag) return auftragSheet(+ds.auftrag);
    if (ds.setstatus) { try { await store.leadUpdate(id, { status: ds.setstatus, wiedervorlage: naechsterWerktag(3, 10).toISOString(), naechster_schritt: "Nachfassen Angebot" }); await store.aktivitaet({ lead_id: id, typ: "status", ergebnis: ds.setstatus }); toast("Status: Angebot"); detail(id); } catch (err) { fehler(err); } return; }
    if (ds.sperren) { try { await store.leadUpdate(+ds.sperren, { gesperrt: true, wiedervorlage: null }); await store.aktivitaet({ lead_id: +ds.sperren, typ: "status", text: "Keine Werbung gewünscht – gesperrt" }); toast("Gesperrt"); detail(+ds.sperren); } catch (err) { fehler(err); } return; }
    if (ds.askdel) { $("#delwrap").innerHTML = `<div class="confirm">Lead endgültig löschen? <button class="btn danger small" type="button" data-dodel="${ds.askdel}">Ja, löschen</button><button class="btn small" type="button" data-nodel="${ds.askdel}">Abbrechen</button></div>`; return; }
    if (ds.nodel) { $("#delwrap").innerHTML = `<button class="btn danger small" type="button" data-askdel="${ds.nodel}">Lead löschen</button>`; return; }
    if (ds.dodel) { try { await store.leadLoeschen(+ds.dodel); schliessen(); toast("Gelöscht"); } catch (err) { fehler(err); } return; }
    if (ds.terminok || ds.terminab) { try { await store.terminUpdate(+(ds.terminok || ds.terminab), { status: ds.terminok ? "erledigt" : "abgesagt" }); toast(ds.terminok ? "Termin erledigt" : "Termin abgesagt"); zeige(); } catch (err) { fehler(err); } return; }
    if (ds.pay || ds.payout) { try { await store.dealUpdate(+(ds.pay || ds.payout), { [ds.pay ? "zahlung_eingegangen" : "provision_ausgezahlt"]: isoDate(new Date()) }); toast("Eingetragen"); zeige(); } catch (err) { fehler(err); } return; }
    if (ds.infomail) return infoMailSheet(+ds.infomail);
    if (ds.mailok) { try { await store.leadUpdate(+ds.mailok, { info_mail: "gesendet" }); await store.aktivitaet({ lead_id: +ds.mailok, typ: "mail", text: "Info-Mail gesendet" }); toast("Als gesendet markiert"); schliessen(); } catch (err) { fehler(err); } return; }
    if (ds.demo) { try { await store.leadUpdate(id, { demo_website: ds.demo }); toast("Demo-Website: " + (ds.demo === "fertig" ? "fertig" : "in Arbeit")); zeige(); } catch (err) { fehler(err); } return; }
    if (ds.copy) { try { await navigator.clipboard.writeText(ds.copy); toast("Kopiert"); } catch (err) { toast(ds.copy); } return; }
    if (t.id === "more") { if (S.loadingMore) return; S.loadingMore = true; t.disabled = true; try { const n = await store.nachladen(schritt()); toast(n ? `${n} weitere Leads geladen` : "Der Pool ist gerade leer – Nachschub kommt über Nacht."); await zeige(); } catch (err) { fehler(err); } S.loadingMore = false; return; }
    if (t.id === "fab") return neuerLead();
    if (t.id === "me") return profilSheet();
    if (t.id === "theme") return setTheme(aktuellesTheme() === "dark" ? "light" : "dark");
    if (t.id === "csvout") return csvExport();
    if (t.id === "statcsv") return statCSV();
    if (ds.stat) { S.stat[ds.stat] = ds.wert; return zeige(); }
  });
  document.addEventListener("submit", async e => {
    if (e.target.id === "fokusf") { e.preventDefault(); try { await store.setFokus($("#fk").value, $("#fkauto").checked); S.cfg = await store.vertriebConfig(); toast("Wochenfokus gespeichert"); zeige(); } catch (err) { fehler(err); } }
    if (e.target.id === "terminf") { e.preventDefault(); try { await store.setTerminLink($("#tl").value.trim()); S.cfg = await store.vertriebConfig(); toast("Termin-Link gespeichert"); } catch (err) { fehler(err); } }
    if (e.target.id === "demof") { e.preventDefault(); try { for (const i of e.target.querySelectorAll("[data-demo-url]")) await store.setDemoUrl(i.dataset.demoUrl, i.value.trim()); S.zg = await store.zielgruppen(); toast("Demo-Links gespeichert"); } catch (err) { fehler(err); } }
  });
  document.addEventListener("change", e => { if (e.target.id === "csvin" && e.target.files[0]) csvImport(e.target.files[0]); });
  let qT; document.addEventListener("input", e => { if (e.target.id === "q") { S.q = e.target.value; clearTimeout(qT); qT = setTimeout(async () => { const pos = e.target.selectionStart; await zeige(); const q = $("#q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } }, 300); } });

  // ---------------------------------------------------------------- Login & Start
  function login(hinweis) {
    $("#tabs").hidden = true; $("#fab").hidden = true; $("#me").hidden = true;
    $("#view").innerHTML = `<div class="login"><h1>Anmelden</h1>
      ${hinweis ? `<div class="banner">${esc(hinweis)}</div>` : ""}
      <form id="lf" class="form"><div class="field full"><label for="le">E-Mail</label><input id="le" type="email" inputmode="email" autocomplete="username" required></div>
      <div class="field full"><label for="lp">Passwort</label><input id="lp" type="password" autocomplete="current-password" required></div>
      <div class="full"><button class="btn primary block" type="submit">Anmelden</button></div></form>
      <p class="hint">Passwort vergessen? Kurz bei Ziu melden – er setzt es zurück.</p></div>`;
    $("#lf").addEventListener("submit", async e => {
      e.preventDefault();
      try { await store.anmelden($("#le").value.trim(), $("#lp").value); start(); }
      catch (err) { toast("E-Mail oder Passwort stimmt nicht."); }
    });
  }
  async function start() {
    let p; try { p = await store.session(); } catch (e) { fehler(e); }
    if (!p) return login();
    if (p.ohneZugang) { await store.signOut(); return login(`Für ${p.email} ist noch kein Zugang eingerichtet. Bitte Ziu Bescheid geben.`); }
    S.profil = p; S.team = await store.team();
    try { [S.zg, S.cfg] = await Promise.all([store.zielgruppen(), store.vertriebConfig()]); } catch (e) { console.warn(e); S.zg = []; S.cfg = null; }
    const gespeichert = lsGet(ANSICHT_KEY);
    const start = darfWechseln() && S.team.some(m => m.kuerzel === gespeichert) ? gespeichert : (store.mode === "demo" ? "EF" : p.kuerzel);
    S.view = S.team.find(m => m.kuerzel === start) || S.team.find(m => m.kuerzel === p.kuerzel) || { ...p };
    store.setAnsicht(S.view.kuerzel); kopf();
    if (store.mode === "demo") $("#banner").innerHTML = `<div class="banner">Demo-Modus: Beispieldaten nur auf diesem Gerät. Ansicht wechseln über den Namen oben rechts.</div>`;
    const h = location.hash.slice(1), erlaubt = ["heute", "leads", "termine", "auftraege", "deals", "statistik", ...(inhaber() ? ["cockpit"] : [])];
    zeige(erlaubt.includes(h) ? h : h === "prov" ? "deals" : "heute");
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
  start();
})();
