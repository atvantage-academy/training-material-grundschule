// Teilen mit Rest als Bonbon-Geschichte: Wir brauchen A Bonbons. Im Laden gibt es Tüten mit je
// B Bonbons, zuhause liegen B − 1 einzelne in einer Schale. Tüten = Ergebnis, Bonbons aus der
// Schale = Rest.
//
// DIE AUFMERKSAMKEIT WIRD GELENKT: Eine Einführung im Popup stellt erst den Laden, dann die
// Schale vor (ohne Zahlen); jede Figur fliegt danach an ihren Platz. Ein drittes Popup rechnet
// ein Beispiel vor (29 : 9) und fragt, ob das Kind bereit ist. In der Aufgabe ist immer
// nur aktiv und farbig, was das Kind gerade anklicken soll, und in der Sprechblase steht nur
// die eine Anweisung, die gerade gilt:
//   buy  – nur der Laden; nach jeder Tüte fragt ein Popup nach der Zahl. Ab der ersten Tüte
//          steht „Nach Hause gehen“ bereit – das Kind entscheidet, wann es genug sind. Die
//          Tüte zu viel und zu frühes Heimgehen sind ein „Oh oh!“.
//   bowl – nur die Schale und „Genug Bonbons!“. Ein Bonbon zu viel wandert zurück.
//   done – Ergebnis, Rest und Probe.
// Die Aufgabe steht in der Adresse (skr.state): `#/?aufgabe=29-9` für 29 : 9.
// Stile setzt das Skript über Klassen oder `style.setProperty`, nie als Attribut im Markup –
// die Seite läuft unter einer Content Security Policy ohne `unsafe-inline`.
(() => {
const $ = id => document.getElementById("tr-" + id);
const root = $("root");
if (!root) return;

// Die erste eigene Aufgabe – bewusst eine andere als das Beispiel der Einführung (29 : 9).
const START = { a: 38, b: 7 };
const EXAMPLE = { a: 29, b: 9 };
const PRAISE = ["Super!", "Klasse!", "Toll gemacht!", "Prima!", "Spitze!", "Genau richtig!", "Stark!"];
const SMALL = ["Gut!", "Prima!", "Ja, genau!", "Weiter so!"];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const bonbons = n => n === 1 ? "1 Bonbon" : n + " Bonbons";
const tueten = n => n === 1 ? "1 Tüte" : n + " Tüten";
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A, B: Aufgabe · phase: intro | buy | bowl | final | done · bags: gekaufte Tüten ·
// singles: Bonbons aus der Schale · counted: Tüten, deren Summe das Kind schon gesagt hat ·
// ask: offene Frage {kind, answer} · busy: ein Fehler wird gerade gezeigt · extra: das, was
// gerade zu viel ist („bag“ oder „single“)
let A, B, phase = "intro", bags, singles, counted, ask, busy, extra;

const total = () => bags * B + singles;
const need = () => A - total();

// --- Zeichnungen ---------------------------------------------------------------------------
const candy = k => `<svg class="tr-candy tr-c${k % 4 + 1}" viewBox="0 0 48 24" aria-hidden="true" focusable="false">` +
  `<path class="tr-candy__wrap" d="M2 3 L15 12 L2 21 Z"/><path class="tr-candy__wrap" d="M46 3 L33 12 L46 21 Z"/>` +
  `<circle class="tr-candy__body" cx="24" cy="12" r="11"/><path class="tr-candy__shine" d="M18 8 q4 -4 9 -2"/></svg>`;
const bag = (n = B) => `<svg class="tr-bag" viewBox="0 0 64 80" aria-hidden="true" focusable="false">` +
  `<circle class="tr-candy__body tr-c1" cx="22" cy="12" r="7"/><circle class="tr-candy__body tr-c2" cx="34" cy="9" r="7"/><circle class="tr-candy__body tr-c3" cx="45" cy="13" r="7"/>` +
  `<path class="tr-bag__body" d="M8 16 H56 L60 76 H4 Z"/><path class="tr-bag__fold" d="M8 16 H56 L55 24 H9 Z"/>` +
  `<circle class="tr-bag__label" cx="32" cy="48" r="15"/><text class="tr-bag__num" x="32" y="55" text-anchor="middle">${n}</text></svg>`;

// --- Aufgabe -------------------------------------------------------------------------------
function setTask(a, b) {
  const warn = $("warn"); warn.hidden = true;
  const fail = t => { warn.textContent = t; warn.hidden = false; return false; };
  if (!Number.isInteger(b) || b < 2 || b > 9) return fail("In eine Tüte passen 2 bis 9 Bonbons.");
  if (!Number.isInteger(a) || a < 10 || a > 99) return fail("Wir brauchen 10 bis 99 Bonbons.");
  if (a > 10 * b) return fail(`Auf den Tisch passen höchstens 10 Tüten. Bei ${b} Bonbons je Tüte geht es bis ${10 * b}.`);
  A = a; B = b;
  bags = 0; singles = 0; counted = 0; ask = null; busy = false; extra = null;
  if ($("dialog").open) $("dialog").close();
  $("praise").innerHTML = "";
  if (phase !== "intro") phase = "buy";
  say(`Wir brauchen ${num("a", A)} Bonbons. In jeder Tüte sind ${num("b", B)}.<br>Klicke auf den <b>Laden</b>, um eine Tüte Bonbons zu kaufen.`);
  render();
  return true;
}

// --- Anzeige -------------------------------------------------------------------------------
let message = "", bad = false;
function say(html, isBad) { message = html; bad = !!isBad; }

function render() {
  const done = phase === "done";
  $("chain").innerHTML = `<span class="tr-n-a">${A}</span><span>:</span><span class="tr-n-b">${B}</span><span>=</span>` +
    `<span class="tr-res tr-n-q">${done ? bags : "?"}</span><span class="tr-small">Rest</span>` +
    `<span class="tr-res tr-n-r">${done ? singles : "?"}</span>`;

  const bubble = $("bubble");
  bubble.innerHTML = message;
  bubble.classList.toggle("is-bad", bad);

  let h = "";
  for (let i = 0; i < bags; i++) h += `<span class="tr-item">${bag()}</span>`;
  if (extra === "bag") h += `<span class="tr-item is-wrong">${bag()}</span>`;
  $("bags").innerHTML = h;
  h = "";
  for (let i = 0; i < singles; i++) h += `<span class="tr-item">${candy(i)}</span>`;
  if (extra === "single") h += `<span class="tr-item is-wrong">${candy(singles)}</span>`;
  $("singles").innerHTML = h;

  const left = B - 1 - singles - (extra === "single" ? 1 : 0);
  h = "";
  for (let i = 0; i < left; i++) h += candy(i + 1);
  $("bowl-candies").innerHTML = h;

  // Die Summe der Tüten steht erst da, wenn das Kind sie gesagt hat.
  const tot = $("total");
  const before = tot.textContent;
  if (!bags && !singles) tot.innerHTML = "";
  else if (counted < bags) tot.innerHTML = `<span>= ?</span>`;
  else if (!singles) tot.innerHTML = `<span>= ${bags * B}</span>`;
  else tot.innerHTML = `<span class="tr-total__part">${bags * B} + ${singles}</span> <span>= ${total()}</span>`;
  if (tot.textContent !== before) { tot.classList.remove("is-new"); void tot.offsetWidth; tot.classList.add("is-new"); }

  // Aktiv ist nur, was gerade dran ist.
  $("shop").disabled = phase !== "buy";
  $("bowl").disabled = phase !== "bowl" || left === 0;
  $("enough").hidden = phase !== "bowl";
  $("home").hidden = phase !== "buy" || counted === 0;
  $("again").hidden = !done;
  $("reset").hidden = !done;
}

// --- Einführung ----------------------------------------------------------------------------
const INTRO = [
  { id: "laden", el: "shop", text: "Das ist der Laden. Hier gibt es Bonbons nur in vollen Tüten – in jeder Tüte stecken gleich viele.", btn: "Weiter" },
  { id: "schale", el: "bowl", text: "Und das ist unsere Schale zuhause. Darin liegen einzelne Bonbons – immer ein paar weniger, als in eine Tüte passen.", btn: "Weiter" },
  { id: "beispiel", example: true, btn: "Los geht’s!" }
];

// Jede Zahl der Rechnung hat ihre Farbe – in der Rechnung wie im Text, zum Wiedererkennen:
// gebraucht (a), je Tüte (b), Tüten = Ergebnis (q), aus der Schale = Rest (r).
const num = (kind, n) => `<b class="tr-n-${kind}">${n}</b>`;
const equation = (a, b, q, r) => `${num("a", a)} : ${num("b", b)} = ${num("q", q)} <span class="tr-small">Rest</span> ${num("r", r)}`;

// Das Beispiel: die Rechnung, darunter als Bild die Tüten, die Bonbons aus der Schale, die Summe.
function exampleFigure() {
  const { a, b } = EXAMPLE, q = Math.floor(a / b), r = a % b;
  const fig = document.createElement("div");
  fig.className = "tr-example";
  let h = `<p class="tr-example__eq">${equation(a, b, q, r)}</p><span class="tr-example__picture" aria-hidden="true"><span class="tr-example__bags">`;
  for (let i = 0; i < q; i++) h += bag(b);
  h += `</span><span class="tr-example__plus">+</span><span class="tr-example__singles">`;
  for (let i = 0; i < r; i++) h += candy(i);
  h += `</span><span class="tr-example__sum">= ${num("a", a)}</span></span>`;
  fig.innerHTML = h;
  return fig;
}
function exampleText() {
  const { a, b } = EXAMPLE, q = Math.floor(a / b), r = a % b;
  return `Ein Beispiel: Angenommen, wir brauchen ${num("a", a)} Bonbons, und der Laden hat ${num("b", b)}er-Tüten. ` +
    `Dann müssen wir ${num("q", q)} Tüten aus dem Laden kaufen. Das sind dann ${q * b} Bonbons. ` +
    `Die ${num("r", r)} fehlenden nehmen wir aus der Schale zuhause. Bist Du jetzt bereit für Deine eigene Aufgabe?`;
}
let introStep = 0;

// Gesehene Popups merkt sich der Browser: Was einmal weggeklickt ist, kommt beim nächsten
// Laden nicht wieder – bis „Erklärungen erneut anzeigen“ die Liste leert. Ohne Speicher
// (privates Fenster, gesperrt) erscheinen die Popups einfach jedes Mal.
const SEEN_KEY = "grundschule:teilen-mit-rest:erklaerungen";
const readSeen = () => {
  try { const v = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
};
const markSeen = id => {
  try { const seen = readSeen(); if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id])); }
  catch (e) { /* ohne Speicher kommt das Popup wieder */ }
};
const clearSeen = () => { try { localStorage.removeItem(SEEN_KEY); } catch (e) { /* nichts zu leeren */ } };

