/* INFINERO Vertrieb – Datenschicht.
 * LiveStore: Supabase (gemeinsame Daten für Ziu & Elias).
 * DemoStore: Beispieldaten nur auf diesem Gerät, solange config.js leer ist. */
(function () {
  "use strict";

  const OFFEN = ["nicht_erreicht", "rueckruf", "info_angefragt", "interesse", "termin", "angebot"];
  const tagStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const tagEnde = (d = new Date()) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

  // ------------------------------------------------------------------ Live
  class LiveStore {
    constructor(cfg) {
      this.mode = "live";
      this.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
      this.profil = null; this.ansicht = null;
    }
    setAnsicht(k) { this.ansicht = k; }
    get k() { return this.ansicht || this.profil.kuerzel; }
    async _check(p) { const { data, error } = await p; if (error) throw error; return data; }
    async session() {
      const { data } = await this.sb.auth.getSession();
      if (!data.session) return null;
      const rows = await this._check(this.sb.from("profiles").select("*").eq("id", data.session.user.id));
      this.profil = rows[0] || { ohneZugang: true, email: data.session.user.email };
      return this.profil;
    }
    async anmelden(email, password) { await this._check(this.sb.auth.signInWithPassword({ email, password })); return this.session(); }
    async passwortAendern(password) { await this._check(this.sb.auth.updateUser({ password })); }
    async signOut() { await this.sb.auth.signOut(); this.profil = null; }
    async team() { return this._check(this.sb.from("profiles").select("kuerzel,name,rolle,tagesziel,telefon,termin_link").order("rolle", { ascending: false })); }

    async tageslisteStart() { return this._check(this.sb.rpc("tagesliste_start")); }
    async nachladen(n, zielgruppe = null) { return this._check(this.sb.rpc("leads_nachladen", { anzahl: n, fuer: this.k, zielgruppe })); }
    async poolZahlen() { return this._check(this.sb.rpc("pool_verfuegbar")); }

    async heute() {
      const k = this.k, s = tagStart().toISOString(), e = tagEnde().toISOString();
      const [termine, faellig, neue, anrufe] = await Promise.all([
        this._check(this.sb.from("termine").select("*, lead:leads(id,firma,telefon,ort,strasse,plz)")
          .contains("mit", [k]).eq("status", "geplant").gte("beginn", s).lte("beginn", e).order("beginn")),
        this._check(this.sb.from("leads").select("*").eq("owner", k).in("status", OFFEN).eq("gesperrt", false)
          .lte("wiedervorlage", e).order("wiedervorlage")),
        this._check(this.sb.from("leads").select("*").eq("owner", k).eq("status", "neu").eq("gesperrt", false)
          .order("prio", { ascending: false }).order("reihe", { ascending: true, nullsFirst: false }).order("id").limit(1000)),
        this.sb.from("aktivitaeten").select("id", { count: "exact", head: true }).eq("von", k).eq("typ", "anruf").gte("zeit", s),
      ]);
      return { termine, faellig, neue, anrufe: anrufe.count || 0 };
    }
    async leads({ q = "", filter = "offen", nurEigene = false, produkt = null } = {}) {
      let x = this.sb.from("leads").select("*").order("geaendert_am", { ascending: false }).limit(300);
      if (nurEigene) x = x.eq("owner", this.k);
      if (!(this.profil.rolle === "inhaber" && filter === "pool")) x = x.not("owner", "is", null);
      if (filter === "offen") x = x.in("status", OFFEN).eq("gesperrt", false);
      else if (filter === "info") x = x.eq("status", "info_angefragt");
      else if (filter === "interesse") x = x.in("status", ["interesse", "termin", "angebot"]);
      else if (filter === "kunden") x = x.eq("status", "gewonnen");
      else if (filter === "zu") x = x.or("gesperrt.eq.true,status.in.(kein_interesse,kein_kontakt)");
      else if (filter === "pool") x = x.is("owner", null);
      else if (filter === "mein") x = x.eq("owner", this.k);
      else if (filter === "spaeter") { x = x.eq("status", "vorgemerkt"); if (produkt) x = x.contains("vorgemerkt", [produkt]); }
      if (q) { const s = q.replace(/[%,()]/g, " ").trim(); x = x.or(`firma.ilike.%${s}%,ort.ilike.%${s}%,branche.ilike.%${s}%,telefon.ilike.%${s}%,website.ilike.%${s}%`); }
      return this._check(x);
    }
    async lead(id) {
      const [l, akt, ter, deals, auf] = await Promise.all([
        this._check(this.sb.from("leads").select("*").eq("id", id).single()),
        this._check(this.sb.from("aktivitaeten").select("*").eq("lead_id", id).order("zeit", { ascending: false }).limit(50)),
        this._check(this.sb.from("termine").select("*").eq("lead_id", id).order("beginn", { ascending: false })),
        this._check(this.sb.from("abschluesse").select("*").eq("lead_id", id).order("datum")),
        this._check(this.sb.from("auftraege").select("*").eq("lead_id", id).order("erstellt_am")),
      ]);
      return { ...l, _akt: akt, _termine: ter, _deals: deals, _auftraege: auf };
    }
    async leadAnlegen(d) { return this._check(this.sb.from("leads").insert(d).select().single()); }
    async leadUpdate(id, patch) { return this._check(this.sb.from("leads").update(patch).eq("id", id).select().single()); }
    async leadLoeschen(id) { await this._check(this.sb.from("leads").delete().eq("id", id)); }
    async aktivitaet(a) { await this._check(this.sb.from("aktivitaeten").insert({ ...a, von: this.profil.kuerzel })); }
    async terminAnlegen(t) { return this._check(this.sb.from("termine").insert({ ...t, erstellt_von: this.profil.kuerzel }).select().single()); }
    async terminUpdate(id, patch) { await this._check(this.sb.from("termine").update(patch).eq("id", id)); }
    async termine(von, bis) {
      return this._check(this.sb.from("termine").select("*, lead:leads(id,firma,telefon,ort,strasse,plz)")
        .gte("beginn", von.toISOString()).lte("beginn", bis.toISOString()).neq("status", "abgesagt").order("beginn"));
    }
    async deals() { return this._check(this.sb.from("abschluesse").select("*").order("datum", { ascending: false })); }
    async dealAnlegen(d) { return this._check(this.sb.from("abschluesse").insert({ ...d, gemeldet_von: this.profil.kuerzel }).select().single()); }
    async dealUpdate(id, patch) { await this._check(this.sb.from("abschluesse").update(patch).eq("id", id)); }
    async auftraege() { return this._check(this.sb.from("auftraege").select("*, lead:leads(id,firma,ort,branche,telefon,email,ansprechpartner,owner,zielgruppe,website,status,demo_infos)").order("stufe_seit", { ascending: false })); }
    async auftrag(id) { return this._check(this.sb.from("auftraege").select("*, lead:leads(*)").eq("id", id).single()); }
    async auftragAnlegen(a) { return this._check(this.sb.from("auftraege").insert({ ...a, erstellt_von: this.profil.kuerzel }).select().single()); }
    async auftragUpdate(id, patch) { return this._check(this.sb.from("auftraege").update(patch).eq("id", id).select().single()); }
    async aboKuendigen(x) { const { data, error } = await this.sb.functions.invoke("abo-kuendigen", { body: x }); if (error) { let t = error.message; try { t = (await error.context.json()).fehler || t; } catch (_) {} throw new Error(t); } if (!data || !data.ok) throw new Error((data && data.fehler) || "fehlgeschlagen"); await this.sb.from("auftraege").select("id").eq("id", x.auftrag_id); return data; }
    async rechnungen(auftrag_id) { return this._check(this.sb.from("stripe_rechnungen").select("*").eq("auftrag_id", auftrag_id).order("datum", { ascending: false })); }
    async cockpit() {
      const s = tagStart().toISOString();
      const [akt, info, demo, pool, rot] = await Promise.all([
        this._check(this.sb.from("aktivitaeten").select("von,typ,ergebnis").gte("zeit", s).eq("typ", "anruf")),
        this._check(this.sb.from("leads").select("*").eq("info_mail", "offen").order("letzter_kontakt")),
        this._check(this.sb.from("leads").select("*").in("demo_website", ["offen", "in_arbeit"]).order("letzter_kontakt")),
        this.sb.from("leads").select("id", { count: "exact", head: true }).is("owner", null).eq("status", "neu").eq("gesperrt", false),
        this._check(this.sb.from("rotation").select("*").eq("status", "offen").order("prio").limit(400)),
      ]);
      return { akt, info, demo, pool: pool.count || 0, rotation: rot };
    }
    async importieren(rows, quelle) { return this._check(this.sb.rpc("leads_importieren", { daten: rows, kampagne: null, quelle_standard: quelle })); }
    async zielgruppen() { return this._check(this.sb.from("zielgruppen").select("*").order("reihenfolge")); }
    async vertriebConfig() { return (await this._check(this.sb.from("vertrieb_config").select("*").eq("id", 1)))[0] || { fokus: "handwerk" }; }
    async setFokus(fokus, auto) { await this._check(this.sb.from("vertrieb_config").update({ fokus, auto_wechsel: auto, fokus_seit: new Date().toISOString().slice(0, 10) }).eq("id", 1)); }
    async setDemoUrl(id, url) { await this._check(this.sb.from("zielgruppen").update({ demo_url: url || null }).eq("id", id)); }
    async setTerminLink(url) { await this._check(this.sb.from("vertrieb_config").update({ termin_link: url || null }).eq("id", 1)); }
    async calcomWebhook() { return this._check(this.sb.rpc("calcom_webhook")); }
    async mailBereit() { try { return !!(await this._check(this.sb.rpc("mailversand_bereit"))); } catch (e) { return false; } }
    async mailSenden(m) { const { data, error } = await this.sb.functions.invoke("mailsenden", { body: m }); if (error) { let t = error.message; try { t = (await error.context.json()).fehler || t; } catch (_) {} throw new Error(t); } if (!data || !data.ok) throw new Error((data && data.fehler) || "Versand fehlgeschlagen"); return data; }
    async kiMail(lead_id, stichpunkte) { const { data, error } = await this.sb.functions.invoke("infomail", { body: { lead_id, stichpunkte: stichpunkte || null } }); if (error) throw error; return data || {}; }
    async setProfil(telefon, termin_link) { await this._check(this.sb.rpc("mein_profil_setzen", { p_telefon: telefon || "", p_termin_link: termin_link || "" })); }
    async statistikTage(von, bis) { return this._check(this.sb.rpc("statistik_tage", { p_von: von, p_bis: bis })); }
    async statistikGruppen(von, bis, dimension, nur) { return this._check(this.sb.rpc("statistik_gruppen", { p_von: von, p_bis: bis, dimension, nur: nur || null })); }
    async pushSchluessel() { const { data, error } = await this.sb.functions.invoke("push", { body: { setup: true } }); if (error) throw error; return data.publicKey; }
    async pushAbo(a) { await this._check(this.sb.from("push_abos").upsert({ ...a, kuerzel: this.profil.kuerzel }, { onConflict: "endpoint" })); }
    async pushAbmelden(endpoint) { await this._check(this.sb.from("push_abos").delete().eq("endpoint", endpoint)); }
    async alleLeads() {
      let out = [], from = 0;
      for (;;) {
        const part = await this._check(this.sb.from("leads").select("*").order("id").range(from, from + 999));
        out = out.concat(part); if (part.length < 1000) return out; from += 1000;
      }
    }
  }

  // ------------------------------------------------------------------ Demo
  const DEMO_KEY = "infinero-demo-v2";
  class DemoStore {
    constructor() { this.mode = "demo"; this._load(); }
    _load() {
      let s = null; try { s = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch (e) {}
      this.d = s || this._seed();
      this.profil = this.d.team.find(t => t.kuerzel === "INH");
    }
    _save() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(this.d)); } catch (e) {} }
    _seed() {
      const orte = ["Erfurt", "Gera", "Rudolstadt", "Saalfeld/Saale", "Naumburg (Saale)", "Eisenberg"];
      const br = ["Elektriker", "Maler", "Friseur", "Nagelstudio", "Autowerkstatt", "Restaurant", "Dachdecker", "Kosmetikstudio", "Pizzeria", "Tattoostudio"];
      const zg = b => /Friseur|Nagel|Kosmetik|Tattoo/.test(b) ? "beauty" : /Restaurant|Pizzeria|Café/.test(b) ? "gastro" : "handwerk";
      const namen = ["Meyer", "Schulze", "Krause", "Lehmann", "Wolf", "Hoffmann", "Richter", "Neumann", "Braun", "Zimmermann", "Hartmann", "Lange", "Werner", "Koch", "Vogel"];
      const leads = []; let id = 1;
      for (let i = 0; i < 160; i++) {
        const b = br[i % br.length], n = namen[i % namen.length], o = orte[i % orte.length];
        const web = i % 3 === 0 ? "" : `${b.toLowerCase().replace(/[^a-z]/g, "")}-${n.toLowerCase()}.example`;
        leads.push({ id: id++, lead_nr: "L-" + String(id - 1).padStart(6, "0"), erfasst_am: new Date().toISOString(), quelle: "Beispiel",
          firma: `${b} ${n} (Beispiel)`, branche: b, zielgruppe: zg(b), telefon: `+49 3641 ${String(100000 + i * 37).slice(0, 6)}`, email: "", website: web,
          plz: "", ort: o, website_bewertung: web ? (i % 2 ? "veraltet" : "ok") : "keine", prio: web ? (i % 2 ? 20 : 0) : 10,
          website_befund: web && i % 2 ? ["nicht fürs Handy optimiert · © 2016", "Website nicht erreichbar oder ohne HTTPS", "© 2014 · Tabellen-Layout"][i % 3] : null,
          status: "neu", gesperrt: false, owner: null, versuche: 0, interesse_produkte: [], notiz: "" });
      }
      const now = new Date();
      const t = (h, m) => { const x = new Date(now); x.setHours(h, m, 0, 0); return x.toISOString(); };
      Object.assign(leads[0], { owner: "EF", status: "rueckruf", wiedervorlage: t(10, 30), versuche: 1, naechster_schritt: "Inhaber ruft zurück erwartet" });
      Object.assign(leads[1], { owner: "EF", status: "nicht_erreicht", wiedervorlage: t(9, 0), versuche: 2 });
      Object.assign(leads[2], { owner: "EF", status: "termin", wiedervorlage: t(14, 0), interesse_produkte: ["PAKET-2"], demo_website: "offen" });
      Object.assign(leads[3], { owner: "EF", status: "info_angefragt", email: "info@beispiel.example", info_mail: "offen", einwilligung_email: now.toISOString(), interesse_produkte: ["KICALLER"] });
      return {
        team: [{ kuerzel: "INH", name: "Ziu Tonndorf", rolle: "inhaber", tagesziel: 0 }, { kuerzel: "EF", name: "Elias Fiedler", rolle: "vertriebler", tagesziel: 100 }],
        leads, nextLead: id,
        akt: [], termine: [{ id: 1, lead_id: 3, beginn: t(14, 0), dauer_min: 45, art: "vor_ort", mit: ["EF", "INH"], ort: "Erfurt", notiz: "Beispiel: Website + Chatbot vorstellen", status: "geplant", erstellt_von: "EF" }],
        deals: [], nextId: 100, tagesliste_am: {},
        zielgruppen: [
          { id: "handwerk", name: "Handwerk", reihenfolge: 1, anrufzeit: "Am besten 7–9 Uhr oder ab 16 Uhr – tagsüber sind viele auf der Baustelle.", demo_url: null },
          { id: "beauty", name: "Beauty & Kosmetik", reihenfolge: 2, anrufzeit: "Am besten 9–11 Uhr oder in der Mittagszeit – montags haben viele Salons zu.", demo_url: null },
          { id: "gastro", name: "Restaurants", reihenfolge: 3, anrufzeit: "Am besten 14:30–17 Uhr zwischen Mittag und Abend – montags oft Ruhetag.", demo_url: null },
        ],
        config: { fokus: "handwerk", auto_wechsel: true },
        historie: (() => { const h = []; const d = new Date(); d.setDate(d.getDate() - 1);
          for (let i = 0; h.length < 30 && i < 60; i++, d.setDate(d.getDate() - 1)) {
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            const n = 60 + ((i * 37) % 55), e = Math.round(n * (0.35 + (i % 5) * 0.03));
            h.push({ tag: d.toISOString().slice(0, 10), kuerzel: "EF", anrufe: n, erreicht: e, infos: Math.round(e * 0.2), interesse: Math.round(e * 0.12),
              termine: Math.round(e * 0.1), abschluesse: i % 6 === 2 ? 1 : 0, setup: i % 6 === 2 ? [1680, 990, 2370][i % 3] : 0 }); }
          return h; })(),
      };
    }
    _id() { return this.d.nextId++; }
    async session() { return this.profil; }
    setAnsicht(k) { this.ansicht = k; }
    get k() { return this.ansicht || this.profil.kuerzel; }
    async signOut() {}
    async team() { return this.d.team; }
    // wie leads_zuteilen in der Datenbank: Zielgruppe wählbar, je Branche Blöcke à 5
    _zuteilen(n, k, zg = null) {
      const fokus = zg || (new Date().getDay() === 1 ? "handwerk" : this.d.config.fokus);
      const kand = this.d.leads.filter(l => !l.owner && l.status === "neu" && !l.gesperrt && (!zg || l.zielgruppe === zg)).sort((a, b) => a.id - b.id);
      const rn = {}; kand.forEach(l => { const key = l.prio + "|" + l.branche; rn[key] = (rn[key] || 0) + 1; l._rn = rn[key]; });
      const pool = kand.sort((a, b) => (b.zielgruppe === fokus) - (a.zielgruppe === fokus) || b.prio - a.prio
        || Math.floor((a._rn - 1) / 5) - Math.floor((b._rn - 1) / 5) || String(a.branche).localeCompare(String(b.branche)) || a._rn - b._rn).slice(0, n);
      const basis = (this.d.reiheSeq = (this.d.reiheSeq || 0) + 1) * 1000;
      pool.forEach((l, i) => { l.owner = k; l.zugeteilt_am = new Date().toISOString(); l.reihe = basis + i + 1; });
      kand.forEach(l => delete l._rn);
      this._save(); return pool.length;
    }
    async poolZahlen() { const o = {}; this.d.zielgruppen.forEach(z => { o[z.id] = this.d.leads.filter(l => !l.owner && l.status === "neu" && !l.gesperrt && l.zielgruppe === z.id).length; }); return o; }
    async tageslisteStart() {
      const heute = new Date().toISOString().slice(0, 10), k = this.k, p = this.d.team.find(t => t.kuerzel === k);
      if (this.d.tagesliste_am[k] === heute) return 0;
      this.d.tagesliste_am[k] = heute;
      const offen = this.d.leads.filter(l => l.owner === k && l.status === "neu").length;
      return this._zuteilen(Math.max((p.tagesziel ?? 100) - offen, 0), k);
    }
    async nachladen(n, zielgruppe = null) { return this._zuteilen(n, this.k, zielgruppe); }
    _lead(l) { return { ...l, interesse_produkte: [...(l.interesse_produkte || [])] }; }
    async heute() {
      const k = this.k, s = tagStart(), e = tagEnde();
      const termine = this.d.termine.filter(t => t.status === "geplant" && t.mit.includes(k) && new Date(t.beginn) >= s && new Date(t.beginn) <= e)
        .sort((a, b) => a.beginn.localeCompare(b.beginn)).map(t => ({ ...t, lead: this.d.leads.find(l => l.id === t.lead_id) }));
      const faellig = this.d.leads.filter(l => l.owner === k && OFFEN.includes(l.status) && !l.gesperrt && l.wiedervorlage && new Date(l.wiedervorlage) <= e)
        .sort((a, b) => a.wiedervorlage.localeCompare(b.wiedervorlage)).map(x => this._lead(x));
      const neue = this.d.leads.filter(l => l.owner === k && l.status === "neu" && !l.gesperrt).sort((a, b) => b.prio - a.prio || (a.reihe ?? 1e15) - (b.reihe ?? 1e15) || a.id - b.id).map(x => this._lead(x));
      const anrufe = this.d.akt.filter(a => a.von === k && a.typ === "anruf" && new Date(a.zeit) >= s).length;
      return { termine, faellig, neue, anrufe };
    }
    async leads({ q = "", filter = "offen", produkt = null } = {}) {
      const k = this.k, inh = (this.d.team.find(t => t.kuerzel === k) || {}).rolle === "inhaber";
      let r = this.d.leads.filter(l => (inh || l.owner === k));
      if (filter !== "pool") r = r.filter(l => l.owner);
      const f = {
        offen: l => OFFEN.includes(l.status) && !l.gesperrt, info: l => l.status === "info_angefragt",
        interesse: l => ["interesse", "termin", "angebot"].includes(l.status), kunden: l => l.status === "gewonnen",
        zu: l => l.gesperrt || ["kein_interesse", "kein_kontakt"].includes(l.status), pool: l => !l.owner, mein: l => l.owner === k, alle: () => true,
        spaeter: l => l.status === "vorgemerkt" && (!produkt || (l.vorgemerkt || []).includes(produkt)),
      }[filter] || (() => true);
      r = r.filter(f);
      if (q) { const s = q.toLowerCase(); r = r.filter(l => [l.firma, l.ort, l.branche, l.telefon, l.website].join(" ").toLowerCase().includes(s)); }
      return r.slice(0, 300).map(x => this._lead(x));
    }
    async lead(id) {
      const l = this.d.leads.find(x => x.id === id);
      return { ...this._lead(l), _akt: this.d.akt.filter(a => a.lead_id === id).reverse(), _termine: this.d.termine.filter(t => t.lead_id === id), _deals: this.d.deals.filter(x => x.lead_id === id), _auftraege: (this.d.auftraege || []).filter(a => a.lead_id === id) };
    }
    async leadAnlegen(d) { const l = { id: this.d.nextLead++, erfasst_am: new Date().toISOString(), status: "neu", gesperrt: false, versuche: 0, prio: 0, interesse_produkte: [], ...d }; l.lead_nr = "L-" + String(l.id).padStart(6, "0"); this.d.leads.push(l); this._save(); return l; }
    async leadUpdate(id, patch) { const l = this.d.leads.find(x => x.id === id); Object.assign(l, patch, { geaendert_am: new Date().toISOString() }); this._save(); return this._lead(l); }
    async leadLoeschen(id) { this.d.leads = this.d.leads.filter(l => l.id !== id); this._save(); }
    async aktivitaet(a) { this.d.akt.push({ id: this._id(), zeit: new Date().toISOString(), von: this.k, ...a }); this._save(); }
    async terminAnlegen(t) { const x = { id: this._id(), status: "geplant", erstellt_von: this.k, erstellt_am: new Date().toISOString(), ...t }; this.d.termine.push(x); this._save(); return x; }
    async terminUpdate(id, patch) { Object.assign(this.d.termine.find(t => t.id === id), patch); this._save(); }
    async termine(von, bis) {
      const k = this.k, inh = (this.d.team.find(t => t.kuerzel === k) || {}).rolle === "inhaber";
      return this.d.termine.filter(t => t.status !== "abgesagt" && (inh || t.mit.includes(k)) && new Date(t.beginn) >= von && new Date(t.beginn) <= bis)
        .sort((a, b) => a.beginn.localeCompare(b.beginn)).map(t => ({ ...t, lead: this.d.leads.find(l => l.id === t.lead_id) }));
    }
    async deals() { return this.d.deals.slice().reverse(); }
    async dealAnlegen(x) { const d = { id: this._id(), gemeldet_von: this.k, gemeldet_am: new Date().toISOString(), ...x }; this.d.deals.push(d); this._save(); return d; }
    async dealUpdate(id, patch) { Object.assign(this.d.deals.find(x => x.id === id), patch); this._save(); }
    _auftragMit(a) { return { ...a, lead: this.d.leads.find(l => l.id === a.lead_id) }; }
    async auftraege() {
      const k = this.k, inh = (this.d.team.find(t => t.kuerzel === k) || {}).rolle === "inhaber";
      return (this.d.auftraege || []).filter(a => inh || a.vertriebler === k).map(a => this._auftragMit(a)).sort((a, b) => b.stufe_seit.localeCompare(a.stufe_seit));
    }
    async auftrag(id) { return this._auftragMit(this.d.auftraege.find(a => a.id === id)); }
    async auftragAnlegen(x) {
      const jetzt = new Date().toISOString();
      const a = { id: this._id(), stufe: "zusage", laufzeit_monate: 12, onboarding: {}, token: "demo-" + Math.random().toString(36).slice(2), erstellt_von: this.k, erstellt_am: jetzt, stufe_seit: jetzt, ...x };
      (this.d.auftraege ||= []).push(a); this._save(); return a;
    }
    async auftragUpdate(id, patch) {
      const a = this.d.auftraege.find(x => x.id === id);
      if (patch.stufe && patch.stufe !== a.stufe) patch = { ...patch, stufe_seit: new Date().toISOString() };
      Object.assign(a, patch); this._save(); return a;
    }
    async cockpit() {
      const s = tagStart();
      return {
        akt: this.d.akt.filter(a => a.typ === "anruf" && new Date(a.zeit) >= s),
        info: this.d.leads.filter(l => l.info_mail === "offen"), demo: this.d.leads.filter(l => ["offen", "in_arbeit"].includes(l.demo_website)),
        pool: this.d.leads.filter(l => !l.owner && l.status === "neu").length,
        rotation: [["handwerk", "Elektriker"], ["handwerk", "Sanitär und Heizung"], ["handwerk", "Maler und Lackierer"], ["beauty", "Friseur"], ["beauty", "Nagelstudio"], ["gastro", "Pizzeria"]].map(([zielgruppe, branche]) => ({ stadt: "Erfurt", ring: 2, zielgruppe, branche })),
      };
    }
    async importieren(rows, quelle) {
      let neu = 0, doppelt = 0;
      const key = r => [(r.website || "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "").split("/")[0], (r.telefon || "").replace(/\D/g, "")];
      const seen = new Set(); this.d.leads.forEach(l => key(l).forEach(k => k && seen.add(k)));
      rows.forEach(r => { const ks = key(r).filter(Boolean); if (!r.firma || ks.some(k => seen.has(k))) { doppelt++; return; } ks.forEach(k => seen.add(k)); this.leadAnlegen({ ...r, quelle: r.quelle || quelle, prio: r.website ? 5 : 10, website_bewertung: r.website ? null : "keine" }); neu++; });
      return { neu, doppelt, ohne_firma: 0 };
    }
    async alleLeads() { return this.d.leads; }
    async zielgruppen() { return this.d.zielgruppen; }
    async vertriebConfig() { return this.d.config; }
    async setFokus(fokus, auto) { Object.assign(this.d.config, { fokus, auto_wechsel: auto }); this._save(); }
    async setDemoUrl(id, url) { this.d.zielgruppen.find(z => z.id === id).demo_url = url || null; this._save(); }
    async setTerminLink(url) { this.d.config.termin_link = url || null; this._save(); }
    async mailBereit() { return true; }
    async rechnungen() { return []; }
    async aboKuendigen(x) { const a = this.d.auftraege.find(y => y.id === x.auftrag_id); if (!a) throw new Error("nicht gefunden"); if (x.zuruecknehmen) { a.kuendigung_eingang = null; a.abo_ende = null; a.abo_status = "aktiv"; } else { let e = new Date(a.live_am); e.setMonth(e.getMonth() + 12); a.kuendigung_eingang = x.eingang; a.abo_ende = e.toISOString().slice(0, 10); a.abo_status = "gekuendigt"; } this._save(); return { ok: true, abo_ende: a.abo_ende }; }
    async mailSenden(m) { await new Promise(r => setTimeout(r, 500)); const l = this.d.leads.find(x => x.id === m.lead_id); if (l && !m.art) { l.info_mail = "gesendet"; this._save(); } return { ok: true }; }
    async kiMail(lead_id) { await new Promise(r => setTimeout(r, 800)); const l = this.d.leads.find(x => x.id === lead_id) || {}; return { betreff: "Schön, dass wir gesprochen haben", text: `Guten Tag,\n\n(Beispieltext im Demo-Modus – im Live-Betrieb schreibt Claude hier die ganze Mail passend zu ${l.firma || "dem Betrieb"} und Ihren Stichpunkten.)\n\nViele Grüße` }; }
    async calcomWebhook() { return { url: "https://DEMO.supabase.co/functions/v1/calcom", secret: "demo-geheimnis" }; }
    async setProfil(telefon, termin_link) { Object.assign(this.d.team.find(t => t.kuerzel === this.profil.kuerzel), { telefon: telefon || null, termin_link: termin_link || null }); this._save(); }
    _tageLive() {
      const m = {};
      const add = (tag, k, f, v = 1) => { const x = (m[tag + k] ||= { tag, kuerzel: k, anrufe: 0, erreicht: 0, infos: 0, interesse: 0, termine: 0, abschluesse: 0, setup: 0 }); x[f] += v; };
      const tagVon = z => new Date(z).toISOString().slice(0, 10);
      this.d.akt.filter(a => a.typ === "anruf").forEach(a => { const t = tagVon(a.zeit); add(t, a.von, "anrufe"); if (a.ergebnis !== "nicht_erreicht") add(t, a.von, "erreicht"); if (a.ergebnis === "info") add(t, a.von, "infos"); if (["interesse", "termin", "rueckruf"].includes(a.ergebnis)) add(t, a.von, "interesse"); });
      this.d.termine.filter(t => t.erstellt_am).forEach(t => add(tagVon(t.erstellt_am), t.erstellt_von, "termine"));
      this.d.deals.forEach(d => { add(tagVon(d.gemeldet_am), d.vertriebler, "abschluesse"); add(tagVon(d.gemeldet_am), d.vertriebler, "setup", +d.setup || 0); });
      return Object.values(m);
    }
    async statistikTage(von, bis) {
      return [...(this.d.historie || []), ...this._tageLive()].filter(r => r.tag >= von && r.tag <= bis).sort((a, b) => b.tag.localeCompare(a.tag));
    }
    async statistikGruppen(von, bis, dimension, nur) {
      const tage = (await this.statistikTage(von, bis)).filter(r => !nur || r.kuerzel === nur);
      const sum = f => tage.reduce((a, r) => a + (+r[f] || 0), 0);
      const namen = { zielgruppe: [["Handwerk", .45], ["Beauty & Kosmetik", .35], ["Restaurants", .2]],
        ort: [["Erfurt", .4], ["Gera", .3], ["Rudolstadt", .15], ["Saalfeld/Saale", .15]],
        branche: [["Elektriker", .2], ["Friseur", .2], ["Sanitär und Heizung", .15], ["Nagelstudio", .15], ["Pizzeria", .1], ["Kosmetikstudio", .1], ["Restaurant", .1]],
        produkt: [["PAKET-2", .4], ["PAKET-1", .3], ["PAKET-3", .2], ["PAKET-4", .1]] }[dimension];
      return namen.map(([g, f], i) => ({ gruppe: g, anrufe: dimension === "produkt" ? 0 : Math.round(sum("anrufe") * f), erreicht: Math.round(sum("erreicht") * f),
        termine: dimension === "produkt" ? 0 : Math.round(sum("termine") * f * (1.3 - i * .2)), abschluesse: Math.round(sum("abschluesse") * f), setup: Math.round(sum("setup") * f) }));
    }
    async pushSchluessel() { return null; }
    async pushAbo() {}
    async pushAbmelden() {}
    async zuruecksetzen() { localStorage.removeItem(DEMO_KEY); this._load(); }
  }

  window.InfineroStore = {
    create() {
      const c = window.INFINERO_CONFIG || {};
      if (c.supabaseUrl && c.supabaseAnonKey && window.supabase) return new LiveStore(c);
      return new DemoStore();
    },
    OFFEN,
  };
})();
