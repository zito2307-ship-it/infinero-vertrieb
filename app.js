/* INFINERO Vertrieb – App */
(function () {
  "use strict";

  // ---------------------------------------------------------------- Stammdaten
  const PRODUKTE = [
    { code: "PAKET-1", name: "Stufe 1 · Website „Sichtbar“", setup: 1490, monat: 99 },
    { code: "PAKET-2", name: "Stufe 2 · + Web-Chatbot", setup: 2180, monat: 159 },
    { code: "PAKET-3", name: "Stufe 3 · + Messaging-Bot", setup: 2870, monat: 239 },
    { code: "PAKET-4", name: "Stufe 4 · + KI-Caller", setup: 3860, monat: 439 },
    { code: "WEBSITE", name: "Website „Sichtbar“ (einzeln)", setup: 1490, monat: 99 },
    { code: "WEBCHAT", name: "Web-Chatbot (einzeln)", setup: 690, monat: 79 },
    { code: "MSGBOT", name: "Messaging-Bot je Kanal", setup: 690, monat: 99 },
    { code: "KICALLER", name: "KI-Caller (einzeln)", setup: 990, monat: 249 },
    { code: "UPGRADE-2", name: "Upgrade Stufe 1 → 2", setup: 690, monat: 60 },
    { code: "UPGRADE-3", name: "Upgrade Stufe 2 → 3", setup: 690, monat: 80 },
    { code: "UPGRADE-4", name: "Upgrade Stufe 3 → 4", setup: 990, monat: 200 },
  ];
  // Anzeigename eines Auftrags: bei individuellem Angebot die eigene Bezeichnung, sonst der Katalogname
  const pname = a => a.bezeichnung || (PRODUKTE.find(p => p.code === a.produkt) || {}).name || a.produkt;
  // „Für später“: Produkte, die wir noch nicht aktiv verkaufen – Leads landen im Pool je Produkt statt in der Wiedervorlage
  const SPAETER = [["KICALLER", "KI-Caller"], ["MSGBOT", "WhatsApp-/Messenger-Bot"], ["WEBCHAT", "Web-Chatbot"]];
  const spaeterName = c => (SPAETER.find(x => x[0] === c) || [c, c])[1];
  const INTERESSE = [["WEBSITE", "Website"], ["WEBCHAT", "Web-Chatbot"], ["MSGBOT", "WhatsApp/Messenger-Bot"], ["KICALLER", "KI-Caller"]];
  const STATUS = {
    neu: ["Neu", "accent"], nicht_erreicht: ["Nicht erreicht", ""], rueckruf: ["Rückruf", "warn"],
    info_angefragt: ["Infos angefragt", "accent"], interesse: ["Interesse", "ok"], termin: ["Termin", "ok"],
    angebot: ["Angebot", "warn"], gewonnen: ["Kunde", "ok"], kein_interesse: ["Kein Interesse", "bad"], kein_kontakt: ["Nicht erreichbar", "bad"],
    vorgemerkt: ["Für später", "accent"], angeschrieben: ["Angeschrieben", "accent"],
  };
  const MAX_VERSUCHE = 5;
  const SIGNATUR = ["Websites · Google-Sichtbarkeit · KI-Infrastruktur für Unternehmen"];
  // Kontakt nach außen (Mails, Signatur, Terminlink) ist immer der Inhaber – Vertriebler erscheinen nicht öffentlich
  const tippName = id => ((S.partner || []).find(p => p.tippgeber_id === id) || {}).name || id;
  const aussen = () => (store.mode === "live" && S.team.find(t => t.rolle === "inhaber")) || { kuerzel: "INH", name: "Ziu Tonndorf", telefon: null, termin_link: null };
  // Text-Signatur (Mail-App). Beim Senden über die App macht mailsenden daraus eine gestaltete Signatur im INFINERO-Look.
  const signatur = ab => ["Viele Grüße", "", ab.name, "Inhaber · INFINERO", ...SIGNATUR, "",
    ab.telefon ? "Tel. " + ab.telefon : "", "kontakt@infinero.de · infinero.de", "Closewitzer Straße 19 · 07743 Jena"].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");
  const MAILTEXT = {
    WEBSITE: ["moderne Website", "fürs Handy gemacht und so aufgebaut, dass man Sie findet – bei Google, auf Google Maps und in KI-Assistenten wie ChatGPT, mit Online-Terminanfrage", 1490, 99],
    WEBCHAT: ["Web-Chatbot", "beantwortet Fragen auf Ihrer Website rund um die Uhr", 690, 79],
    MSGBOT: ["WhatsApp-Bot (je Kanal)", "antwortet automatisch auf Nachrichten und vereinbart Termine", 690, 99],
    KICALLER: ["KI-Telefonassistent", "nimmt Anrufe an, wenn gerade niemand rangehen kann", 990, 249],
  };
  const LEITER_MAIL = [[["WEBSITE", "WEBCHAT"], 2180, 159], [["WEBSITE", "WEBCHAT", "MSGBOT"], 2870, 239], [["WEBSITE", "WEBCHAT", "MSGBOT", "KICALLER"], 3860, 439]];
  // Ausweich-Vorlage, falls Claude nicht erreichbar ist (Normalfall: Claude schreibt die ganze Mail, Edge Function infomail)
  const VORLAGEN = {
    gastro: { betreff: "Wie besprochen – Ihre Infos von INFINERO",
      nutzen: "Gerade im Service kann oft niemand ans Telefon – und genau dann gehen Reservierungen verloren. Das würden wir Ihnen gern abnehmen." },
    beauty: { betreff: "Wie besprochen – Ihre Infos von INFINERO",
      nutzen: "Viele Anfragen kommen genau dann, wenn Sie gerade bei einer Kundin sind oder längst Feierabend haben. Damit trotzdem keine verloren geht, würden wir Ihnen gern etwas Arbeit abnehmen." },
    handwerk: { betreff: "Wie besprochen – Ihre Infos von INFINERO",
      nutzen: "Wer auf der Baustelle steht, kann nicht ans Telefon – und Anfragen landen dann schnell beim Nächsten. Genau da setzen wir an." },
    allgemein: { betreff: "Wie besprochen – Ihre Infos von INFINERO",
      nutzen: "Kurz gesagt: Wir sorgen dafür, dass man Sie online gut findet und unkompliziert erreicht – und nehmen Ihnen dabei so viel Arbeit wie möglich ab." },
  };
  // Anrede ohne geratenes Geschlecht: „Hallo Herr/Frau …“ nur wenn angegeben, sonst Titel oder voller Name
  function anrede(l) {
    const a = String(l.ansprechpartner || "").trim();
    if (/^(herr|frau)\s/i.test(a)) return `Hallo ${a},`;
    const dr = /\bDr\.?\s/.test(`${a} ${l.firma || ""}`) && a ? a.split(/\s+/).pop() : null;
    if (dr) return `Guten Tag Dr. ${dr},`;
    return a ? `Guten Tag ${a},` : "Guten Tag,";
  }
  const SATZ_V = 0.5, SATZ_T = 0.25;
  const ART = { vor_ort: "Vor Ort", telefon: "Telefon", video: "Video" };

  // ---------------------------------------------------------------- Kanäle (Telefon · E-Mail · Vor Ort)
  // Jeder zugeteilte Lead gehört zu einem Kanal (leads.kanal); „Heute“ zeigt je Kanal eine eigene Liste.
  const KANAELE = [["telefon", "Telefon"], ["email", "E-Mail"], ["vor_ort", "Vor Ort"]];
  const KANAL_TYP = { telefon: "anruf", email: "mail", vor_ort: "besuch" };   // Aktivitätstyp je Kanal (Statistik zählt nur „anruf“ als Anruf)
  const KANAL_KEY = "infinero-kanal", VO_MAX = 2;                             // nach 2× nicht angetroffen → ans Telefon
  const kanalVon = l => (l && l.kanal) || "telefon";
  // E-Mails schreibt nur der Inhaber (Ziu) – Vertriebler sehen weder den E-Mail-Kanal noch Mail-Knöpfe
  const mailErlaubt = () => !!(S.profil && S.profil.rolle === "inhaber");
  const kanaele = () => KANAELE.filter(([k]) => k !== "email" || mailErlaubt());

  // Nächster Schritt: feste Auswahl (+ eigener Text in den Details)
  const SCHRITTE = ["Anrufen", "Rückruf", "Nochmal vorbeischauen", "Termin vereinbaren", "Infos per Mail schicken", "Demo bauen",
    "Mit Demo vorbeigehen", "Angebot schicken", "Zusage einholen", "Website erstellen", "Nachfassen"];
  function schrittWahl(l) {
    const ist = l.naechster_schritt || "";
    return `<label class="ns"><span>Nächster Schritt</span><select data-ns="${l.id}" aria-label="Nächster Schritt für ${esc(l.firma)}">
      <option value="">– wählen –</option>${ist && !SCHRITTE.includes(ist) ? `<option selected>${esc(ist)}</option>` : ""}${SCHRITTE.map(x => `<option${x === ist ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`;
  }

  // Erstkontakt per Mail: freundlich-seriös, ehrlich, ohne Preise. Versand nur einzeln und von Hand aus der Mail-App.
  const ERSTMAIL = {
    gastro: { gruppe: "Restaurants und Cafés", lob: "Ihre Gäste bewerten Sie sehr gut",
      warum: "Gerade beim Essengehen entscheiden Gäste oft spontan am Handy: Was gibt es, wann ist geöffnet, ist noch ein Tisch frei? Wer das nicht schnell findet, landet beim Nachbarn.",
      website: "eine Website mit Speisekarte, Öffnungszeiten und Reservierungsanfrage, die auch auf dem Handy schnell lädt",
      wer: "Ihr Restaurant", dinge: "neue Karte, Urlaub, Events", schluss: "" },
    beauty: { gruppe: "Studios und Salons", lob: "Ihre Kundinnen bewerten Sie hervorragend",
      warum: "Neue Kundinnen informieren sich zuerst online: Wie sieht das Studio aus, welche Behandlungen gibt es, kann ich direkt einen Termin anfragen? Instagram hilft – bei Google taucht man damit allein aber kaum auf.",
      website: "eine Website mit Ihren Behandlungen, Bildern und Online-Terminanfrage, die auch auf dem Handy schnell lädt – Anfragen kommen auch dann rein, wenn Sie gerade bei einer Kundin sind",
      wer: "Ihr Studio", dinge: "neue Behandlungen, Urlaub, Aktionen", schluss: "" },
    handwerk: { gruppe: "Handwerksbetriebe", lob: "Ihre Kunden bewerten Sie sehr gut",
      warum: "Wer heute einen Handwerker sucht, schaut zuerst online: Was macht der Betrieb, gibt es Referenzen, wie erreiche ich ihn? Wer dort überzeugt, bekommt den Anruf.",
      website: "eine Website mit Ihren Leistungen, Referenzfotos und Anfrageformular, die auch auf dem Handy schnell lädt – Anfragen kommen auch rein, während Sie auf der Baustelle stehen",
      wer: "Ihr Betrieb", dinge: "neue Projekte, Stellenanzeigen, Betriebsurlaub", schluss: " – dauert keine zehn Minuten, auch zwischen zwei Baustellen" },
  };
  ERSTMAIL.allgemein = { ...ERSTMAIL.handwerk, gruppe: "Betriebe", lob: "Ihre Kunden bewerten Sie sehr gut", wer: "Ihr Betrieb", dinge: "Öffnungszeiten, Urlaub, Neuigkeiten", schluss: "" };
  function befundSatz(l) {
    const b = String(l.website_befund || "");
    if (!l.website || l.website_bewertung === "keine") return "Eine eigene Website habe ich allerdings nicht gefunden.";
    if (l.website_bewertung === "veraltet") {
      if (/Handy/.test(b)) return "Ihre Website lässt sich auf dem Handy allerdings nur schwer bedienen.";
      if (/nicht erreichbar/.test(b)) return "Ihre Website war allerdings gerade nicht erreichbar.";
      return "Ihre Website wirkt allerdings schon etwas in die Jahre gekommen.";
    }
    return "Bei Ihrem Online-Auftritt sehe ich allerdings noch einiges an Potenzial.";
  }
  // Demo-Link je Lead: mit ?d=<demo_code> meldet die Demo-Seite den Aufruf („schaut gerade die Demo an“).
  // persoenlich = false für Links, die wir selbst öffnen (z. B. „Demo zeigen“ vor Ort).
  const demoVon = (l, persoenlich = true) => {
    const z = (S.zg || []).find(x => x.id === l.zielgruppe), url = (z && z.demo_url) || "https://infinero.de/demo";
    return persoenlich && l.demo_code ? url + (url.includes("?") ? "&" : "?") + "d=" + l.demo_code : url;
  };
  const kalenderLink = () => aussen().termin_link || (S.cfg && S.cfg.termin_link);
  function erstMail(l) {
    const v = ERSTMAIL[l.zielgruppe] || ERSTMAIL.allgemein, ab = aussen(), link = kalenderLink();
    const gut = +l.bewertung_google >= 4.3;
    const text = [
      anrede(l),
      `beim Blick auf Google ist mir ${l.firma} aufgefallen${gut ? ` – ${v.lob}` : ""}. ${befundSatz(l)} ${v.warum}`,
      `Mein Name ist ${ab.name}, mit INFINERO aus Jena betreue ich ${v.gruppe} in der Region rund um Website und Google-Auftritt. Wie das für einen Betrieb wie Ihren aussehen kann, sehen Sie hier:\n${demoVon(l)}`,
      `Was Sie davon hätten:\n– ${v.website}\n– Sie werden bei Google, auf Google Maps und auch in ChatGPT & Co. gefunden\n– ich kümmere mich dauerhaft darum, dass ${v.wer} gesehen wird: Google-Eintrag, ${v.dinge} – eine kurze Nachricht an mich genügt, Sie haben damit keine Arbeit.`,
      "Und bevor Sie jetzt schon den Taschenrechner zücken: Das Ganze ist deutlich günstiger, als die meisten vermuten.",
      `Gern erstelle ich Ihnen vorab einen kostenlosen und unverbindlichen Entwurf für ${l.firma} – dann haben Sie etwas Konkretes vor Augen. Oder wir telefonieren kurz und sprechen in Ruhe darüber${v.schluss}.`,
      link ? `Damit Sie wissen, wann ich Zeit habe, habe ich Ihnen hier meinen Kalender hinterlegt:\n${link}\nAlternativ antworten Sie einfach auf diese Mail.` : "Antworten Sie einfach kurz auf diese Mail, dann melde ich mich bei Ihnen.",
      signatur(ab),
      "PS: Falls das für Sie gerade kein Thema ist, genügt eine kurze Antwort – dann melde ich mich nicht wieder.",
    ];
    return { betreff: `${l.firma}: eine kurze Idee zu Ihrem Auftritt bei Google`, text: text.join("\n\n") };
  }
  function nachfassMail(l) {
    const ab = aussen(), link = kalenderLink();
    const text = [
      anrede(l),
      "ich wollte kurz nachhaken, ob meine Nachricht von letzter Woche angekommen ist – im Tagesgeschäft geht so etwas ja schnell unter.",
      `Hier noch einmal das Beispiel:\n${demoVon(l)}`,
      `Mein Angebot steht: Ich erstelle Ihnen gern einen kostenlosen Entwurf für ${l.firma}. Oder ich rufe Sie in den nächsten Tagen kurz an.${link ? ` Wenn Sie lieber selbst einen Zeitpunkt wählen:\n${link}` : ""}`,
      "Falls es kein Thema ist, genügt eine kurze Antwort – dann bin ich raus.",
      signatur(ab),
    ];
    return { betreff: "Re: " + erstMail(l).betreff, text: text.join("\n\n") };
  }

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
  // Google-Maps-Eintrag: genau über die Place-ID (neue Leads), sonst Suche nach Firma + Adresse
  const mapsHref = l => {
    const q = encodeURIComponent([l.firma, l.strasse, [l.plz, l.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "));
    return `https://www.google.com/maps/search/?api=1&query=${q}` + (l.place_id ? `&query_place_id=${encodeURIComponent(l.place_id)}` : "");
  };
  const sterne = l => l.bewertung_google ? ` ★ ${String(l.bewertung_google).replace(".", ",")}${l.bewertungen ? ` (${l.bewertungen})` : ""}` : "";
  const mapsLink = l => `<a class="web" href="${esc(mapsHref(l))}" target="_blank" rel="noopener">Google Maps${esc(sterne(l))} ↗</a>`;
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
  const name = k => (S.team.find(t => t.kuerzel === k) || {}).name || ({ WEB: "Website", CAL: "Cal.com" })[k] || k;

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
      <div class="meta">${l.tippgeber ? `<span class="pill ok">Empfehlung: ${esc(tippName(l.tippgeber))}</span>` : (l.quelle || "").startsWith("Website:") ? `<span class="pill accent">Website-Anfrage</span>` : ""}${l.branche ? `<span>${esc(l.branche)}</span>` : ""}${l.ort ? `<span>${esc(l.ort)}</span>` : ""}${l.versuche ? `<span>Versuch ${l.versuche + 1}</span>` : ""}${wv ? `<span class="${wv < new Date() ? "due" : ""}">${istHeute(l.wiedervorlage) ? "heute " + hhmm(wv) : dDE(l.wiedervorlage) + " " + hhmm(wv)}</span>` : ""}${l.status !== "neu" ? web : ""}</div>
      ${schrittWahl(l)}
      ${l.demo_gesehen_am ? `<div class="meta">${demoGesehen(l)}</div>` : ""}
      ${l.website_befund && ["veraltet", "unklar"].includes(l.website_bewertung) ? `<div class="befund">${esc(l.website_befund)}</div>` : ""}
      ${(() => { const z = (S.zg || []).find(x => x.id === l.zielgruppe); return z && z.demo_url ? `<div class="demo"><span>Demo ${esc(z.name)}:</span> <a href="${esc(z.demo_url)}" target="_blank" rel="noopener">${esc(z.demo_url.replace(/^https?:\/\//, ""))}</a> <button class="btn small" type="button" data-copy="${esc(demoVon(l))}">Link kopieren</button></div>` : ""; })()}
      ${l.telefon ? `<div class="call"><a class="tel" href="${esc(telHref(l.telefon))}"><svg viewBox="0 0 24 24">${ICON.tel}</svg>${esc(l.telefon)}</a>${l.website ? webLink(l.website) : ""}${mapsLink(l)}</div>` : `<div class="meta"><span class="due">Keine Telefonnummer</span>${l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : ""}${l.website ? webLink(l.website) : ""}</div>`}
      <div class="outcomes">
        <button class="oc n" type="button" data-oc="nicht" data-id="${l.id}">Nicht erreicht</button>
        <button class="oc k" type="button" data-oc="kein" data-id="${l.id}">Kein Interesse</button>
        <button class="oc i" type="button" data-oc="info" data-id="${l.id}">Infos per Mail</button>
        <button class="oc y" type="button" data-oc="ja" data-id="${l.id}">Interesse</button>
      </div>
      <div class="sub"><button type="button" data-oc="rueckruf" data-id="${l.id}">Rückruf vereinbaren</button><button type="button" data-spaeter="${l.id}" data-anruf="1">Für später</button><button type="button" data-open="${l.id}">Details</button></div>
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
  const kanal = () => { if (!S.kanal || !kanaele().some(k => k[0] === S.kanal)) { const g = lsGet(KANAL_KEY); S.kanal = kanaele().some(k => k[0] === g) ? g : "telefon"; } return S.kanal; };
  async function viewHeute() {
    if (!S.data.startGeladen && eigeneAnsicht() || !S.data.startGeladen && store.mode === "demo") { S.data.startGeladen = true; try { const n = await store.tageslisteStart(); if (n) toast(`${n} neue Leads für heute zugeteilt`); } catch (e) { console.warn(e); } }
    const h = await store.heute(); S.data.heute = h;
    const k = kanal(), imKanal = l => kanalVon(l) === k;
    const anzahl = kk => h.faellig.filter(l => kanalVon(l) === kk).length + h.neue.filter(l => kanalVon(l) === kk).length;
    const umschalter = `<div class="seg kanal" role="group" aria-label="Kanal wählen">${kanaele().map(([id, t]) => `<button type="button" data-kanal="${id}" aria-pressed="${k === id}">${t}${anzahl(id) ? `<small>${anzahl(id)}</small>` : ""}</button>`).join("")}</div>`;
    const faellig = h.faellig.filter(imKanal), neue = h.neue.filter(imKanal);
    const termine = `<h2 class="sec">Termine heute <span class="n">${h.termine.length}</span></h2>
      <div class="list">${h.termine.length ? h.termine.map(terminCard).join("") : `<div class="empty">Heute keine Termine.</div>`}</div>`;
    if (k === "email") return umschalter + viewMail(h, faellig, neue, termine);
    if (k === "vor_ort") return umschalter + viewVorOrt(h, faellig, neue, termine);
    const ziel = S.view.tagesziel ?? 100;
    S.data.anrufeHeute = h.anrufe || 0; const heuteAnrufe = S.data.anrufeHeute;
    const fokus = (S.zg || []).find(z => z.id === (new Date().getDay() === 1 ? "handwerk" : (S.cfg || {}).fokus));
    const zielAnrufe = S.view.rolle === "inhaber" ? 0 : 100;
    return umschalter + `
      <div class="spruch"><span class="lbl">Spruch des Tages</span><p>${esc(spruchDesTages())}</p></div>
      ${fokus ? `<div class="fokus"><span>${new Date().getDay() === 1 ? "Montag" : "Diese Woche"}:</span> <b>${esc(fokus.name)}</b>${fokus.anrufzeit ? `<span class="meta">${esc(fokus.anrufzeit)}</span>` : ""}</div>` : ""}
      ${zielAnrufe ? `<div class="ziel"><div class="kv"><span>Anrufe heute</span><b class="money"><span id="kpiCalls">${heuteAnrufe}</span> / ${zielAnrufe}</b></div><div class="bar"><i id="zielbar" style="width:${Math.min(100, heuteAnrufe / zielAnrufe * 100)}%"></i></div></div>` : ""}
      <div class="kpis"><div><span>Termine</span><b>${h.termine.length}</b></div><div><span>Wiedervorlagen</span><b>${faellig.length}</b></div><div><span>Neue Leads</span><b>${neue.length}</b></div><div><span>${zielAnrufe ? "Noch offen" : "Anrufe heute"}</span><b>${zielAnrufe ? Math.max(0, zielAnrufe - heuteAnrufe) : heuteAnrufe}</b></div></div>
      ${termine}
      <h2 class="sec">Wiedervorlagen &amp; Rückrufe <span class="n">${faellig.length}</span></h2>
      <div class="list" id="listFaellig">${faellig.length ? faellig.map(l => callCard(l, { prio: true })).join("") : `<div class="empty">Nichts fällig.</div>`}</div>
      <h2 class="sec">Neue Leads <span class="n">${neue.length}${ziel ? " · Tagesziel " + ziel : ""}</span></h2>
      ${(() => { // Filter nach Zielgruppe, sobald mehrere in der Liste sind (z. B. nach „Leads laden“ für einen Beauty-Block)
        const da = (S.zg || []).filter(z => neue.some(l => l.zielgruppe === z.id));
        if (da.length < 2) { S.neuFilter = null; return ""; }
        if (S.neuFilter && !da.some(z => z.id === S.neuFilter)) S.neuFilter = null;
        return `<div class="chips scroll" style="margin-bottom:8px"><button class="chip" type="button" data-neufilter="" aria-pressed="${!S.neuFilter}">Alle ${neue.length}</button>${da.map(z => `<button class="chip" type="button" data-neufilter="${z.id}" aria-pressed="${S.neuFilter === z.id}">${esc(z.name)} ${neue.filter(l => l.zielgruppe === z.id).length}</button>`).join("")}</div>`; })()}
      ${(() => { const liste = S.neuFilter ? neue.filter(l => l.zielgruppe === S.neuFilter) : neue;
        return `<div class="list" id="listNeu">${liste.length ? liste.map(l => callCard(l)).join("") : `<div class="empty">Keine neuen Leads mehr in deiner Liste.</div>`}</div>`; })()}
      <button class="btn block more" type="button" id="more">+ Leads laden</button>
      <p class="hint">Nicht bearbeitete Leads bleiben in deiner Liste und stehen morgen wieder hier.</p>`;
  }

  const schritt = () => (inhaber() ? 10 : 20);

  // „Schaut gerade die Demo an“: Hinweis auf der Karte, sobald der persönliche Demo-Link geöffnet wurde
  const demoGesehen = l => l.demo_gesehen_am ? `<span class="pill ok">👀 Demo angesehen ${istHeute(l.demo_gesehen_am) ? "heute " + hhmm(new Date(l.demo_gesehen_am)) : dDE(l.demo_gesehen_am)}${l.demo_aufrufe > 1 ? ` · ${l.demo_aufrufe}×` : ""}</span>` : "";

  // ---------------------------------------------------------------- Kanal E-Mail
  function mailCard(l, opts = {}) {
    const wb = !l.website ? WEB.keine : WEB[l.website_bewertung];
    const wv = l.wiedervorlage ? new Date(l.wiedervorlage) : null, nach = l.status === "angeschrieben";
    return `<article class="card${opts.prio ? " prio" : ""}" data-card="${l.id}">
      <div class="head"><h3><button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3>${nach ? `<span class="pill accent">Angeschrieben</span>` : wb ? `<span class="pill ${wb[1]}">${wb[0]}</span>` : ""}</div>
      <div class="meta">${l.branche ? `<span>${esc(l.branche)}</span>` : ""}${l.ort ? `<span>${esc(l.ort)}</span>` : ""}${l.bewertung_google ? `<span>★ ${esc(String(l.bewertung_google).replace(".", ","))}${l.bewertungen ? ` (${l.bewertungen})` : ""}</span>` : ""}${wv ? `<span class="${wv < new Date() ? "due" : ""}">${istHeute(l.wiedervorlage) ? "heute" : dDE(l.wiedervorlage)}</span>` : ""}</div>
      ${schrittWahl(l)}
      ${l.demo_gesehen_am ? `<div class="meta">${demoGesehen(l)}</div>` : ""}
      ${l.website_befund && l.website_bewertung === "veraltet" ? `<div class="befund">${esc(l.website_befund)}</div>` : ""}
      <div class="call"><span class="mailadr">✉️ ${esc(l.email || "keine Adresse")}</span>${l.website ? webLink(l.website) : ""}${mapsLink(l)}</div>
      ${nach ? `<div class="outcomes">
        <button class="oc k" type="button" data-oc="kein" data-id="${l.id}">Kein Interesse</button>
        <button class="oc n" type="button" data-zutelefon="${l.id}">Anrufen</button>
        <button class="oc i" type="button" data-erstmail="${l.id}" data-art="nachfass">Nachfass-Mail</button>
        <button class="oc y" type="button" data-oc="ja" data-id="${l.id}">Antwort: Interesse</button></div>`
      : `<div class="outcomes drei">
        <button class="oc n" type="button" data-zutelefon="${l.id}">Lieber anrufen</button>
        <button class="oc k" type="button" data-spaeter="${l.id}">Passt nicht</button>
        <button class="oc y" type="button" data-erstmail="${l.id}">Mail schreiben</button></div>`}
      <div class="sub"><button type="button" data-open="${l.id}">Details</button></div>
    </article>`;
  }
  function viewMail(h, faellig, neue, termine) {
    return `
      <div class="kpis"><div><span>Mails heute</span><b>${h.mails || 0}</b></div><div><span>Nachfassen</span><b>${faellig.length}</b></div><div><span>Neu</span><b>${neue.length}</b></div><div><span>Termine</span><b>${h.termine.length}</b></div></div>
      <p class="hint kanalhint">Erstkontakt per Mail: <b>einzeln und von Hand</b> aus deiner Mail-App, Absender <b>kontakt@infinero.de</b>. Wer abwinkt → „Kein Interesse“, dann wird der Betrieb nie wieder kontaktiert.</p>
      ${termine}
      <h2 class="sec">Nachfassen <span class="n">${faellig.length}</span></h2>
      <div class="list">${faellig.length ? faellig.map(l => mailCard(l, { prio: true })).join("") : `<div class="empty">Nichts fällig.</div>`}</div>
      <h2 class="sec">Neu anschreiben <span class="n">${neue.length}</span></h2>
      <div class="list">${neue.length ? neue.map(l => mailCard(l)).join("") : `<div class="empty">Keine E-Mail-Leads in deiner Liste.</div>`}</div>
      <button class="btn block more" type="button" data-kanalladen="email">+ E-Mail-Leads laden</button>
      <p class="hint">Nach der ersten Mail kommt der Betrieb nach 4 Werktagen wieder: Antwort da? Sonst Nachfass-Mail – danach geht er automatisch ans Telefon.</p>`;
  }
  async function erstMailSheet(id, art = "erst") {
    let l; try { l = await store.lead(id); } catch (e) { return fehler(e); }
    const m = art === "nachfass" ? nachfassMail(l) : erstMail(l);
    const root = sheet((art === "nachfass" ? "Nachfass-Mail · " : "Erste Mail · ") + l.firma, `
      <form class="form">
        <div class="field full"><label for="em_sp">Was soll Claude beachten? <small>(Stichpunkte, optional)</small></label>
          <textarea id="em_sp" rows="2" placeholder="z. B. Inhaberin heißt Frau Weber, viele Fotos auf Instagram, Website ist ein alter Baukasten"></textarea></div>
        <div class="full actions"><button class="btn" type="button" id="em_ki">✨ Mit Claude neu schreiben</button></div>
        <p class="hint full" id="em_ki_hint">Unten steht die Standard-Vorlage. Claude schreibt sie auf Wunsch persönlicher – passend zum Betrieb.</p>
        <div class="field full"><label for="em_an">An</label><input id="em_an" type="email" value="${esc(l.email)}"></div>
        <div class="field full"><label for="em_b">Betreff</label><input id="em_b" value="${esc(m.betreff)}"></div>
        <div class="field full"><label for="em_t">Text</label><textarea id="em_t" rows="22">${esc(m.text)}</textarea></div>
        <div class="full actions" id="em_direkt" hidden><button class="btn primary" type="button" id="em_send">Gestaltet senden</button></div>
        <p class="hint full" id="em_direkt_hint" hidden>Geht als gestaltete Mail im INFINERO-Look (Logo, Buttons, Signatur) von <b>kontakt@infinero.de</b> raus – Antworten und eine Kopie landen im Postfach kontakt@.</p>
        <div class="full actions"><a class="btn" id="em_open" href="#">In Mail-App öffnen (nur Text)</a><button class="btn" type="button" id="em_copy">Text kopieren</button><button class="btn" type="button" id="em_ok">Gesendet ✓</button></div>
        <p class="hint full">Mail-App: Absender <b>kontakt@infinero.de</b> wählen und danach hier „Gesendet ✓“ tippen.</p>
      </form>`);
    const q = x => root.querySelector(x);
    const aktualisieren = () => { q("#em_open").href = mailtoVon(q("#em_an").value.trim(), q("#em_b").value, q("#em_t").value); };
    ["#em_an", "#em_b", "#em_t"].forEach(x => q(x).addEventListener("input", aktualisieren)); aktualisieren();
    q("#em_copy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(q("#em_t").value); toast("Text kopiert"); } catch (err) { toast("Kopieren ging nicht – Text bitte markieren"); } });
    store.mailBereit().then(ok => { if (ok) { q("#em_direkt").hidden = false; q("#em_direkt_hint").hidden = false; } else q("#em_open").classList.add("primary"); });
    let laeuft = false;
    q("#em_ki").addEventListener("click", async () => {
      if (laeuft) return; laeuft = true; const b = q("#em_ki"); b.disabled = true;
      q("#em_ki_hint").textContent = "✨ Claude schreibt die Mail … (dauert ein paar Sekunden)";
      try {
        const r = await Promise.race([store.kiMail(l.id, q("#em_sp").value.trim(), art), new Promise((_, x) => setTimeout(() => x(new Error("Zeitüberschreitung")), 60000))]);
        if (r.betreff && r.text) { q("#em_b").value = r.betreff; q("#em_t").value = r.text; aktualisieren(); q("#em_ki_hint").textContent = "✨ Von Claude geschrieben – kurz drüberlesen. Nicht zufrieden? Stichpunkte ergänzen und neu schreiben."; }
        else q("#em_ki_hint").textContent = "Claude hat gerade nicht geliefert (" + (r.grund || "keine Antwort") + ") – die Vorlage unten kann so raus.";
      } catch (e) { q("#em_ki_hint").textContent = "Claude gerade nicht erreichbar – die Vorlage unten kann so raus."; }
      b.disabled = false; laeuft = false;
    });
    const gesendet = async (an, ueberApp) => {
      const patch = art === "nachfass"
        ? { kanal: "telefon", wiedervorlage: naechsterWerktag(3, 10).toISOString(), naechster_schritt: "2 Mails ohne Antwort – kurz anrufen" }
        : { status: "angeschrieben", wiedervorlage: naechsterWerktag(4, 10).toISOString(), naechster_schritt: "Antwort da? Sonst Nachfass-Mail" };
      if (an && an !== l.email) patch.email = an;
      aus(id); await ergebnis(id, "angeschrieben", patch, (art === "nachfass" ? "Nachfass-Mail gesendet" : "Erste Mail gesendet") + (ueberApp ? " (gestaltet, über die App)" : ""));
      schliessen(); toast(art === "nachfass" ? "Gesendet – in 3 Werktagen steht der Betrieb beim Telefon" : "Gesendet – in 4 Werktagen wieder hier");
    };
    q("#em_ok").addEventListener("click", async () => { try { await gesendet(q("#em_an").value.trim(), false); } catch (err) { fehler(err); } });
    q("#em_send").addEventListener("click", async e => {
      const an = q("#em_an").value.trim(), b = e.currentTarget;
      if (!an) return toast("Bitte Empfänger eintragen");
      if (!confirm(`Mail jetzt an ${an} senden?`)) return;
      b.disabled = true; b.textContent = "Wird gesendet …";
      try { await store.mailSenden({ lead_id: l.id, an, betreff: q("#em_b").value, text: q("#em_t").value, art }); await gesendet(an, true); }
      catch (err) { b.disabled = false; b.textContent = "Gestaltet senden"; toast("Nicht gesendet: " + err.message); }
    });
  }
  async function zuTelefon(id) {
    const l = findLead(id) || {};
    const patch = { kanal: "telefon" };
    if (l.status !== "neu") Object.assign(patch, { wiedervorlage: new Date().toISOString(), naechster_schritt: l.status === "angeschrieben" ? "Mail ohne Antwort – kurz anrufen" : l.naechster_schritt || null });
    try { await store.leadUpdate(id, patch); await store.aktivitaet({ lead_id: id, typ: "notiz", text: "An Telefon übergeben" }); toast(l.status === "neu" ? "Liegt jetzt bei Telefon → Neue Leads" : "Liegt jetzt bei Telefon → Wiedervorlagen"); zeige(); }
    catch (err) { fehler(err); }
  }

  // ---------------------------------------------------------------- Kanal Vor Ort
  const adresse = l => [l.strasse, [l.plz, l.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const wegHref = l => `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${encodeURIComponent([l.firma, adresse(l)].join(", "))}` + (l.place_id ? `&destination_place_id=${encodeURIComponent(l.place_id)}` : "");
  // Laufweg: vom ersten Betrieb (dem Markt am nächsten) immer zum nächstgelegenen – ohne Koordinaten hinten nach PLZ/Straße
  // je Stadt getrennt, Städte in der geladenen Reihenfolge (Jena zuerst)
  function laufweg(liste) {
    const orte = [...new Set(liste.map(l => l.ort || ""))];
    return orte.flatMap(o => laufwegStadt(liste.filter(l => (l.ort || "") === o)));
  }
  function laufwegStadt(liste) {
    const mit = liste.filter(l => l.lat != null), ohne = liste.filter(l => l.lat == null);
    const d = (a, b) => (a.lat - b.lat) ** 2 + ((a.lng - b.lng) * Math.cos(a.lat * Math.PI / 180)) ** 2;
    const weg = [], rest = [...mit];
    let akt = rest.shift(); if (akt) weg.push(akt);
    while (rest.length) { let bi = 0; rest.forEach((l, i) => { if (d(akt, l) < d(akt, rest[bi])) bi = i; }); akt = rest.splice(bi, 1)[0]; weg.push(akt); }
    return [...weg, ...ohne.sort((a, b) => String(a.plz).localeCompare(String(b.plz)) || String(a.strasse).localeCompare(String(b.strasse), "de", { numeric: true }))];
  }
  // Google Maps kann bis zu 10 Stopps je Route → längere Listen in Etappen; jede Etappe startet am Ende der vorigen
  const punkt = l => l.lat != null ? `${l.lat},${l.lng}` : adresse(l);
  function routen(liste) {
    const out = []; let nr = 0;
    for (const o of [...new Set(liste.map(l => l.ort || ""))]) {
    const stopps = liste.filter(l => (l.ort || "") === o && (l.lat != null || adresse(l)));
    for (let i = 0; i < stopps.length; i += 10) {
      const teil = stopps.slice(i, i + 10), start = i ? stopps[i - 1] : null, ende = teil[teil.length - 1], mitte = teil.slice(0, -1);
      out.push({ ort: o, von: nr + i + 1, bis: nr + i + teil.length, href: "https://www.google.com/maps/dir/?api=1&travelmode=walking"
        + (start ? `&origin=${encodeURIComponent(punkt(start))}` : "") + `&destination=${encodeURIComponent(punkt(ende))}`
        + (mitte.length ? `&waypoints=${encodeURIComponent(mitte.map(punkt).join("|"))}` : "") });
    }
    nr += stopps.length;
    }
    return out;
  }
  function vorOrtCard(l, opts = {}) {
    const wb = !l.website ? WEB.keine : WEB[l.website_bewertung];
    const wv = l.wiedervorlage ? new Date(l.wiedervorlage) : null;
    const st = STATUS[l.status] || [l.status, ""];
    return `<article class="card${opts.prio ? " prio" : ""}" data-card="${l.id}">
      <div class="head"><h3>${opts.nr ? `<span class="stopp">${opts.nr}</span>` : ""}<button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3>${l.status !== "neu" ? `<span class="pill ${st[1]}">${st[0]}</span>` : wb ? `<span class="pill ${wb[1]}">${wb[0]}</span>` : ""}</div>
      <a class="adresse" href="${esc(wegHref(l))}" target="_blank" rel="noopener">📍 ${esc(adresse(l) || "Adresse fehlt")}</a>
      <div class="meta">${l.branche ? `<span>${esc(l.branche)}</span>` : ""}${l.bewertung_google ? `<span>★ ${esc(String(l.bewertung_google).replace(".", ","))}${l.bewertungen ? ` (${l.bewertungen})` : ""}</span>` : ""}${l.versuche ? `<span>Besuch ${l.versuche + 1}</span>` : ""}${wv ? `<span class="${wv < new Date() ? "due" : ""}">${istHeute(l.wiedervorlage) ? "heute" : dDE(l.wiedervorlage)}</span>` : ""}</div>
      ${schrittWahl(l)}
      ${l.demo_gesehen_am ? `<div class="meta">${demoGesehen(l)}</div>` : ""}
      ${l.website_befund && l.website_bewertung === "veraltet" ? `<div class="befund">${esc(l.website_befund)}</div>` : ""}
      <div class="call"><a class="btn small primary" href="${esc(demoVon(l, false))}" target="_blank" rel="noopener">Demo zeigen</a>${l.demo_website ? `<span class="pill ${l.demo_website === "fertig" ? "ok" : "warn"}">Eigene Demo: ${esc(l.demo_website.replace("_", " "))}</span>` : ""}${l.website ? webLink(l.website) : ""}${l.telefon ? `<a href="${esc(telHref(l.telefon))}">${esc(l.telefon)}</a>` : ""}</div>
      <div class="outcomes">
        <button class="oc n" type="button" data-oc="weg" data-id="${l.id}">Nicht angetroffen</button>
        <button class="oc k" type="button" data-oc="kein" data-id="${l.id}">Kein Interesse</button>
        <button class="oc i" type="button" data-demoinfo="${l.id}">${l.demo_website ? "Demo-Infos" : "Vorab-Demo"}</button>
        <button class="oc y" type="button" data-oc="ja" data-id="${l.id}">Interesse</button>
      </div>
      <div class="sub"><button type="button" data-zusage="${l.id}">Zusage!</button><button type="button" data-oc="rueckruf" data-id="${l.id}">Rückruf</button><button type="button" data-spaeter="${l.id}">Website gut → später</button><button type="button" data-open="${l.id}">Details</button></div>
    </article>`;
  }
  function viewVorOrt(h, faellig, neue, termine) {
    const orte = [...new Set(neue.map(l => l.ort).filter(Boolean))];
    if (S.voOrt && !orte.includes(S.voOrt)) S.voOrt = null;
    const liste = laufweg(S.voOrt ? neue.filter(l => l.ort === S.voOrt) : neue);
    const etappen = routen(liste);
    return `
      <div class="kpis"><div><span>Besuche heute</span><b>${h.besuche || 0}</b></div><div><span>Wieder hin</span><b>${faellig.length}</b></div><div><span>Offen</span><b>${neue.length}</b></div><div><span>Termine</span><b>${h.termine.length}</b></div></div>
      ${termine}
      <h2 class="sec">Nochmal vorbeischauen <span class="n">${faellig.length}</span></h2>
      <div class="list">${faellig.length ? faellig.map(l => vorOrtCard(l, { prio: true })).join("") : `<div class="empty">Nichts fällig.</div>`}</div>
      <h2 class="sec">Heute ansteuern <span class="n">${neue.length}</span></h2>
      ${orte.length > 1 ? `<div class="chips scroll" style="margin-bottom:8px"><button class="chip" type="button" data-voort="" aria-pressed="${!S.voOrt}">Alle ${neue.length}</button>${orte.map(o => `<button class="chip" type="button" data-voort="${esc(o)}" aria-pressed="${S.voOrt === o}">${esc(o)} ${neue.filter(l => l.ort === o).length}</button>`).join("")}</div>` : ""}
      ${etappen.length ? `<div class="actions routen" style="margin-bottom:8px">${etappen.map((e, i) => `<a class="btn small${i ? "" : " primary"}" href="${esc(e.href)}" target="_blank" rel="noopener">${etappen.length > 1 ? `Route ${i + 1}${new Set(etappen.map(x => x.ort)).size > 1 ? " " + esc(e.ort) : ""}: Stopp ${e.von}–${e.bis}` : `Laufroute in Google Maps (${e.bis} Stopps)`}</a>`).join("")}</div>` : ""}
      <div class="list">${liste.length ? liste.map((l, i) => vorOrtCard(l, { nr: i + 1 })).join("") : `<div class="empty">Keine Vor-Ort-Leads in deiner Liste.</div>`}</div>
      <button class="btn block more" type="button" data-kanalladen="vor_ort">+ Vor-Ort-Leads laden</button>
      <p class="hint">Hier landen nur Betriebe <b>in der Innenstadt</b> (zu Fuß erreichbar) <b>ohne Website oder mit klar veralteter Seite</b> – Jena zuerst, dann Weimar, Erfurt, Gera, Leipzig. Die Liste ist als Laufweg sortiert, die Nummern passen zur Route. Nach ${VO_MAX}× nicht angetroffen geht der Betrieb ans Telefon.</p>`;
  }
  async function kanalLadenSheet(k) {
    let pool = {}; try { pool = await store.poolKanal() || {}; } catch (e) { console.warn(e); }
    const zgs = S.zg || [], vo = k === "vor_ort";
    let zg = null, ort = vo ? ((pool.vor_ort || [])[0] || {}).ort || null : null, anzahl = vo ? 10 : 20;
    const zahlZg = id => vo ? (pool.vor_ort || []).filter(x => (!id || x.zielgruppe === id)).reduce((a, x) => a + x.n, 0)
                            : id ? (pool.email || {})[id] || 0 : Object.values(pool.email || {}).reduce((a, n) => a + n, 0);
    const orteHTML = () => { const m = {}; (pool.vor_ort || []).filter(x => !zg || x.zielgruppe === zg).forEach(x => { m[x.ort] = (m[x.ort] || 0) + x.n; });
      const liste = Object.entries(m); if (ort && !m[ort]) ort = liste.length ? liste[0][0] : null;   // Reihenfolge kommt aus der Datenbank: Jena zuerst
      return liste.length ? liste.map(([o, n]) => `<button class="chip" type="button" data-ort="${esc(o)}" aria-pressed="${ort === o}">${esc(o)} <small>(${n})</small></button>`).join("")
        : `<span class="hint">Gerade keine passenden Betriebe im Pool.</span>`; };
    const root = sheet(vo ? "Vor-Ort-Leads laden" : "E-Mail-Leads laden", `
      <div class="lbl">Zielgruppe</div>
      <div class="chips" id="kl_zg"><button class="chip" type="button" data-zg="" aria-pressed="true">Alle <small>(${zahlZg(null)})</small></button>${zgs.map(z => `<button class="chip" type="button" data-zg="${z.id}" aria-pressed="false">${esc(z.name)} <small>(${zahlZg(z.id)})</small></button>`).join("")}</div>
      ${vo ? `<div class="lbl" style="margin-top:14px">Innenstadt</div><div class="chips" id="kl_ort">${orteHTML()}</div>` : ""}
      <div class="lbl" style="margin-top:14px">Wie viele?</div>
      <div class="chips">${(vo ? [10, 20, 30] : [10, 20, 50]).map(n => `<button class="chip" type="button" data-n="${n}" aria-pressed="${n === anzahl}">${n}</button>`).join("")}</div>
      <div class="actions"><button class="btn primary block" type="button" id="kl_go">Laden</button></div>
      <p class="hint">${vo ? `Nur Betriebe in der Innenstadt (zu Fuß erreichbar) ohne Website oder mit klar veralteter Seite – vom Markt aus nach außen.${pool.geo_offen ? ` Bei ${pool.geo_offen} Betrieben wird die Lage gerade noch ermittelt.` : ""}`
        : `Nur Betriebe mit E-Mail-Adresse und ohne moderne Website. Die Adressen sucht die App automatisch auf Website und Impressum${pool.mail_suche ? ` – bei ${pool.mail_suche} Betrieben läuft die Suche noch` : ""}.`}</p>`);
    root.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if ("zg" in b.dataset) { zg = b.dataset.zg || null; root.querySelectorAll("[data-zg]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); if (vo) root.querySelector("#kl_ort").innerHTML = orteHTML(); }
      if ("ort" in b.dataset) { ort = b.dataset.ort || null; root.querySelectorAll("[data-ort]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); }
      if (b.dataset.n) { anzahl = +b.dataset.n; root.querySelectorAll("[data-n]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); }
      if (b.id === "kl_go") {
        b.disabled = true;
        try {
          const n = await store.kanalLaden(k, anzahl, zg, ort);
          if (n) { if (vo) S.voOrt = ort; toast(`${n} ${vo ? "Vor-Ort" : "E-Mail"}-Leads geladen`); } else toast("Gerade nichts Passendes frei – Nachschub kommt über Nacht.");
          schliessen(false); await zeige();
        } catch (err) { fehler(err); b.disabled = false; }
      }
    });
  }

  // ---------------------------------------------------------------- Anruf-Ergebnisse
  function aus(id) {
    const c = document.querySelector(`[data-card="${id}"]`); if (c) { c.classList.add("weg"); setTimeout(() => c.remove(), 220); }
    if (kanalVon(findLead(id)) !== "telefon") return;   // Mails und Besuche zählen nicht als Anrufe
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
    await store.aktivitaet({ lead_id: id, typ: KANAL_TYP[kanalVon(alt)] || "anruf", ergebnis: typ, text: text || null });
    return vorher;
  }
  async function schnell(id, art) {
    const l = findLead(id); if (!l) return;
    let patch, text, label;
    if (art === "weg") {
      const v = (l.versuche || 0) + 1;
      patch = v >= VO_MAX ? { status: "nicht_erreicht", versuche: v, kanal: "telefon", wiedervorlage: naechsterWerktag(1, 9).toISOString(), naechster_schritt: `${v}× vor Ort nicht angetroffen – anrufen` }
        : { status: "nicht_erreicht", versuche: v, wiedervorlage: naechsterWerktag(1, 10).toISOString(), naechster_schritt: "Nochmal vorbeischauen" };
      text = "Vor Ort nicht angetroffen";
      label = v >= VO_MAX ? `${v}× nicht angetroffen – liegt jetzt bei Telefon` : "Nicht angetroffen – steht morgen wieder hier";
    } else if (art === "nicht") {
      const v = (l.versuche || 0) + 1;
      patch = v >= MAX_VERSUCHE ? { status: "kein_kontakt", versuche: v, wiedervorlage: null } : { status: "nicht_erreicht", versuche: v, wiedervorlage: naechsterWerktag(1, 9).toISOString() };
      label = v >= MAX_VERSUCHE ? `Nach ${v} Versuchen abgelegt` : "Nicht erreicht – morgen wieder dran";
    } else {
      patch = { status: "kein_interesse", gesperrt: true, wiedervorlage: null };
      label = "Kein Interesse – wird nicht mehr kontaktiert";
    }
    aus(id);
    try {
      const vorher = await ergebnis(id, art === "kein" ? "kein_interesse" : "nicht_erreicht", patch, text);
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

  function infoMail(l) {
    const v = VORLAGEN[l.zielgruppe] || VORLAGEN.allgemein;
    const z = (S.zg || []).find(x => x.id === l.zielgruppe);
    const ich = (store.mode === "live" && S.team.find(t => t.kuerzel === S.profil.kuerzel)) || S.view;
    const euro = n => n.toLocaleString("de-DE") + " €";
    const prods = [...new Set((l.interesse_produkte || []).filter(c => MAILTEXT[c]))];
    if (!prods.length) prods.push("WEBSITE");
    const paket = LEITER_MAIL.find(([k]) => k.length === prods.length && k.every(c => prods.includes(c)));
    const liste = prods.map(c => `– ${MAILTEXT[c][0]}: ${MAILTEXT[c][1]}` + (paket ? "" : ` (einmalig ${euro(MAILTEXT[c][2])}, dann ${euro(MAILTEXT[c][3])} im Monat)`)).join("\n")
      + (paket ? `\nZusammen: einmalig ${euro(paket[1])}, dann ${euro(paket[2])} im Monat` : "");
    const ab = aussen();
    const kollege = (l.owner || ich.kuerzel) !== ab.kuerzel ? " mit meinem Kollegen" : "";
    const link = ab.termin_link || (S.cfg && S.cfg.termin_link);
    const teile = [
      anrede(l),
      `danke für das nette Telefonat${kollege} – wie versprochen hier kurz das Wichtigste.`,
      v.nutzen,
      `Was wir Ihnen vorschlagen würden (Preise netto zzgl. USt):\n${liste}`,
      "Die 99 € im Monat sind Ihre Website-Flatrate: ein fester Betrag, alles drin – Sie müssen sich nie wieder selbst um Ihre Website kümmern. Und wir sorgen dafür, dass man Sie auch findet: Wir pflegen Ihren Eintrag bei Google Maps, machen Sie fit für die Suche mit KI-Assistenten wie ChatGPT und zeigen Ihnen jeden Monat in einem kurzen Bericht, wie oft Sie gefunden wurden. Jede Änderung – Öffnungs- und Urlaubszeiten, Preise, Aktionen, Texte oder Fotos – tragen wir jederzeit für Sie ein, eine kurze Nachricht genügt. Wir behalten laufend im Blick, ob Impressum und Datenschutz zu den aktuellen Gesetzen passen, und kümmern uns um Hosting, Sicherheit und Updates. Und falls Ihnen das Design nächsten Monat schon nicht mehr gefällt: Dann gestalten wir Ihre Seite eben komplett neu – alles ohne Extra-Kosten. Der Monatsbeitrag beginnt übrigens erst, wenn Ihre Seite live ist.",
      z && z.demo_url ? `So könnte das für einen Betrieb wie Ihren aussehen:\n${demoVon(l)}` : `Hier können Sie sich Beispiele für verschiedene Branchen ansehen und direkt ausprobieren:\n${demoVon(l)}`,
      "Mehr über uns finden Sie auf infinero.de.",
      link ? `Wenn Sie mögen, zeige ich Ihnen das in 15 Minuten am Telefon. Hier können Sie sich direkt einen Termin aussuchen:\n${link}` : "Wenn Sie mögen, zeige ich Ihnen das in 15 Minuten am Telefon – antworten Sie einfach kurz mit einem Wunschtermin.",
      "Und falls es gerade nicht passt: Eine kurze Nachricht genügt, dann melden wir uns nicht wieder.",
      signatur(aussen()),
    ];
    return { an: l.email || "", betreff: v.betreff, text: teile.filter(Boolean).join("\n\n") };
  }
  const mailtoVon = (an, betreff, text) => `mailto:${encodeURIComponent(an)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;

  // Vorschau: Claude schreibt die ganze Mail (Edge Function infomail); Stichpunkte aus dem Telefonat machen sie persönlicher
  async function infoMailSheet(id) {
    let l; try { l = await store.lead(id); } catch (e) { return fehler(e); }
    const root = sheet("Info-Mail · " + l.firma, `
      <form id="imf" class="form">
        <div class="field full"><label for="im_sp">Was war im Gespräch wichtig? <small>(Stichpunkte, optional)</small></label>
          <textarea id="im_sp" rows="3" placeholder="z. B. Telefon ständig besetzt, will Online-Termine, bespricht es mit seiner Frau"></textarea></div>
        <div class="full actions"><button class="btn" type="button" id="im_neu">✨ Mit Claude neu schreiben</button></div>
        <p class="hint full" id="im_ki">✨ Claude schreibt die Mail …</p>
        <div class="field full"><label for="im_an">An</label><input id="im_an" type="email" value="${esc(l.email)}"></div>
        <div class="field full"><label for="im_b">Betreff</label><input id="im_b"></div>
        <div class="field full"><label for="im_t">Text</label><textarea id="im_t" rows="20"></textarea></div>
        <div class="full actions" id="im_direkt" hidden><button class="btn primary" type="button" id="im_send">Direkt senden</button></div>
        <p class="hint full" id="im_direkt_hint" hidden>Geht sofort von <b>kontakt@infinero.de</b> raus – Antworten und eine Kopie landen im Postfach kontakt@.</p>
        <div class="full actions"><a class="btn" id="im_open" href="#">In Mail-App öffnen</a><button class="btn" type="button" data-mailok="${l.id}">Als gesendet markieren</button></div>
        <p class="hint full" id="im_app_hint">Mail-App: Absender <b>kontakt@infinero.de</b> wählen. Nach dem Senden „Als gesendet markieren“.</p>
      </form>`);
    const q = s => root.querySelector(s);
    const setzen = d => { q("#im_b").value = d.betreff; q("#im_t").value = d.text; aktualisieren(); };
    const aktualisieren = () => { q("#im_open").href = mailtoVon(q("#im_an").value.trim(), q("#im_b").value, q("#im_t").value); };
    ["#im_an", "#im_b", "#im_t"].forEach(s => q(s).addEventListener("input", aktualisieren));
    setzen(infoMail(l));
    store.mailBereit().then(ok => { if (ok) { q("#im_direkt").hidden = false; q("#im_direkt_hint").hidden = false; q("#im_open").classList.remove("primary"); } else q("#im_open").classList.add("primary"); });
    q("#im_send").addEventListener("click", async e => {
      const an = q("#im_an").value.trim(), b = e.currentTarget;
      if (!an) return toast("Bitte Empfänger eintragen");
      if (!confirm(`Info-Mail jetzt an ${an} senden?`)) return;
      b.disabled = true; b.textContent = "Wird gesendet …";
      try { await store.mailSenden({ lead_id: l.id, an, betreff: q("#im_b").value, text: q("#im_t").value }); toast("Info-Mail gesendet ✓"); schliessen(); }
      catch (err) { b.disabled = false; b.textContent = "Direkt senden"; toast("Nicht gesendet: " + err.message); }
    });
    let laeuft = false;
    const schreiben = async () => {
      if (laeuft) return; laeuft = true;
      const btn = q("#im_neu"); btn.disabled = true;
      q("#im_ki").textContent = "✨ Claude schreibt die Mail … (dauert ein paar Sekunden)";
      try {
        const r = await Promise.race([store.kiMail(l.id, q("#im_sp").value.trim()), new Promise((_, x) => setTimeout(() => x(new Error("Zeitüberschreitung")), 60000))]);
        if (r.betreff && r.text) { setzen(r); q("#im_ki").textContent = "✨ Von Claude geschrieben – lies kurz drüber und pass an, was nicht stimmt. Nicht zufrieden? Stichpunkte ergänzen und neu schreiben."; }
        else q("#im_ki").textContent = "Claude hat gerade nicht geliefert (" + (r.grund || "keine Antwort") + ") – unten steht die Standard-Vorlage.";
      } catch (e) { q("#im_ki").textContent = "Claude gerade nicht erreichbar – unten steht die Standard-Vorlage, die kann so raus."; }
      btn.disabled = false; laeuft = false;
    };
    q("#im_neu").addEventListener("click", schreiben);
    schreiben();
  }

  // Online-Auftrag: Link zur Auftragsseite (Angebot → Zustimmung → Zahlung über Stripe)
  const auftragLink = a => new URL("auftrag.html?t=" + encodeURIComponent(a.token || ""), location.href).href;
  function auftragMail(a) {
    const l = a.lead || {};
    const p = pname(a);
    const text = [
      anrede(l),
      "vielen Dank für Ihre Zusage – wir freuen uns sehr auf die Zusammenarbeit!",
      `Unter diesem Link finden Sie Ihr Angebot „${p}“ mit allen Konditionen. Dort können Sie den Auftrag mit wenigen Klicks erteilen und Ihre Zahlungsart hinterlegen (SEPA-Lastschrift oder Karte). ${+a.monatlich > 0 ? "Fällig wird jetzt nur die Einrichtung – der Monatsbeitrag beginnt erst, wenn Ihre Website live ist" : "Es fällt einmalig der vereinbarte Betrag an, ohne laufende Kosten"}:\n${auftragLink(a)}`,
      "Sobald der Auftrag da ist, melden wir uns für ein kurzes Onboarding-Gespräch, in dem wir alles für Ihre Website besprechen.",
      "Bei Fragen erreichen Sie mich jederzeit.",
      signatur(aussen()),
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
    if (!mailErlaubt()) { q("#am_open").hidden = true; q("#am_copy").classList.add("primary"); }
    else store.mailBereit().then(ok => { if (ok) { q("#am_direkt").hidden = false; } else q("#am_open").classList.add("primary"); });
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
      </form><p class="hint">${mailErlaubt() ? "" : "Ziu bekommt die Anfrage und schickt die Info-Mail. "}Danach im Lead auf „Info-Mail öffnen“ tippen – die fertige Mail (Vorlage der Zielgruppe mit Produkten, Preisen und Demo-Link) öffnet sich in der Mail-App. Als Absender immer <b>kontakt@infinero.de</b> wählen. Offene Mails sieht Ziu auch im Cockpit.</p>`);
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
  // Website-Entwürfe (aus dem Website-System): 3 Varianten ansehen, eine wählen, Feedback geben
  const ENTWURF_STATUS = { entwuerfe: ["Entwürfe warten auf Auswahl", "warn"], gewaehlt: ["Entwurf gewählt – wird ausgebaut", "accent"], in_ausbau: ["Website wird ausgebaut", "accent"], vorschau: ["Vorschau fertig – Abnahme", "ok"], live: ["Live", "ok"] };
  function entwuerfeBlock(e) {
    const st = ENTWURF_STATUS[e.status] || [e.status, ""];
    const offen = e.status === "entwuerfe" && inhaber();
    return `<div class="demobox entwuerfe-box" data-entwuerfe="${e.id}">
      <div class="kv"><b>Website-Entwürfe</b><span class="pill ${st[1]}">${esc(st[0])}</span></div>
      <div class="entwuerfe">${(e.varianten || []).map(v => `<a class="entwurf${e.gewaehlt === v.id ? " gewaehlt" : ""}" href="${esc(v.url)}" target="_blank" rel="noopener">
        <img src="${esc(v.handy || v.desktop || "")}" alt="" loading="lazy"><b>Entwurf ${esc(v.id.toUpperCase())}</b><span>${esc(v.name || "")}</span></a>`).join("")}</div>
      ${offen ? `<div class="wahl">${(e.varianten || []).map(v => `<button class="btn small" type="button" data-wahl="${esc(v.id)}" aria-pressed="false">${esc(v.id.toUpperCase())}</button>`).join("")}</div>
        <textarea class="feedback" rows="3" placeholder="Dein Senf dazu: Was soll anders werden? (Farben, Bilder, Texte, Reihenfolge …)"></textarea>
        <button class="btn primary small" type="button" data-entwurfok="${e.id}">Auswahl speichern</button>`
      : `${e.gewaehlt ? `<div>Gewählt: <b>Entwurf ${esc(e.gewaehlt.toUpperCase())}</b>${e.gewaehlt_am ? ` am ${dDE(e.gewaehlt_am)}` : ""}</div>` : ""}${e.feedback ? `<div>Feedback: ${esc(e.feedback)}</div>` : ""}
        ${e.vorschau_url ? `<div class="actions"><a class="btn small primary" href="${esc(e.vorschau_url)}" target="_blank" rel="noopener">Vorschau öffnen</a><button class="btn small" type="button" data-copy="${esc(e.vorschau_url)}">Link kopieren</button></div>` : ""}
        ${e.live_url ? `<div class="actions"><a class="btn small" href="${esc(e.live_url)}" target="_blank" rel="noopener">Live-Seite</a></div>` : ""}
        ${inhaber() && e.status !== "live" ? `<div class="actions"><button class="btn small" type="button" data-entwurfneu="${e.id}">Auswahl ändern</button></div>` : ""}`}
    </div>`;
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
      else if (mode === "rueckruf") Object.assign(patch, { status: "rueckruf", kanal: "telefon", wiedervorlage: wann.toISOString(), naechster_schritt: `Rückruf ${dDE(wann)} ${hhmm(wann)}` });
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
    const f = [["offen", "In Arbeit"], ["mein", "Meine"], ["info", "Infos angefragt"], ["interesse", "Interesse/Termin"], ["kunden", "Kunden"], ["spaeter", "Für später"], ["zu", "Abgelehnt"], ["alle", "Alle"]];
    if (inhaber()) f.push(["pool", "Pool"]);
    const rows = await store.leads({ q: S.q, filter: S.filter, nurEigene: !inhaber(), produkt: S.filter === "spaeter" ? S.spaeterProd : null }); S.data.leads = rows;
    return `<div class="search"><input id="q" type="search" placeholder="Firma, Ort, Branche, Telefon …" value="${esc(S.q)}" aria-label="Leads durchsuchen"></div>
      <div class="chips scroll">${f.map(([k, t]) => `<button class="chip" type="button" data-filter="${k}" aria-pressed="${S.filter === k}">${t}</button>`).join("")}</div>
      ${S.filter === "spaeter" ? `<div class="chips scroll" style="margin-top:8px"><button class="chip" type="button" data-spaeterprod="" aria-pressed="${!S.spaeterProd}">Alle</button>${SPAETER.map(([c, n]) => `<button class="chip" type="button" data-spaeterprod="${c}" aria-pressed="${S.spaeterProd === c}">${esc(n)}</button>`).join("")}</div>
        <p class="hint">Leads mit Interesse an Produkten, die wir später aktiv anbieten. Sie tauchen nicht in „Heute“ auf, bis du sie wieder in die Arbeit holst.</p>` : ""}
      <div class="list" style="margin-top:8px">${rows.length ? rows.map(leadRow).join("") : `<div class="empty">Keine Leads in dieser Ansicht.</div>`}</div>
      ${rows.length >= 300 ? `<p class="hint">Es werden die 300 zuletzt geänderten angezeigt – Suche nutzen.</p>` : ""}`;
  }
  function leadRow(l) {
    const st = STATUS[l.status] || [l.status, ""];
    return `<article class="card"><div class="head"><h3><button type="button" data-open="${l.id}">${esc(l.firma)}</button></h3><span class="pill ${l.gesperrt && l.status !== "kein_interesse" ? "bad" : st[1]}">${l.gesperrt && l.status !== "kein_interesse" ? "Gesperrt" : st[0]}</span></div>
      <div class="meta">${[l.branche, l.ort, l.owner ? name(l.owner) : "Pool", l.owner && kanalVon(l) !== "telefon" ? (KANAELE.find(k => k[0] === l.kanal) || [])[1] : "", l.wiedervorlage ? "WV " + dDE(l.wiedervorlage) : "", l.demo_website ? "Demo: " + l.demo_website.replace("_", " ") : ""].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}</div></article>`;
  }

  async function detail(id) {
    let l; try { l = await store.lead(id); } catch (e) { return fehler(e); }
    S.data.detail = l;
    const st = STATUS[l.status] || [l.status, ""];
    const felder = [["firma", "Firma"], ["ansprechpartner", "Ansprechpartner"], ["telefon", "Telefon"], ["email", "E-Mail"], ["website", "Website"], ["branche", "Branche"], ["strasse", "Straße"], ["plz", "PLZ"], ["ort", "Ort"], ["naechster_schritt", "Nächster Schritt"]];
    const root = sheet(l.firma, `
      <div class="block">
        <div class="kv"><span class="pill ${st[1]}">${st[0]}</span><span class="meta">${esc(l.lead_nr || "")} · ${esc(l.owner ? name(l.owner) : "Pool")}${l.versuche ? " · " + l.versuche + " Versuche" : ""}</span></div>
        ${l.tippgeber ? `<div class="kv"><span class="pill ok">Empfehlung: ${esc(tippName(l.tippgeber))} (${esc(l.tippgeber)})</span><span class="meta">Tippgeber wird beim Abschluss automatisch eingetragen</span></div>` : ""}
        ${l.telefon ? `<div class="call"><a class="tel" href="${esc(telHref(l.telefon))}"><svg viewBox="0 0 24 24">${ICON.tel}</svg>${esc(l.telefon)}</a></div>` : ""}
        ${l.website ? `<div class="kv">${webLink(l.website)}${WEB[l.website_bewertung] ? `<span class="pill ${WEB[l.website_bewertung][1]}">${WEB[l.website_bewertung][0]}</span>` : ""}</div>${l.website_befund ? `<div class="befund">${esc(l.website_befund)}</div>` : ""}` : ""}
        <div class="kv">${mapsLink(l)}</div>
        ${l.email ? `<div class="kv"><span class="v">${esc(l.email)}</span>${l.einwilligung_email ? `<span class="pill ok">Einwilligung ${dDE(l.einwilligung_email)}</span>` : ""}</div>` : ""}
        ${mailErlaubt() && l.email && l.info_mail === "offen" ? `<div class="actions"><button class="btn small primary" type="button" data-infomail="${l.id}">Info-Mail öffnen</button><button class="btn small" type="button" data-mailok="${l.id}">Als gesendet markieren</button></div>` : ""}
        ${l.interesse_produkte && l.interesse_produkte.length ? `<div class="meta"><span>Interesse: ${esc(l.interesse_produkte.join(", "))}</span></div>` : ""}
        ${l.info_mail === "offen" && !mailErlaubt() ? `<div class="meta"><span>Info-Mail ist bei Ziu angefragt</span></div>` : ""}
        ${l.demo_gesehen_am ? `<div class="kv">${demoGesehen(l)}<button class="btn small" type="button" data-copy="${esc(demoVon(l))}">Persönlicher Demo-Link</button></div>` : `<div class="kv"><span class="meta">Persönlicher Demo-Link (meldet, wenn er geöffnet wird)</span><button class="btn small" type="button" data-copy="${esc(demoVon(l))}">Kopieren</button></div>`}
        ${l.demo_website ? `<div class="demobox"><div class="kv"><b>Demo-Website: ${esc(l.demo_website.replace("_", " "))}</b><button class="btn small" type="button" data-demoinfo="${l.id}">${l.demo_infos ? "Infos bearbeiten" : "Infos erfassen"}</button></div>${demoText(l.demo_infos) || `<div class="due">Noch keine Infos für die Demo erfasst.</div>`}</div>` : ""}
        ${l._entwuerfe ? entwuerfeBlock(l._entwuerfe) : ""}
        ${l.gesperrt ? `<div class="due">Keine Werbung – nicht mehr kontaktieren.</div>` : ""}
        ${l.status === "vorgemerkt" ? `<div class="demobox"><div class="kv"><b>Für später: ${esc((l.vorgemerkt || []).map(spaeterName).join(", ") || "–")}</b>${l.vorgemerkt_am ? `<span class="meta">seit ${dDE(l.vorgemerkt_am)}</span>` : ""}</div>
          <div class="actions"><button class="btn small" type="button" data-spaeter="${l.id}">Ändern</button><button class="btn small" type="button" data-reaktiv="${l.id}">Wieder in die Arbeit holen</button></div></div>` : ""}
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
        ${!l.gesperrt && l.status !== "vorgemerkt" && l.status !== "gewonnen" ? `<button class="btn" type="button" data-spaeter="${l.id}">Für später vormerken</button>` : ""}
        ${!l.gesperrt ? `<button class="btn danger" type="button" data-sperren="${l.id}">Keine Werbung</button>` : ""}</div>
      ${l._termine.length ? `<h2 class="sec">Termine</h2><div class="list">${l._termine.map(t => `<div class="block"><div class="kv"><span>${esc(tagDE(new Date(t.beginn)))}, ${hhmm(new Date(t.beginn))}</span><span class="pill ${t.status === "geplant" ? "ok" : ""}">${esc(t.status)}</span></div><div class="meta"><span>mit ${esc(t.mit.map(name).join(" & "))}</span><span>${esc(ART[t.art])}</span></div>${t.status === "geplant" ? `<div class="actions">${kalenderButtons({ ...t, lead: l })}</div>` : ""}</div>`).join("")}</div>` : ""}
      ${(l._auftraege || []).length ? `<h2 class="sec">Aufträge</h2><div class="list">${l._auftraege.map(a => auftragCard({ ...a, lead: l })).join("")}</div>` : ""}
      ${l._deals.length ? `<h2 class="sec">Abschlüsse</h2><div class="list">${l._deals.map(dealCard).join("")}</div>` : ""}
      <h2 class="sec">Daten</h2>
      <form id="f" class="form">
        ${felder.map(([k, t]) => k === "naechster_schritt"
          ? `<div class="field full"><label for="d_ns_wahl">${t}</label><select id="d_ns_wahl"><option value="">– wählen –</option>${SCHRITTE.map(x => `<option${x === l[k] ? " selected" : ""}>${esc(x)}</option>`).join("")}<option value="*"${l[k] && !SCHRITTE.includes(l[k]) ? " selected" : ""}>Eigener Text …</option></select>
              <input id="d_${k}" name="${k}" value="${esc(l[k])}" placeholder="Eigener nächster Schritt"${l[k] && !SCHRITTE.includes(l[k]) ? "" : " hidden"} style="margin-top:6px"></div>`
          : `<div class="field${k === "firma" ? " full" : ""}"><label for="d_${k}">${t}</label><input id="d_${k}" name="${k}" value="${esc(l[k])}"></div>`).join("")}
        <div class="field"><label for="d_wv">Wiedervorlage</label><input id="d_wv" name="wv" type="datetime-local" value="${l.wiedervorlage ? isoDate(new Date(l.wiedervorlage)) + "T" + hhmm(new Date(l.wiedervorlage)) : ""}"></div>
        <div class="field"><label for="d_kanal">Kanal</label><select id="d_kanal" name="kanal">${(kanalVon(l) === "email" ? KANAELE : kanaele()).map(([k, t]) => `<option value="${k}"${kanalVon(l) === k ? " selected" : ""}>${t}</option>`).join("")}</select></div>
        ${inhaber() ? `<div class="field"><label for="d_owner">Betreut von</label><select id="d_owner" name="owner"><option value="">Pool</option>${S.team.map(t => `<option value="${t.kuerzel}"${l.owner === t.kuerzel ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>` : ""}
        ${inhaber() && l.demo_website ? `<div class="field"><label for="d_demo">Demo-Website</label><select id="d_demo" name="demo"><option value="offen"${l.demo_website === "offen" ? " selected" : ""}>offen</option><option value="in_arbeit"${l.demo_website === "in_arbeit" ? " selected" : ""}>in Arbeit</option><option value="fertig"${l.demo_website === "fertig" ? " selected" : ""}>fertig</option></select></div>` : ""}
        <div class="field full"><label for="d_notiz">Neue Notiz</label><textarea id="d_notiz" name="notiz"></textarea></div>
        <div class="full"><button class="btn primary block" type="submit">Speichern</button></div>
      </form>
      ${l._akt.length ? `<h2 class="sec">Verlauf</h2><div class="log">${l._akt.map(a => `<div><time>${dDE(a.zeit)} ${hhmm(new Date(a.zeit))}</time>${esc(name(a.von))}: ${esc([a.ergebnis ? (STATUS[a.ergebnis] || [a.ergebnis])[0] : a.typ, a.text].filter(Boolean).join(" – "))}</div>`).join("")}</div>` : ""}
      ${inhaber() ? `<div class="actions" id="delwrap"><button class="btn danger small" type="button" data-askdel="${l.id}">Lead löschen</button></div>` : ""}`);
    const nsWahl = root.querySelector("#d_ns_wahl"), nsText = root.querySelector("#d_naechster_schritt");
    nsWahl.addEventListener("change", () => { const eigen = nsWahl.value === "*"; nsText.hidden = !eigen; if (eigen) { nsText.value = ""; nsText.focus(); } else nsText.value = nsWahl.value; });
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.target), patch = {};
      felder.forEach(([k]) => (patch[k] = (fd.get(k) || "").toString().trim() || null));
      if (!patch.firma) return toast("Firmenname fehlt.");
      if (patch.website) patch.website = patch.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
      const wv = fd.get("wv"); patch.wiedervorlage = wv ? new Date(wv).toISOString() : null;
      if (inhaber() && fd.has("owner")) patch.owner = fd.get("owner") || null;
      if (fd.has("kanal")) patch.kanal = fd.get("kanal");
      if (fd.has("demo")) patch.demo_website = fd.get("demo");
      try {
        await store.leadUpdate(l.id, patch);
        const n = (fd.get("notiz") || "").toString().trim(); if (n) await store.aktivitaet({ lead_id: l.id, typ: "notiz", text: n });
        toast("Gespeichert"); detail(l.id);
      } catch (err) { fehler(err); }
    });
  }

  // „Für später vormerken“: Lead mit Interesse an KI-Caller/WhatsApp-Bot … in den Pool – raus aus den Tageslisten
  function spaeterSheet(id, ausAnruf = false) {
    const l = findLead(id) || {}; const sel = new Set(l.vorgemerkt || []);
    const root = sheet("Für später · " + (l.firma || ""), `<form id="f" class="form">
      <p class="hint full" style="margin:0">Der Betrieb interessiert sich für etwas, das wir noch nicht aktiv verkaufen. Er landet im Pool „Für später“ – keine Wiedervorlage, kein Anruf, bis wir das Produkt anbieten.</p>
      <div class="full"><div class="lbl">Interessant für</div><div class="chips">${SPAETER.map(([c, n]) => `<button class="chip" type="button" data-sp="${c}" aria-pressed="${sel.has(c)}">${esc(n)}</button>`).join("")}</div></div>
      <div class="field full"><label for="sp_n">Notiz (optional)</label><input id="sp_n" placeholder="z. B. Telefon ständig besetzt, will Anrufe nicht verpassen"></div>
      <div class="full"><button class="btn primary block" type="submit">Vormerken</button></div></form>`);
    root.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); if (b) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); });
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const codes = [...root.querySelectorAll("[data-sp][aria-pressed=true]")].map(b => b.dataset.sp);
      if (!codes.length) return toast("Bitte mindestens ein Produkt wählen");
      const notiz = root.querySelector("#sp_n").value.trim();
      const text = "Für später vorgemerkt: " + codes.map(spaeterName).join(", ") + (notiz ? " – " + notiz : "");
      const patch = { status: "vorgemerkt", vorgemerkt: codes, vorgemerkt_am: new Date().toISOString(), wiedervorlage: null,
        naechster_schritt: "Später: " + codes.map(spaeterName).join(", "),
        interesse_produkte: [...new Set([...(l.interesse_produkte || []), ...codes.filter(c => INTERESSE.some(i => i[0] === c))])] };
      if (l.status !== "vorgemerkt") patch.vorgemerkt_status = l.status || "neu";
      try {
        if (ausAnruf) { aus(id); await ergebnis(id, "vorgemerkt", patch, text); }   // zählt als erreichter Anruf
        else { await store.leadUpdate(id, patch); await store.aktivitaet({ lead_id: id, typ: "status", text }); }
        schliessen(false); toast("Vorgemerkt – zu finden unter Leads → „Für später“"); zeige();
      } catch (err) { fehler(err); }
    });
  }
  async function reaktivieren(id) {
    const l = findLead(id) || {};
    const zurueck = l.vorgemerkt_status && !["vorgemerkt", "neu"].includes(l.vorgemerkt_status) ? l.vorgemerkt_status : "interesse";
    try {
      await store.leadUpdate(id, { status: zurueck, wiedervorlage: naechsterWerktag(0, 10).toISOString(), naechster_schritt: "Wieder aufgenommen: " + (l.vorgemerkt || []).map(spaeterName).join(", ") });
      await store.aktivitaet({ lead_id: id, typ: "status", text: "Aus „Für später“ wieder in die Arbeit geholt" });
      toast("Wieder in der Arbeit – steht heute in den Wiedervorlagen"); detail(id);
    } catch (err) { fehler(err); }
  }

  // „Leads laden“: Zielgruppe und Anzahl frei wählen – z. B. ein Nachmittagsblock Beauty statt der Wochenfokus-Gruppe
  async function ladenSheet() {
    let zahlen = {}; try { zahlen = await store.poolZahlen() || {}; } catch (e) { console.warn(e); }
    const fokusId = new Date().getDay() === 1 ? "handwerk" : (S.cfg || {}).fokus;
    const zgs = S.zg || [];
    const frei = z => zahlen[z.id] === undefined || zahlen[z.id] > 0;
    let wahl = (zgs.find(z => z.id === fokusId && frei(z)) || zgs.find(frei) || zgs[0] || {}).id, anzahl = schritt();
    const root = sheet("Leads laden", `
      <div class="lbl">Zielgruppe</div>
      <div class="chips" id="lz_zg">${zgs.map(z => `<button class="chip" type="button" data-zg="${z.id}" aria-pressed="${z.id === wahl}"${zahlen[z.id] === 0 ? " disabled" : ""}>${esc(z.name)}${z.id === fokusId ? " · Fokus" : ""} <small>(${zahlen[z.id] ?? "?"} frei)</small></button>`).join("")}</div>
      <div class="lbl" style="margin-top:14px">Wie viele?</div>
      <div class="chips" id="lz_n">${[10, 20, 50].map(n => `<button class="chip" type="button" data-n="${n}" aria-pressed="${n === anzahl}">${n}</button>`).join("")}</div>
      <p class="hint" id="lz_hint"></p>
      <div class="actions"><button class="btn primary block" type="button" id="lz_go">Laden</button></div>
      <p class="hint">Die geladenen Leads erscheinen unter „Neue Leads“ – bei mehreren Zielgruppen in der Liste kannst du oben filtern. Die Leads sind gemischt: höchstens 5 gleiche Betriebe am Stück.</p>`);
    const q = s => root.querySelector(s);
    const hinweis = () => { const z = zgs.find(x => x.id === wahl); q("#lz_hint").textContent = z && z.anrufzeit ? "Beste Anrufzeit: " + z.anrufzeit : ""; q("#lz_go").textContent = `${anzahl} ${z ? z.name : ""}-Leads laden`; };
    hinweis();
    root.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.zg) { wahl = b.dataset.zg; root.querySelectorAll("[data-zg]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); hinweis(); }
      if (b.dataset.n) { anzahl = +b.dataset.n; root.querySelectorAll("[data-n]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); hinweis(); }
      if (b.id === "lz_go") {
        b.disabled = true;
        try {
          const n = await store.nachladen(anzahl, wahl);
          const z = zgs.find(x => x.id === wahl);
          if (n) { S.neuFilter = wahl; toast(`${n} ${z ? z.name : ""}-Leads geladen`); } else toast("Für diese Zielgruppe ist gerade nichts frei – Nachschub kommt über Nacht.");
          schliessen(false); await zeige();
        } catch (err) { fehler(err); b.disabled = false; }
      }
    });
  }

  function neuerLead() {
    const root = sheet("Neuer Lead", `<form id="f" class="form">
      ${[["firma", "Firma *"], ["telefon", "Telefon"], ["branche", "Branche"], ["ort", "Ort"], ["ansprechpartner", "Ansprechpartner"], ["email", "E-Mail"], ["website", "Website"], ["plz", "PLZ"]].map(([k, t]) => `<div class="field${k === "firma" ? " full" : ""}"><label for="n_${k}">${t}</label><input id="n_${k}" name="${k}"${k === "firma" ? " required" : ""}></div>`).join("")}
      <div class="field"><label for="n_q">Quelle</label><select id="n_q" name="quelle"><option>Eigenrecherche</option><option>Empfehlung</option><option>Laufkundschaft</option><option>Messe</option><option>Sonstiges</option></select></div>
      <div class="field full"><label for="n_n">Notiz</label><input id="n_n" name="notiz"></div>
      <div class="full"><button class="btn primary block" type="submit">Lead anlegen</button></div></form>
      <p class="hint">Der Lead landet in deiner Liste unter „Heute“ im gerade gewählten Kanal (${esc((KANAELE.find(k => k[0] === kanal()) || [])[1] || "Telefon")}).</p>`);
    root.querySelector("#f").addEventListener("submit", async e => {
      e.preventDefault(); const fd = new FormData(e.target), d = {};
      for (const [k, v] of fd.entries()) d[k] = v.toString().trim() || null;
      if (d.website) d.website = d.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
      d.owner = S.view.kuerzel; d.zugeteilt_am = new Date().toISOString(); d.kanal = kanal(); d.prio = d.website ? 0 : 10; d.website_bewertung = d.website ? null : "keine";
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
    const vertr = frueher.length ? frueher[0].vertriebler : l.tippgeber ? "INH" : (l.owner || S.view.kuerzel);   // Empfehlung: Ziu verkauft, Tippgeber bekommt 25 %
    const tipp = frueher.length ? (frueher[0].tippgeber || "") : (l.tippgeber || "");
    const root = sheet((art === "folge" ? "Folgeauftrag · " : "Abschluss · ") + l.firma, `<form id="f" class="form">
      <div class="field full"><label for="p">Produkt</label><select id="p">${PRODUKTE.map(p => `<option value="${p.code}">${esc(p.name)} – ${eur(p.setup)} + ${eur(p.monat)}/Monat</option>`).join("")}</select></div>
      <div class="field" id="knw" hidden><label for="kn">Kanäle</label><input id="kn" type="number" min="1" max="6" step="1" inputmode="numeric" value="1"></div>
      <div class="field"><label for="s">Setup netto (€)</label><input id="s" type="number" step="0.01" min="0" inputmode="decimal" value="${PRODUKTE[0].setup}"${inhaber() ? "" : " readonly"}></div>
      <div class="field"><label for="m">Monatlich netto (€)</label><input id="m" type="number" step="0.01" min="0" inputmode="decimal" value="${PRODUKTE[0].monat}"${inhaber() ? "" : " readonly"}></div>
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
    const preis = () => { const p = PRODUKTE.find(x => x.code === q("#p").value), msg = p.code === "MSGBOT"; q("#knw").hidden = !msg;
      const n = msg ? Math.min(6, Math.max(1, Math.round(+q("#kn").value || 1))) : 1; q("#s").value = p.setup * n; q("#m").value = p.monat * n; calc(); };
    q("#p").addEventListener("change", preis); q("#kn").addEventListener("input", preis);
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
      <div class="meta"><span>${esc(pname(a))}</span><span class="money">${eur(a.setup)}</span>${+a.monatlich ? `<span>+ ${eur(a.monatlich)}/Monat</span>` : ""}</div>
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
  // Laufzeit: 12 Monate ab Livegang, Verlängerung je 12 Monate, Kündigungsfrist 3 Monate (wie Edge Function abo-kuendigen)
  const plusMonate = (d, n) => { const [y, m, t] = String(d).slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, t)).toISOString().slice(0, 10); };
  function laufzeitEnde(live, mindest, eingang) { let ende = plusMonate(live, mindest || 12); while (plusMonate(ende, -3) < eingang) ende = plusMonate(ende, 12); return ende; }
  const ZAHLUNG = { offen: "offen", bezahlt: "bezahlt ✓", fehlgeschlagen: "fehlgeschlagen ⚠" };
  const ABO = { aktiv: "aktiv", gekuendigt: "gekündigt (läuft bis Laufzeitende)", beendet: "beendet" };
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
        <div class="kv"><span>Produkt</span><b>${esc(pname(a))}</b></div>
        ${a.bezeichnung ? `<div class="kv"><span>Individuell</span><span>Basis: ${esc((PRODUKTE.find(p => p.code === a.produkt) || {}).name || a.produkt)}</span></div>` : ""}
        ${a.beschreibung ? `<div class="meta"><span style="white-space:pre-line">${esc(a.beschreibung)}</span></div>` : ""}
        <div class="kv"><span>Einrichtung</span><b class="money">${eur(a.setup)}</b></div>
        <div class="kv"><span>Monatlich</span>${+a.monatlich > 0 ? `<span class="money">${eur(a.monatlich)} · ${a.laufzeit_monate} Monate</span>` : "<span>ohne Abo</span>"}</div>
        <div class="kv"><span>Vertriebler</span><span>${esc(name(a.vertriebler))}${a.tippgeber ? " · Tipp: " + esc(a.tippgeber) : ""}</span></div>
        <div class="kv"><span>Zusage</span><span>${dDE(a.erstellt_am)}${a.beauftragt_am ? ` · beauftragt ${dDE(a.beauftragt_am)}` : ""}${a.live_am ? ` · live ${dDE(a.live_am)}` : ""}</span></div>
        ${a.notiz ? `<div class="meta"><span>Intern: ${esc(a.notiz)}</span></div>` : ""}
        ${a.zahlung_status || a.abo_status ? `<div class="kv"><span>Zahlung</span><span>${esc(ZAHLUNG[a.zahlung_status] || a.zahlung_status || "–")}${a.abo_status ? " · Abo " + esc(ABO[a.abo_status] || a.abo_status) : ""}</span></div>` : ""}
        ${a.beauftragt_name && a.zustimmung ? `<div class="kv"><span>Online zugestimmt</span><span>${esc(a.beauftragt_name)} · ${dDE(a.zustimmung.zeit)}</span></div>` : ""}
        ${a.live_am && +a.monatlich > 0 ? `<div class="kv"><span>Laufzeit</span><span>ab ${dDE(a.live_am)} · ${a.abo_ende ? `<b>gekündigt zum ${dDE(a.abo_ende)}</b>` : `nächstes Ende ${dDE(laufzeitEnde(a.live_am, a.laufzeit_monate, isoDate(new Date())))} (Kündigung bis ${dDE(plusMonate(laufzeitEnde(a.live_am, a.laufzeit_monate, isoDate(new Date())), -3))})`}</span></div>
          ${inhaber() ? `<div class="actions">${a.abo_ende ? `<button class="btn small" type="button" data-kuend-zurueck="${a.id}">Kündigung zurücknehmen</button>` : `<button class="btn small" type="button" data-kuendigen="${a.id}">Kündigung eintragen</button>`}</div>` : ""}` : ""}
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
      if (d.kuendigen) {
        e.stopPropagation();
        const ein = prompt("Kündigung eingegangen am (JJJJ-MM-TT):", isoDate(new Date())); if (!ein) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ein)) return toast("Bitte Datum als JJJJ-MM-TT eingeben");
        const ende = laufzeitEnde(a.live_am, a.laufzeit_monate, ein);
        if (!confirm(`Kündigung vom ${dDE(ein)} eintragen? Das Abo endet dann fristgerecht am ${dDE(ende)}` + (a.stripe_subscription_id ? " – bis dahin bucht Stripe normal weiter ab." : "."))) return;
        try { const r = await store.aboKuendigen({ auftrag_id: a.id, eingang: ein }); toast(`Gekündigt zum ${dDE(r.abo_ende || ende)}`); schliessen(false); auftragSheet(a.id); } catch (err) { toast("Nicht gespeichert: " + err.message); }
        return;
      }
      if (d.kuendZurueck) {
        e.stopPropagation(); if (!confirm("Kündigung wirklich zurücknehmen? Das Abo läuft dann normal weiter.")) return;
        try { await store.aboKuendigen({ auftrag_id: a.id, zuruecknehmen: true }); toast("Kündigung zurückgenommen"); schliessen(false); auftragSheet(a.id); } catch (err) { toast("Nicht gespeichert: " + err.message); }
        return;
      }
      if (d.beauftragen) { e.stopPropagation(); if (confirm(`${l.firma} hat verbindlich beauftragt (${pname(a)}, ${eur(a.setup)})? Damit gilt es als Abschluss.`)) await beauftragen(a); }
      if (d.stornieren) { e.stopPropagation(); if (confirm("Auftrag wirklich stornieren?" + (a.abschluss_id ? " Der Abschluss bleibt bestehen – bei Bedarf Storno im Vault anlegen." : ""))) await stufeSetzen(a, "storniert"); }
    });
  }
  async function stufeSetzen(a, stufe) {
    if (stufe === "live" && a.stripe_customer_id && +a.monatlich > 0 && !a.stripe_subscription_id
        && !confirm(`Website ist live? Damit startet das Abo über Stripe: ${eur(a.monatlich)} netto im Monat, erste Abbuchung sofort.`)) return;
    const patch = { stufe };
    if (stufe === "live") patch.live_am = isoDate(new Date());
    if (stufe === "onboarding") patch.onboarding_am = new Date().toISOString();
    if (stufe === "auftrag_raus") patch.gesendet_am = new Date().toISOString();
    try {
      await store.auftragUpdate(a.id, patch);
      await store.aktivitaet({ lead_id: a.lead_id, typ: "status", text: `Auftrag ${pname(a)}: ${STUFE[stufe][1]}` });
      if (stufe === "live") feiern("Live!", `${(a.lead && a.lead.firma) || ""} ist online.` + (a.stripe_customer_id && +a.monatlich > 0 && !a.stripe_subscription_id ? " Das Abo startet jetzt." : ""));
      else toast(STUFE[stufe][1]);
      schliessen(false); zeige("auftraege");
    } catch (err) { fehler(err); }
  }
  async function beauftragen(a) {
    try {
      const l = await store.lead(a.lead_id);
      const art = (l._deals || []).some(d => d.art !== "storno") ? "folge" : "neu";
      const d = { lead_id: l.id, kunde_firma: l.firma, produkt: a.produkt, art, setup: +a.setup || 0, monatlich: +a.monatlich || 0,
        datum: isoDate(new Date()), vertriebler: a.vertriebler, tippgeber: a.tippgeber || null, notiz: [a.bezeichnung, a.notiz].filter(Boolean).join(" · ") || null };
      const deal = await store.dealAnlegen(d);
      await store.auftragUpdate(a.id, { stufe: "beauftragt", beauftragt_am: new Date().toISOString(), beauftragt_name: "manuell bestätigt", abschluss_id: deal && deal.id });
      if (l.status !== "gewonnen") await store.leadUpdate(l.id, { status: "gewonnen", wiedervorlage: null, naechster_schritt: "Onboarding-Gespräch" });
      await store.aktivitaet({ lead_id: l.id, typ: "status", ergebnis: "gewonnen", text: "Beauftragt: " + pname(a) });
      schliessen(false); zeige("auftraege");
      const pv = provision(d);
      feiern("Beauftragt!", `${l.firma} · ${pname(a)}` + (pv.an && pv.an === S.view.kuerzel ? ` · +${eur(pv.betrag)} Provision` : ` · ${eur(d.setup)} Einrichtung`));
    } catch (err) { fehler(err); }
  }
  function zusageSheet(id) {
    const l = S.data.detail; if (!l || l.id !== id) return;
    const frueher = (l._deals || []).filter(d => d.art !== "storno");
    const vertr = frueher.length ? frueher[0].vertriebler : l.tippgeber ? "INH" : (l.owner || S.view.kuerzel);   // Empfehlung: Ziu verkauft, Tippgeber bekommt 25 %
    const tipp = frueher.length ? (frueher[0].tippgeber || "") : (l.tippgeber || "");
    const vorschlag = PRODUKTE.find(p => (l.interesse_produkte || []).includes(p.code)) || PRODUKTE[0];
    const root = sheet("Zusage · " + l.firma, `<form id="f" class="form">
      <p class="hint full" style="margin:0">Der Kunde hat am Telefon Ja gesagt. Das ist noch kein Abschluss – der zählt, sobald er beauftragt (Vertrag bzw. Online-Auftrag).</p>
      ${inhaber() ? `<label class="check full"><input id="ind" type="checkbox"><span><b>Individuell</b> – eigener Preis, eigene Bezeichnung (z. B. nur Website ohne Hosting, verhandelter Preis) – nur für dich sichtbar</span></label>` : ""}
      <div class="field full"><label for="p" id="p_l">Produkt</label><select id="p">${PRODUKTE.map(p => `<option value="${p.code}"${p.code === vorschlag.code ? " selected" : ""}>${esc(p.name)} – ${eur(p.setup)} + ${eur(p.monat)}/Monat</option>`).join("")}</select></div>
      <div class="field" id="knw" hidden><label for="kn">Kanäle (WhatsApp, Instagram …)</label><input id="kn" type="number" min="1" max="6" step="1" inputmode="numeric" value="1"></div>
      <div class="field full" data-ind hidden><label for="bz">Bezeichnung (sieht der Kunde im Angebot und auf der Rechnung)</label><input id="bz" maxlength="120" placeholder="z. B. Website ohne Hosting (Einmalkauf)"></div>
      <div class="field full" data-ind hidden><label for="bs">Leistungsumfang (sieht der Kunde, optional)</label><textarea id="bs" rows="3" placeholder="z. B. 5 Unterseiten, Kontaktformular, Übergabe der Dateien – Hosting übernimmt der Kunde selbst"></textarea></div>
      <div class="field"><label for="s">Einrichtung netto (€)</label><input id="s" type="number" step="0.01" min="0" inputmode="decimal" value="${vorschlag.setup}" readonly></div>
      <div class="field"><label for="m">Monatlich netto (€)</label><input id="m" type="number" step="0.01" min="0" inputmode="decimal" value="${vorschlag.monat}" readonly></div>
      <div class="field"><label for="lz">Laufzeit (Monate)</label><input id="lz" type="number" min="1" step="1" inputmode="numeric" value="12" readonly></div>
      <div class="field"><label for="v">Vertriebler</label>${inhaber() && !frueher.length ? `<select id="v">${S.team.map(t => `<option value="${t.kuerzel}"${t.kuerzel === vertr ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select>` : `<input id="v" value="${esc(vertr)}" readonly>`}</div>
      ${inhaber() ? `<div class="field full" id="tw"><label for="tg">Tippgeber (nur bei Tipp direkt an Ziu)</label><input id="tg" value="${esc(tipp)}"${frueher.length ? " readonly" : ""}></div>` : ""}
      <p class="hint full" id="ind_hint" hidden></p>
      <div class="field full"><label for="nz">Interne Notiz (sieht der Kunde nicht – z. B. Verhandlung, Rabatt, Starttermin)</label><textarea id="nz" rows="2"></textarea></div>
      <div class="full"><button class="btn primary block" type="submit">Zusage speichern</button></div></form>`, id);
    const q = s => root.querySelector(s);
    const tw = () => { if (q("#tw")) q("#tw").hidden = q("#v").value !== "INH"; }; tw(); q("#v").addEventListener("change", tw);
    const katalog = () => PRODUKTE.find(x => x.code === q("#p").value);
    const ind = () => !!(q("#ind") && q("#ind").checked);   // Individuell nur für den Inhaber (Datenbank prüft das zusätzlich)
    // Katalogpreis; Messaging-Bot je Kanal
    const kanaele = () => { const zeig = q("#p").value === "MSGBOT" && !ind(); q("#knw").hidden = !zeig; return zeig ? Math.min(6, Math.max(1, Math.round(+q("#kn").value || 1))) : 1; };
    const katalogPreis = () => { const p = katalog(), n = kanaele(); q("#s").value = p.setup * n; q("#m").value = p.monat * n; };
    q("#kn").addEventListener("input", () => { if (!ind()) katalogPreis(); });
    kanaele();
    const hinweis = () => {
      if (!ind()) return;
      const p = katalog(), s_ = +q("#s").value || 0, m_ = +q("#m").value || 0, t = [];
      if (s_ !== p.setup) t.push(`Einrichtung ${s_ < p.setup ? "−" : "+"}${eur(Math.abs(s_ - p.setup))} ggü. Katalog`);
      if (m_ !== p.monat) t.push(m_ === 0 ? "ohne Abo (kein Hosting/keine Pflege, keine Laufzeit)" : `monatlich ${m_ < p.monat ? "−" : "+"}${eur(Math.abs(m_ - p.monat))} ggü. Katalog`);
      q("#ind_hint").textContent = t.length ? t.join(" · ") + ". Provision richtet sich nach dem tatsächlichen Einrichtungspreis." : "Preise wie im Katalog.";
      q("#lz").closest(".field").hidden = m_ === 0;
    };
    if (q("#ind")) q("#ind").addEventListener("change", () => {
      const an = q("#ind").checked; kanaele();
      root.querySelectorAll("[data-ind]").forEach(x => { x.hidden = !an; });
      ["#s", "#m", "#lz"].forEach(x => { q(x).readOnly = !an; });
      q("#ind_hint").hidden = !an; q("#p_l").textContent = an ? "Basis-Produkt (für Vertrag, Provision und Auswertung)" : "Produkt";
      if (an) { if (!q("#bz").value) q("#bz").value = katalog().name.replace(/^Stufe \d · /, "").replace(/ \(einzeln\)$/, ""); q("#bz").focus(); hinweis(); }
      else { katalogPreis(); q("#lz").value = 12; q("#lz").closest(".field").hidden = false; }
    });
    ["#s", "#m"].forEach(x => q(x).addEventListener("input", hinweis));
    q("#p").addEventListener("change", () => { if (!ind()) katalogPreis(); else kanaele(); hinweis(); });
    q("#f").addEventListener("submit", async e => {
      e.preventDefault();
      const indi = ind(), m_ = +q("#m").value || 0;
      if (indi && !q("#bz").value.trim()) { toast("Bitte eine Bezeichnung für den Kunden eintragen"); return q("#bz").focus(); }
      const a = { lead_id: l.id, produkt: q("#p").value, setup: +q("#s").value || 0, monatlich: m_, laufzeit_monate: m_ > 0 ? (+q("#lz").value || 12) : 12,
        bezeichnung: indi ? q("#bz").value.trim() : null, beschreibung: indi ? (q("#bs").value.trim() || null) : null,
        vertriebler: q("#v").value, tippgeber: q("#tg") && q("#v").value === "INH" ? (q("#tg").value.trim() || null) : null, notiz: q("#nz").value.trim() || null, stufe: "zusage" };
      try {
        await store.auftragAnlegen(a);
        await store.leadUpdate(l.id, { status: "angebot", wiedervorlage: naechsterWerktag(3, 10).toISOString(), naechster_schritt: "Beauftragung nachfassen" });
        await store.aktivitaet({ lead_id: l.id, typ: "status", ergebnis: "angebot", text: `Zusage: ${pname(a)}${indi ? " (individuell)" : ""}${kanaele() > 1 ? ` (${kanaele()} Kanäle)` : ""} (${eur(a.setup)}${m_ > 0 ? ` + ${eur(m_)}/Monat` : ""})` });
        schliessen(false); zeige("auftraege");
        feiern("Zusage!", `${l.firma} · ${pname(a)} – jetzt Auftrag raus.`, false);
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
    ansprechpartner: ["ansprechpartner", "contact_name", "owner_name", "full_name"], bewertung_google: ["rating", "bewertung"], bewertungen: ["reviews", "bewertungen"], place_id: ["place_id"], quelle: ["quelle"], notiz: ["notizen", "notiz", "notes"] };
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
        <p class="hint">${inhaber() ? "Beides steht in allen Info-Mails und auf der Auftragsseite – nach außen erscheinst immer du." : "Nur intern: Nach außen (Mails, Auftragsseite) erscheint immer Ziu mit seiner Nummer und seinem Terminlink."}</p>
        <details id="calcom"><summary>Cal.com mit der App verbinden (einmalig)</summary><div id="calcomin" class="hint">Lädt …</div></details></div>`; })()}
      ${inhaber() && store.mode === "live" ? `<h2 class="sec">Partner & Empfehlungslinks</h2><div class="block" id="partnerblock"><p class="hint">Lädt …</p></div>` : ""}
      <h2 class="sec">Benachrichtigungen</h2><div class="block" id="pushblock">${pushHTML()}</div>
      ${store.mode === "live" ? `<h2 class="sec">Passwort ändern</h2><div class="block"><form id="pwneu" class="form"><div class="field"><label for="pn1">Neues Passwort</label><input id="pn1" type="password" autocomplete="new-password" minlength="8" required></div><div class="field" style="justify-content:flex-end"><button class="btn small" type="submit">Speichern</button></div></form></div>` : ""}
      <h2 class="sec">Darstellung</h2><div class="seg" role="group" aria-label="Design">
        <button type="button" data-theme-set="dark" aria-pressed="${aktuellesTheme() === "dark"}">Dunkel</button><button type="button" data-theme-set="light" aria-pressed="${aktuellesTheme() === "light"}">Hell</button></div>
      <h2 class="sec">Neu in der App</h2><div class="actions"><button class="btn" type="button" id="neu_alle">Was ist neu?</button></div>
      <h2 class="sec">App aufs Handy</h2><div class="block"><p class="hint" style="margin:0">iPhone (Safari): Teilen → „Zum Home-Bildschirm“. Android (Chrome): Menü ⋮ → „App installieren“.</p></div>
      <div class="actions">${store.mode === "demo" ? `<button class="btn" type="button" id="reset">Demo zurücksetzen</button>` : `<button class="btn danger" type="button" id="logout">Abmelden</button>`}</div>`);
    let ziel = null;
    root.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "logout") { await store.signOut(); location.reload(); }
      if (b.id === "pushan") { b.disabled = true; await pushAktivieren(); root.querySelector("#pushblock").innerHTML = pushHTML(); }
      if (b.id === "pushaus") { await pushDeaktivieren(); root.querySelector("#pushblock").innerHTML = pushHTML(); }
      if (b.id === "neu_alle") { schliessen(false); return neuesZeigen(true); }
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
    const pb = root.querySelector("#partnerblock");
    if (pb) store.partnerLinks().then(ps => {
      pb.innerHTML = (ps || []).map(p => { const seite = new URL("partner.html?t=" + encodeURIComponent(p.token), location.href).href; return `
        <div class="kv"><b>${esc(p.name)}</b><span class="meta">${esc(p.tippgeber_id)}${p.aktiv ? "" : " · inaktiv"}</span></div>
        <div class="kv"><span class="v" style="word-break:break-all">${esc(p.link)}</span><button class="btn small" type="button" data-copy="${esc(p.link)}">Link kopieren</button></div>
        <div class="kv"><span class="meta">Private Seite für ${esc(p.name.split(" ")[0])} (Anfragen, Kunden, Provision)</span><button class="btn small" type="button" data-copy="${esc(seite)}">Seite kopieren</button></div>`; }).join("")
        + `<p class="hint">Wer über den Link den Check macht oder schreibt, wird automatisch als Empfehlung eingetragen – sofern der Betrieb noch unberührt war. 25 % auf jede Einrichtung, keine Rabatte für Geworbene. Neue Partner: Partner-Notiz im Vault + Eintrag in der Tabelle partner.</p>`;
    }).catch(() => { pb.innerHTML = `<p class="hint">Konnte nicht geladen werden.</p>`; });
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
      if (ds.oc === "nicht" || ds.oc === "kein" || ds.oc === "weg") { const imSheet = !!t.closest(".sheet"); if (imSheet) schliessen(false); await schnell(id, ds.oc); if (imSheet) zeige(); return; }
      if (ds.oc === "info") return infoSheet(id);
      if (ds.oc === "ja") return interesseSheet(id, "termin");
      if (ds.oc === "rueckruf") return interesseSheet(id, "rueckruf");
    }
    if (ds.prod) { t.setAttribute("aria-pressed", String(t.getAttribute("aria-pressed") !== "true")); return; }
    if (ds.mit) { t.setAttribute("aria-pressed", String(t.getAttribute("aria-pressed") !== "true")); return; }
    if (ds.deal) return dealSheet(+ds.deal);
    if (ds.zusage) return zusageSheet(+ds.zusage);
    if (ds.demoinfo) return demoSheet(+ds.demoinfo);
    if (ds.wahl) { t.closest(".wahl").querySelectorAll("[data-wahl]").forEach(b => b.setAttribute("aria-pressed", String(b === t))); return; }
    if (ds.entwurfok) {
      const box = t.closest(".entwuerfe-box"), g = box.querySelector("[data-wahl][aria-pressed=true]"), fb = box.querySelector(".feedback").value.trim();
      if (!g) return toast("Bitte erst einen Entwurf (A/B/C) antippen.");
      try { await store.entwurfWaehlen(+ds.entwurfok, { gewaehlt: g.dataset.wahl, feedback: fb || null }); toast("Auswahl gespeichert – Ziu/Claude baut Entwurf " + g.dataset.wahl.toUpperCase() + " aus"); detail(S.data.detail.id); } catch (err) { fehler(err); }
      return;
    }
    if (ds.entwurfneu) { try { await store.entwurfWaehlen(+ds.entwurfneu, { status: "entwuerfe" }); detail(S.data.detail.id); } catch (err) { fehler(err); } return; }
    if (ds.auftrag) return auftragSheet(+ds.auftrag);
    if (ds.setstatus) { try { await store.leadUpdate(id, { status: ds.setstatus, wiedervorlage: naechsterWerktag(3, 10).toISOString(), naechster_schritt: "Nachfassen Angebot" }); await store.aktivitaet({ lead_id: id, typ: "status", ergebnis: ds.setstatus }); toast("Status: Angebot"); detail(id); } catch (err) { fehler(err); } return; }
    if (ds.sperren) { try { await store.leadUpdate(+ds.sperren, { gesperrt: true, wiedervorlage: null }); await store.aktivitaet({ lead_id: +ds.sperren, typ: "status", text: "Keine Werbung gewünscht – gesperrt" }); toast("Gesperrt"); detail(+ds.sperren); } catch (err) { fehler(err); } return; }
    if (ds.askdel) { $("#delwrap").innerHTML = `<div class="confirm">Lead endgültig löschen? <button class="btn danger small" type="button" data-dodel="${ds.askdel}">Ja, löschen</button><button class="btn small" type="button" data-nodel="${ds.askdel}">Abbrechen</button></div>`; return; }
    if (ds.nodel) { $("#delwrap").innerHTML = `<button class="btn danger small" type="button" data-askdel="${ds.nodel}">Lead löschen</button>`; return; }
    if (ds.dodel) { try { await store.leadLoeschen(+ds.dodel); schliessen(); toast("Gelöscht"); } catch (err) { fehler(err); } return; }
    if (ds.terminok || ds.terminab) { try { await store.terminUpdate(+(ds.terminok || ds.terminab), { status: ds.terminok ? "erledigt" : "abgesagt" }); toast(ds.terminok ? "Termin erledigt" : "Termin abgesagt"); zeige(); } catch (err) { fehler(err); } return; }
    if (ds.pay || ds.payout) { try { await store.dealUpdate(+(ds.pay || ds.payout), { [ds.pay ? "zahlung_eingegangen" : "provision_ausgezahlt"]: isoDate(new Date()) }); toast("Eingetragen"); zeige(); } catch (err) { fehler(err); } return; }
    if (ds.infomail) return mailErlaubt() ? infoMailSheet(+ds.infomail) : toast("Mails verschickt Ziu");
    if (ds.mailok) { try { await store.leadUpdate(+ds.mailok, { info_mail: "gesendet" }); await store.aktivitaet({ lead_id: +ds.mailok, typ: "mail", text: "Info-Mail gesendet" }); toast("Als gesendet markiert"); schliessen(); } catch (err) { fehler(err); } return; }
    if (ds.demo) { try { await store.leadUpdate(id, { demo_website: ds.demo }); toast("Demo-Website: " + (ds.demo === "fertig" ? "fertig" : "in Arbeit")); zeige(); } catch (err) { fehler(err); } return; }
    if (ds.copy) { try { await navigator.clipboard.writeText(ds.copy); toast("Kopiert"); } catch (err) { toast(ds.copy); } return; }
    if (t.id === "more") return ladenSheet();
    if (ds.kanal) { if (!kanaele().some(k => k[0] === ds.kanal)) return; S.kanal = ds.kanal; lsSet(KANAL_KEY, ds.kanal); S.neuFilter = null; window.scrollTo(0, 0); return zeige(); }
    if (ds.kanalladen) return kanalLadenSheet(ds.kanalladen);
    if (ds.erstmail) return mailErlaubt() ? erstMailSheet(+ds.erstmail, ds.art || "erst") : toast("Mails verschickt Ziu");
    if (ds.zutelefon) return zuTelefon(+ds.zutelefon);
    if (t.dataset && "voort" in t.dataset) { S.voOrt = t.dataset.voort || null; return zeige(); }
    if (ds.spaeter) return spaeterSheet(+ds.spaeter, ds.anruf === "1");
    if (ds.reaktiv) return reaktivieren(+ds.reaktiv);
    if (t.dataset && "spaeterprod" in t.dataset) { S.spaeterProd = t.dataset.spaeterprod || null; return zeige(); }
    if (t.dataset && "neufilter" in t.dataset) { S.neuFilter = t.dataset.neufilter || null; return zeige(); }
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
  document.addEventListener("change", async e => {
    if (e.target.id === "csvin" && e.target.files[0]) return csvImport(e.target.files[0]);
    if (e.target.dataset && e.target.dataset.ns) {
      const id = +e.target.dataset.ns, wert = e.target.value || null, l = findLead(id) || {};
      try {
        const patch = { naechster_schritt: wert };
        if (wert === "Demo bauen" && !l.demo_website) patch.demo_website = "offen";
        await store.leadUpdate(id, patch); Object.assign(l, patch);
        await store.aktivitaet({ lead_id: id, typ: "notiz", text: "Nächster Schritt: " + (wert || "–") });
        if (wert === "Demo bauen") { toast("Demo-Wunsch an Ziu – kurz die Infos erfassen"); demoSheet(id); } else toast("Nächster Schritt gespeichert");
      } catch (err) { fehler(err); }
    }
  });
  let qT; document.addEventListener("input", e => { if (e.target.id === "q") { S.q = e.target.value; clearTimeout(qT); qT = setTimeout(async () => { const pos = e.target.selectionStart; await zeige(); const q = $("#q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } }, 300); } });

  // ---------------------------------------------------------------- Neu in der App (Patchnotes)
  // Bei JEDEM App-Update oben einen Eintrag ergänzen (neueste zuerst, v = Datum JJJJ-MM-TT, bei mehreren am Tag „-2“ usw.).
  // Nur, was für Ziu/Elias im Alltag wichtig ist – kurz, in Stichpunkten. { t, nur: "inhaber" } = nur für Ziu sichtbar.
  const NEUES = [
    { v: "2026-10-07", titel: "Neu: Vor Ort, Nächster Schritt & Demo-Alarm", punkte: [
      "Oben in „Heute“ wählst du jetzt den <b>Kanal</b>. „Telefon“ ist alles wie bisher.",
      "<b>Vor Ort</b>: nur Betriebe <b>in der Innenstadt</b> (zu Fuß erreichbar) <b>ohne Website oder mit klar veralteter Seite</b> – <b>Jena zuerst</b>, dann Weimar, Erfurt, Gera, Leipzig. Die Liste ist als Laufweg sortiert, mit nummerierter <b>Laufroute in Google Maps</b> (bei vielen Betrieben in Etappen à 10 Stopps).",
      "Vor Ort gibt es „Demo zeigen“, „Vorab-Demo“ (Ziu baut vorher eine eigene Demo für den Betrieb) und „Zusage!“. Nach 2× nicht angetroffen geht der Betrieb ans Telefon.",
      "<b>Nächster Schritt</b> ist jetzt auf jeder Karte eine Auswahl (Anrufen, Demo bauen, Angebot schicken …). „Demo bauen“ meldet den Wunsch direkt an Ziu.",
      "<b>👀 Demo angesehen</b>: Jeder Betrieb hat einen persönlichen Demo-Link („Link kopieren“, Details). Öffnet er ihn, kommt sofort eine Push-Nachricht – perfekter Moment zum Anrufen.",
      { t: "<b>E-Mail-Kanal (nur für dich)</b>: Betriebe mit Mail-Adresse – die App sucht Adressen selbst auf Website und Impressum. „Mail schreiben“ mit Vorlage oder <b>✨ Claude</b>, Versand als <b>gestaltete Mail im INFINERO-Look</b> mit neuer Signatur. Nach 4 Werktagen Nachfass-Mail, danach geht der Betrieb ans Telefon.", nur: "inhaber" },
      { t: "Mails (Info-Mail, Online-Auftrag per Mail, Erstkontakt) kann nur noch Ziu verschicken – Vertriebler sehen keine Mail-Knöpfe, den Auftragslink können sie weiter kopieren.", nur: "inhaber" },
    ] },
    { v: "2026-10-06", titel: "Empfehlungslinks (Partner)", punkte: [
      "Wer über einen <b>Empfehlungslink</b> (z. B. von Jörg) auf infinero.de kommt und den Check macht oder schreibt, ist in der App mit <b>„Empfehlung: Jörg“</b> markiert.",
      "Es zählt, wer zuerst da war: War der Betrieb schon bei uns in Arbeit, gibt es keine Empfehlung.",
      { t: "Beim Abschluss wird der Tippgeber automatisch eingetragen (25 % auf die Einrichtung, keine Rabatte). Links und Jörgs private Übersichtsseite: Profil → „Partner & Empfehlungslinks“.", nur: "inhaber" },
    ] },
    { v: "2026-10-05-4", titel: "Nach außen spricht INFINERO mit einer Stimme", punkte: [
      "Info-Mails, Auftrags-Mails und die Auftragsseite für Kunden sind jetzt <b>immer von Ziu (Inhaber)</b> unterschrieben – mit Zius Telefonnummer und Terminlink.",
      "Hat Elias angerufen, steht in der Mail „mein Kollege“ – ohne Namen.",
      "Website-Anfragen von infinero.de landen bei Ziu.",
      { t: "Intern bleibt alles wie gehabt: Elias sieht seine Leads, Anrufe und Statistik. Umstellen: vertrieb_config.inbound_owner bzw. Absender in infomail/mailsenden/auftrag.", nur: "inhaber" },
    ] },
    { v: "2026-10-05-3", titel: "Website-Anfragen landen automatisch in der App", punkte: [
      "Wer auf infinero.de den <b>Sichtbarkeits-Check</b> macht oder das <b>Kontaktformular</b> nutzt, steht sofort als Lead in „Heute“ – ganz oben, markiert mit <b>„Website-Anfrage“</b>.",
      "Ihr bekommt eine Push-Nachricht: „Neuer Website-Lead … – Rückruf gewünscht“ bzw. „– per E-Mail“.",
      "Im Lead stehen Score, Kategorien und die 3 wichtigsten Hebel aus dem Check – perfekt als Gesprächseinstieg.",
      "Der Interessent hat eine Antwort <b>innerhalb eines Werktags</b> versprochen bekommen: bitte am selben bzw. nächsten Werktag melden.",
      "Wichtig: Die Person hat <b>keine Werbe-Einwilligung</b> gegeben – Antwort auf die Anfrage ja, Newsletter nein.",
    ] },
    { v: "2026-10-05-2", titel: "Google-Maps-Link", punkte: [
      "Auf jeder Anrufkarte und im Lead: <b>„Google Maps ↗“</b> öffnet den Eintrag des Betriebs – mit Sternen und Anzahl Bewertungen, wenn bekannt.",
      "Ideal für den Kundenblick vor dem Anruf: Fotos, Bewertungen, Öffnungszeiten, Speisekarte auf einen Blick.",
    ] },
    { v: "2026-10-05", titel: "„Für später“-Pool", punkte: [
      "Neuer Knopf <b>„Für später“</b> auf jeder Anrufkarte und im Lead: Betriebe, die sich für KI-Caller, WhatsApp-Bot oder Web-Chatbot interessieren, kommen in einen eigenen Pool – ohne Wiedervorlage.",
      "Finden: Reiter <b>Leads → „Für später“</b>, dort nach Produkt filtern.",
      "Wenn wir das Produkt anbieten: Lead öffnen → „Wieder in die Arbeit holen“.",
      "Vom Anruf aus vorgemerkt zählt als erreichter Anruf.",
    ] },
    { v: "2026-10-04", titel: "Neue Preise: Website „Sichtbar“", punkte: [
      "Website jetzt <b>1.490 € einmalig + 99 €/Monat</b>: Website-Flatrate <b>plus Sichtbarkeit</b> bei Google, Google Maps und in der KI-Suche (ChatGPT & Co.), mit monatlichem Bericht.",
      "Das alte Angebot 990 € / 59 € gibt es nicht mehr.",
      "Leiter neu: Stufe 2 = 2.180 € / 159 € · Stufe 3 = 2.870 € / 239 € · Stufe 4 = 3.860 € / 439 € (Aufpreise wie bisher).",
      "Deine Provision für eine Website: <b>745 €</b>.",
      "Info-Mail und Online-Auftrag erklären die Sichtbarkeit automatisch mit.",
      "Neu: Diese Übersicht kommt nach jedem Update. Später nochmal lesen: Profil (Name oben rechts) → „Was ist neu?“",
    ] },
    { v: "2026-10-01", titel: "Leads laden nach Wunsch", punkte: [
      "„+ Leads laden“ unten in „Heute“: Zielgruppe (Handwerk, Beauty, Restaurants) und Anzahl (10/20/50) frei wählen – z. B. ein Nachmittagsblock Restaurants.",
      "Über „Neue Leads“ filtern, wenn mehrere Zielgruppen in der Liste sind.",
      "Gut gemischt: höchstens 5 gleiche Betriebe am Stück.",
    ] },
    { v: "2026-09-29", titel: "Zusage & Aufträge", punkte: [
      "Preise in der Zusage sind fest (Katalog). Beim Messaging-Bot trägst du die Anzahl der Kanäle ein.",
      "Rabatte und Sonderwünsche: nichts zusagen, an Ziu geben.",
      { t: "Individuelles Angebot (eigener Preis, eigene Bezeichnung, auch ohne Abo) – nur für dich sichtbar.", nur: "inhaber" },
      "Die Notiz im Auftrag ist intern – der Kunde sieht sie nicht.",
    ] },
  ];
  const NEU_KEY = "infinero-neu-gesehen";
  const binInhaber = () => (S.profil && S.profil.rolle === "inhaber") || inhaber();
  function neuesZeigen(alle = false) {
    const gesehen = lsGet(NEU_KEY);
    const liste = NEUES.filter(n => alle || !gesehen || n.v > gesehen).slice(0, alle ? 30 : 3)
      .map(n => ({ ...n, punkte: n.punkte.filter(x => typeof x === "string" || !x.nur || binInhaber()).map(x => typeof x === "string" ? x : x.t) }));
    lsSet(NEU_KEY, NEUES[0].v);
    if (!liste.length) return;
    const datum = v => new Date(v.slice(0, 10) + "T12:00").toLocaleDateString("de-DE", { day: "numeric", month: "long" });
    const root = sheet(alle ? "Was ist neu?" : "Neu in der App ✨", `${liste.map(n => `<div class="block neu-notes">
        <div class="kv"><b>${esc(n.titel)}</b><span class="meta">${esc(datum(n.v))}</span></div>
        <ul>${n.punkte.map(x => `<li>${x}</li>`).join("")}</ul></div>`).join("")}
      <div class="actions"><button class="btn primary block" type="button" id="neu_ok">Alles klar</button></div>`);
    root.querySelector("#neu_ok").addEventListener("click", () => schliessen(false));
  }

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
    try { S.partner = await store.partner(); } catch (e) { console.warn(e); S.partner = []; }
    const gespeichert = lsGet(ANSICHT_KEY);
    const start = darfWechseln() && S.team.some(m => m.kuerzel === gespeichert) ? gespeichert : (store.mode === "demo" ? "EF" : p.kuerzel);
    S.view = S.team.find(m => m.kuerzel === start) || S.team.find(m => m.kuerzel === p.kuerzel) || { ...p };
    store.setAnsicht(S.view.kuerzel); kopf();
    if (store.mode === "demo") $("#banner").innerHTML = `<div class="banner">Demo-Modus: Beispieldaten nur auf diesem Gerät. Ansicht wechseln über den Namen oben rechts.</div>`;
    const h = location.hash.slice(1), erlaubt = ["heute", "leads", "termine", "auftraege", "deals", "statistik", ...(inhaber() ? ["cockpit"] : [])];
    await zeige(erlaubt.includes(h) ? h : h === "prov" ? "deals" : "heute");
    if (/^lead\/\d+$/.test(h)) { history.replaceState(null, "", location.pathname); detail(+h.split("/")[1]); }   // Push „Entwürfe fertig“ öffnet den Lead
    neuesZeigen();   // Patchnotes einmal nach jedem Update
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
  start();
})();