// Zum nächsten Popup, das noch nicht gesehen ist; Figuren übersprungener Popups stehen
// sofort an ihrem Platz. Sind alle gesehen, beginnt die Aufgabe.
function continueIntro() {
  const seen = readSeen();
  while (introStep < INTRO.length && seen.includes(INTRO[introStep].id)) {
    if (INTRO[introStep].el) $(INTRO[introStep].el).classList.remove("is-away");
    introStep++;
  }
  if (introStep < INTRO.length) { showIntro(); return; }
  phase = "buy";
  root.classList.remove("is-intro");
  render();
  $("shop").focus();
}

function startIntro() {
  if ($("dialog").open) $("dialog").close();
  ask = null;
  phase = "intro";
  root.classList.add("is-intro");
  $("shop").classList.add("is-away");
  $("bowl").classList.add("is-away");
  introStep = 0;
  setTask(A, B);
  continueIntro();
}

function figureOf(id) {
  const clone = $(id).cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  clone.classList.remove("is-away");
  clone.removeAttribute("disabled");
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("tabindex", "-1");
  return clone;
}

function showIntro() {
  const step = INTRO[introStep];
  const fig = $("intro-figure");
  fig.innerHTML = "";
  if (step.el) fig.appendChild(figureOf(step.el));
  else if (step.example) fig.appendChild(exampleFigure());
  if (step.example) $("intro-text").innerHTML = exampleText();
  else $("intro-text").textContent = step.text;
  $("intro-next").textContent = step.btn;
  const d = $("intro");
  if (!d.open) d.showModal();
  $("intro-next").focus();
}

// Die Figur fliegt aus dem Popup an ihren Platz in der Szene.
function fly(id, from) {
  const target = $(id);
  return new Promise(resolve => {
    const land = () => { target.classList.remove("is-away"); resolve(); };
    if (still() || !from || !target.animate) { land(); return; }
    const to = target.getBoundingClientRect();
    const flyer = document.createElement("div");
    flyer.className = "teilen-rest tr-flyer";
    flyer.appendChild(figureOf(id));
    flyer.style.setProperty("left", from.left + "px");
    flyer.style.setProperty("top", from.top + "px");
    flyer.style.setProperty("width", from.width + "px");
    document.body.appendChild(flyer);
    const s = to.width / from.width;
    const anim = flyer.animate([
      { transform: "translate(0, 0) scale(1)" },
      { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${s})` }
    ], { duration: 900, easing: "cubic-bezier(.5, 0, .2, 1)", fill: "forwards" });
    anim.onfinish = () => { flyer.remove(); land(); };
  });
}

async function nextIntro() {
  const step = INTRO[introStep];
  const figure = $("intro-figure").firstElementChild;
  const from = figure ? figure.getBoundingClientRect() : null;
  $("intro").close();
  markSeen(step.id);
  if (step.el) await fly(step.el, from);
  introStep++;
  continueIntro();
}

// --- Frage im Popup ------------------------------------------------------------------------
// Im Popup steht, was gerade auf dem Tisch liegt – zum Abzählen direkt neben der Frage.
function tablePicture() {
  let h = `<span class="tr-dialog__bags">`;
  for (let i = 0; i < bags; i++) h += bag();
  h += `</span>`;
  if (singles) {
    h += `<span class="tr-dialog__singles">`;
    for (let i = 0; i < singles; i++) h += candy(i);
    h += `</span>`;
  }
  return h;
}

function question(kind, text, answer) {
  ask = { kind, answer };
  $("dialog-figure").innerHTML = tablePicture();
  $("dialog-q").textContent = text;
  $("dialog-hint").textContent = "";
  $("dialog-in").value = "";
  openDialog();
}
function openDialog() {
  const d = $("dialog");
  if (!d.open) d.showModal();
  $("dialog-in").focus();
}

function answer(v) {
  if (!ask) return;
  const hint = $("dialog-hint");
  if (!Number.isInteger(v)) { hint.textContent = "Schreib eine Zahl hinein."; return; }
  if (v !== ask.answer) {
    const more = v > ask.answer;
    hint.textContent = {
      count: `Das sind zu ${more ? "viele" : "wenige"}. In jeder Tüte sind ${B} Bonbons – zähl nochmal!`,
      bags: "Zähl die Tüten auf dem Tisch nochmal.",
      rest: "Zähl die einzelnen Bonbons neben den Tüten nochmal."
    }[ask.kind];
    return;
  }
  const kind = ask.kind;
  ask = null;
  $("dialog").close();
  if (kind === "count") {
    counted = bags;
    say(`${pick(PRAISE)} Jetzt haben wir <b>${bonbons(total())}</b>.<br>` +
      `Klicke so oft auf den <b>Laden</b>, bis wir genug Tüten haben. Aber Vorsicht: Es dürfen nicht mehr als ${num("a", A)} Bonbons sein!<br>` +
      `Haben wir genug Tüten? Dann klicke auf <b>„Nach Hause gehen“</b>.`);
    celebrate(pick(PRAISE));
  } else if (kind === "bags") {
    say(`Richtig, ${tueten(bags)}!`);
    render();
    question("rest", "Und wie viele Bonbons haben wir aus der Schale genommen?", singles);
    celebrate(pick(PRAISE));
    return;
  } else {
    phase = "done";
    say(`<span class="tr-final">${equation(A, B, bags, singles)}</span><br>` +
      `Probe: ${bags} · ${B}${singles ? " + " + singles : ""} = ${A}`);
    celebrate("Super gemacht!", true);
  }
  render();
}

// --- Handlungen ----------------------------------------------------------------------------
function blocked() {
  if (busy || phase === "intro" || phase === "done") return true;
  if (ask) { openDialog(); return true; }
  return false;
}

// Ein Fehler wird kurz gezeigt und dann zurückgenommen; danach gilt `then`.
function oops(kind, text, then) {
  busy = true; extra = kind;
  say(`<span class="tr-oh">Oh oh!</span> ${text}`, true);
  celebrate("Oh oh!", false, true);
  render();
  setTimeout(() => { extra = null; busy = false; if (then) then(); render(); }, 2200);
}

// Der Laden ist fertig: weiter mit der Schale.
// Vom Laden nach Hause: Das Kind entscheidet, wann es genug Tüten hat. Passt noch eine ganze
// Tüte dazu, ist es zu früh; sonst ist ab jetzt nur noch die Schale dran.
function goHome() {
  if (blocked() || phase !== "buy") return;
  if (need() >= B) {
    say(`<span class="tr-oh">Oh oh!</span> Wir haben erst ${total()} Bonbons – da passt noch eine ganze Tüte dazu. Kaufe noch eine im <b>Laden</b>.`, true);
    celebrate("Oh oh!", false, true);
    render();
    return;
  }
  phase = "bowl";
  say(need() > 0
    ? `Wir sind zuhause! Den Rest holen wir aus der <b>Schale</b>. Klicke auf die Schale, bis wir ${num("a", A)} haben.`
    : `Wir sind zuhause – und haben schon genau ${num("a", A)}. Klicke auf <b>„Genug Bonbons!“</b>`);
  celebrate(pick(PRAISE));
  render();
}

function buy() {
  if (blocked() || phase !== "buy") return;
  if (need() < B) {
    oops("bag", `Das waren zu viele Bonbons aus dem Laden. Mit dieser Tüte hätten wir ${total() + B} – wir brauchen nur ${A}.`,
      () => say(`Wir haben genug Tüten. Klicke auf <b>„Nach Hause gehen“</b>.`));
    return;
  }
  bags++;
  say("");
  render();
  question("count", "Wie viele Bonbons haben wir jetzt?", bags * B);
}

function take() {
  if (blocked() || phase !== "bowl") return;
  if (need() === 0) {
    oops("single", `Jetzt wären es ${A + 1} – ein Bonbon zu viel.`, () => say(`Wir haben genau <b>${A}</b>. Klicke auf <b>„Genug Bonbons!“</b>`));
    return;
  }
  singles++;
  say(`${pick(SMALL)} Jetzt sind es <b>${total()}</b>.`);
  render();
}

function enough() {
  if (blocked() || phase !== "bowl") return;
  if (need() > 0) {
    say(`<span class="tr-oh">Oh oh!</span> Wir haben erst ${total()} – wir brauchen ${A}.`, true);
    render();
    return;
  }
  phase = "final";
  say(`Super, genau ${A} Bonbons!`);
  render();
  question("bags", "Wie viele Tüten haben wir im Laden gekauft?", bags);
}

// --- Lob -----------------------------------------------------------------------------------
function celebrate(text, big, sad) {
  const p = $("praise");
  p.innerHTML = "";
  const t = document.createElement("div");
  t.textContent = text;
  if (sad) t.className = "tr-oh-big";
  p.appendChild(t);
  const n = sad ? 0 : big ? 18 : 8;
  for (let k = 0; k < n; k++) {
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * (big ? 220 : 120);
    const star = document.createElement("span");
    star.className = "tr-star"; star.textContent = "★";
    star.style.setProperty("left", "50%");
    star.style.setProperty("top", "50%");
    star.style.setProperty("--x", Math.cos(ang) * dist + "px");
    star.style.setProperty("--y", Math.sin(ang) * dist + "px");
    star.style.setProperty("animation-delay", Math.random() * .25 + "s");
    p.appendChild(star);
  }
  clearTimeout(celebrate.t);
  celebrate.t = setTimeout(() => { p.innerHTML = ""; }, 1800);
}

// --- Bedienung -----------------------------------------------------------------------------
$("shop").addEventListener("click", buy);
$("home").addEventListener("click", goHome);
$("bowl").addEventListener("click", take);
$("enough").addEventListener("click", enough);
$("intro-next").addEventListener("click", nextIntro);
$("intro-figure").addEventListener("click", nextIntro);
$("intro").addEventListener("cancel", e => e.preventDefault());
$("dialog-form").addEventListener("submit", e => { e.preventDefault(); answer(parseInt($("dialog-in").value, 10)); });
// Mit Escape bleibt die Frage offen: Ohne Antwort geht es nicht weiter.
$("dialog").addEventListener("cancel", e => { if (ask) e.preventDefault(); });

// Neue Aufgabe von Hand oder per Zufall: danach die Adresse nachziehen. skr.state schreibt auf
// Layouts mit eigenen Fragmenten (visualization) nicht – deshalb dieselbe Form von Hand
// (ABWEICHUNGEN.md, A-002).
const syncUrl = () => {
  if (window.skr && skr.state) skr.state.update();
  const fresh = A === START.a && B === START.b ? "" : `#/?aufgabe=${A}-${B}`;
  if ((location.hash || "") === fresh) return;
  history.replaceState(null, "", fresh || location.pathname + location.search);
  window.dispatchEvent(new CustomEvent("skr-urlchange"));
};
const randomTask = () => {
  for (let t = 0; t < 100; t++) {
    const b = 3 + Math.floor(Math.random() * 7);
    const lo = Math.max(10, 2 * b), hi = Math.min(99, 10 * b);
    const a = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (a % b === 0 && Math.random() < .75) continue; // meistens mit Rest
    $("inA").value = a; $("inB").value = b;
    if (setTask(a, b)) { syncUrl(); return; }
  }
};
$("setup").addEventListener("submit", e => { e.preventDefault(); if (setTask(parseInt($("inA").value, 10), parseInt($("inB").value, 10))) syncUrl(); });
$("rnd").addEventListener("click", randomTask);
$("again").addEventListener("click", randomTask);
$("reset").addEventListener("click", () => setTask(A, B));
$("replay").addEventListener("click", () => { clearSeen(); startIntro(); });

$("shop").classList.add("is-away");
$("bowl").classList.add("is-away");
setTask(START.a, START.b);

if (window.skr && skr.state) {
  skr.state.register({
    key: "aufgabe",
    read: () => `${A}-${B}`,
    apply: value => {
      const m = /^(\d+)-(\d+)$/.exec(value || "");
      if (!m) return;
      $("inA").value = m[1]; $("inB").value = m[2];
      setTask(+m[1], +m[2]);
    }
  });
}
continueIntro();
})();
