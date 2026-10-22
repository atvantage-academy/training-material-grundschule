// Der Zehner-Trick: Minus rechnen über den vollen Zehner, Schritt für Schritt im Feld aus
// Zehnerreihen. Die Aufgabe steht in der Adresse (skr.state): `#/?aufgabe=57-19`.
// Stile setzt das Skript über `style.setProperty`, nie als Attribut im Markup – die Seite
// läuft unter einer Content Security Policy ohne `unsafe-inline`.
(() => {
const $ = id => document.getElementById("zt-" + id);
if (!$("setup")) return;
const PRAISE = ["Super gemacht!", "Klasse!", "Toll gemacht!", "Prima!", "Spitze!", "Genau richtig!", "Stark!"];
const SMALL = ["Gut!", "Weiter so!", "Ja, genau!", "Prima!"];
const ORDER = ["strike", "count1", "step2", "count2", "done"];
// mode: "up" (Einer 6-9: zu viel wegstreichen, dann dazulegen), "five" (Einer 5: Fünfer streichen),
//       "down" (Einer 1-4: Zehner, dann Einer einzeln), "tens" (glatte Zehner)
let A, B, R, K, mode, phase, struck, fresh, added, hint, hintBad;

function setTask(a, b) {
  const warn = $("warn"); warn.hidden = true;
  const fail = t => { warn.textContent = t; warn.hidden = false; return false; };
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 10 || a > 100 || b < 10 || b > 99) return fail("Bitte zwei Zahlen zwischen 10 und 100 eingeben.");
  const e = b % 10;
  mode = e === 0 ? "tens" : e >= 6 ? "up" : e === 5 ? "five" : "down";
  R = mode === "up" ? Math.ceil(b / 10) * 10 : Math.floor(b / 10) * 10;
  K = mode === "up" ? R - b : e;
  if (a < Math.max(b, R)) return fail("Die erste Zahl muss mindestens " + Math.max(b, R) + " sein.");
  A = a; B = b;
  phase = "strike"; struck = new Set(); fresh = new Map(); added = 0; hint = ""; hintBad = false;
  $("praise").innerHTML = "";
  render(); return true;
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fullRows = () => Math.floor(A / 10);
const rowStruck = r => struck.has(r * 10);
const isBlue = i => i < A && !struck.has(i);
const left = () => A - struck.size + added;
const reihen = n => n === 1 ? "1 volle Zehnerreihe" : n + " volle Zehnerreihen";
const felder = n => n === 1 ? "1 Feld" : n + " Felder";
const past = p => ORDER.indexOf(phase) > ORDER.indexOf(p);

function render() {
  const n = R / 10, mid = A - R, res = A - B;
  const show = (on, h) => `<span class="part ${on ? "" : "off"}">${h}</span>`;
  let chain = `<span class="c-cell">${A}</span><span>−</span><span>${B}</span><span>=</span>`;
  if (mode === "tens") {
    chain += `<span class="res">${phase === "done" ? res : "?"}</span>`;
  } else {
    const op = mode === "up" ? `<span class="c-plus">+ ${K}</span>` : `<span class="c-minus">− ${K}</span>`;
    chain += show(true, `<span class="c-cell">${A}</span> <span class="c-minus">− ${R}</span> ${op}`) +
      show(past("strike"), `= <span class="res">${past("count1") ? mid : "?"}</span>`) +
      show(past("count1"), `${op} = <span class="res ${mode === "up" ? "c-plus" : ""}">${phase === "done" ? res : "?"}</span>`);
  }
  $("chain").innerHTML = chain;

  const intro = `Hier sind <b class="c-cell">${A}</b> Felder. Wir sollen <b>${B}</b> wegnehmen.<br>`;
  const T = {
    up: {
      strike: intro + `${B} ist fast <b class="c-minus">${R}</b>! ${R} wegnehmen ist viel leichter.<br>Tippe auf <b class="c-minus">${reihen(n)}</b>, um sie wegzustreichen.`,
      step2: `Halt! Wir sollten nur <b>${B}</b> wegnehmen, haben aber <b class="c-minus">${R}</b> weggestrichen.<br>Das war <b class="c-plus">${felder(K)}</b> zu viel.<br>Tippe auf ${K === 1 ? "ein leeres Feld" : K + " leere Felder"} am Ende und mach ${K === 1 ? "es" : "sie"} wieder voll.`,
      hint2: `Vorher waren es ${mid}. Dazu ${K === 1 ? "kommt das grüne Feld" : "kommen die grünen Felder"}.`,
      done: `Erst ${R} weg, dann ${K} wieder dazu.`
    },
    down: {
      strike: intro + `${B} sind <b class="c-minus">${R}</b> und <b class="c-minus">${K}</b>. Zuerst die Zehner!<br>Tippe auf <b class="c-minus">${reihen(n)}</b>, um sie wegzustreichen.`,
      step2: `Wir haben erst <b class="c-minus">${R}</b> weggestrichen. Das war noch zu wenig, es fehlen noch <b class="c-minus">${K}</b>.<br>${K === 1 ? `Streiche das letzte <b class="c-minus">Feld</b> weg. Tippe es an!` : `Streiche die letzten <b class="c-minus">${K} Felder</b> einzeln weg. Tippe sie an!`}`,
      hint2: `Vorher waren es ${mid}. Davon ${K === 1 ? "ist noch 1 Feld" : "sind noch " + K + " Felder"} weg.`,
      done: `Erst ${R} weg, dann noch ${K} einzeln.`
    },
    five: {
      strike: intro + `${B} sind <b class="c-minus">${R}</b> und <b class="c-minus">5</b>. Zuerst die Zehner!<br>Tippe auf <b class="c-minus">${reihen(n)}</b>, um sie wegzustreichen.`,
      step2: `Wir haben erst <b class="c-minus">${R}</b> weggestrichen. Es fehlen noch <b class="c-minus">5</b>.<br>5 Felder sind eine halbe Reihe: ein <b class="c-minus">Fünfer</b>!<br>Tippe auf einen vollen Fünfer, dann ist er auf einmal weg.`,
      hint2: `Vorher waren es ${mid}. Davon ist noch ein Fünfer weg.`,
      done: `Erst ${R} weg, dann noch einen Fünfer.`
    },
    tens: {
      strike: intro + `${B} sind genau <b class="c-minus">${n} Zehner</b>. Das ist leicht!<br>Tippe auf <b class="c-minus">${reihen(n)}</b>, um sie wegzustreichen.`,
      hint2: `Zähle die blauen Felder. Volle Reihen haben immer 10.`,
      done: `Einfach ${n} ganze Reihen weg.`
    }
  }[mode];
  const text = {
    strike: T.strike,
    count1: `Super gemacht! Wie viele Felder sind jetzt noch übrig?<div class="hint">Zähle die blauen Felder. Volle Reihen haben immer 10.</div>`,
    step2: T.step2,
    count2: `Toll gemacht! Und wie viele Felder sind jetzt übrig?<div class="hint">${T.hint2}</div>`,
    done: `<span class="final">${A} − ${B} = ${res}</span><br>Du hast es geschafft! ${T.done}`
  }[phase];
  $("bubble").innerHTML = text + (hint ? `<div class="hint ${hintBad ? "bad" : ""}">${hint}</div>` : "");

  const target = mode === "up" ? R : B;
  $("counters").innerHTML =
    `<span class="chip minus ${struck.size === target ? "full" : ""}">Weggestrichen: ${struck.size} von ${target}</span>` +
    (mode === "up" && past("count1") ? `<span class="chip plus ${added === K ? "full" : ""}">Dazugelegt: ${added} von ${K}</span>` : "") +
    `<span class="chip">Übrig: ${phase === "strike" || phase === "step2" ? "?" : left()}</span>`;

  renderField();

  const ask = $("ask");
  if (phase === "count1" || phase === "count2") {
    ask.hidden = false;
    $("askQ").textContent = "Übrig:";
    $("askIn").value = "";
    setTimeout(() => $("askIn").focus({ preventScroll: true }), 50);
  } else ask.hidden = true;
  $("help").hidden = phase === "done";
}

function halfFree(r, h) {
  const s = r * 10 + h * 5;
  if (s + 5 > A) return false;
  for (let i = s; i < s + 5; i++) if (struck.has(i)) return false;
  return true;
}

function renderField() {
  const f = $("field");
  const s2 = phase === "step2";
  f.className = "field" + (s2 && mode === "down" ? " mode-single" : "");
  const nRows = Math.ceil((A + (mode === "up" && past("count1") ? K : 0)) / 10);
  let h = "";
  for (let r = 0; r < nRows; r++) {
    const tappable = phase === "strike" && r < fullRows() && !rowStruck(r);
    h += `<div class="row ${tappable ? "tap" : ""}" data-row="${r}" ${tappable ? `role="button" tabindex="0" aria-label="Reihe ${r + 1} wegstreichen"` : ""}>`;
    for (let half = 0; half < 2; half++) {
      const halfTap = s2 && mode === "five" && halfFree(r, half);
      h += `<div class="half ${halfTap ? "tap" : ""}" ${halfTap ? `data-half="${r * 10 + half * 5}" role="button" tabindex="0" aria-label="Fünfer wegstreichen"` : ""}>`;
      for (let c = half * 5; c < half * 5 + 5; c++) {
        const i = r * 10 + c;
        if (i >= A) {
          if (i - A < added) h += `<span class="cell back"></span>`;
          else if (s2 && mode === "up") h += `<button type="button" class="cell empty slot" data-slot="1" aria-label="Feld dazulegen"></button>`;
          else h += `<span class="cell empty"></span>`;
          continue;
        }
        if (struck.has(i)) {
          h += fresh.has(i) ? `<span class="cell struck" data-d="${fresh.get(i)}"></span>` : `<span class="cell struck still"></span>`;
        } else if (s2 && mode === "down") {
          h += `<button type="button" class="cell live" data-i="${i}" aria-label="Feld wegstreichen"></button>`;
        } else h += `<span class="cell"></span>`;
      }
      h += `</div>`;
    }
    const filled = A + added;
    h += `<span class="rowlabel">${r * 10 < filled ? Math.min(filled, r * 10 + 10) : ""}</span></div>`;
  }
  f.innerHTML = h;
  f.querySelectorAll("[data-d]").forEach(el => el.style.setProperty("--d", el.dataset.d + "s"));
  fresh = new Map();
}

function say(t, bad) { hint = t; hintBad = !!bad; }

function afterStrikePhase() {
  if (mode === "tens") { phase = "count2"; } else phase = "count1";
  say(""); celebrate(pick(PRAISE));
}

function strikeRow(r) {
  if (phase !== "strike") return;
  if (rowStruck(r)) { say("Die Reihe ist schon weggestrichen. Nimm eine andere!", true); render(); return; }
  if (r >= fullRows()) { say("Diese Reihe ist nicht voll. Nimm eine Reihe mit 10 Feldern!", true); render(); return; }
  for (let c = 0; c < 10; c++) { struck.add(r * 10 + c); fresh.set(r * 10 + c, c * 0.04); }
  if (struck.size === R) afterStrikePhase();
  else say(`${pick(SMALL)} Schon ${struck.size} weg. Noch ${R - struck.size}!`);
  render();
}
function step2Done() { phase = "count2"; say(""); celebrate(pick(PRAISE)); }
function addCell() {
  added++;
  if (added === K) step2Done(); else say(`${pick(SMALL)} Noch ${K - added}.`);
  render();
}
function strikeCell(i) {
  struck.add(i); fresh.set(i, 0);
  const done = struck.size - R;
  if (done === K) step2Done(); else say(`${pick(SMALL)} Noch ${K - done}.`);
  render();
}
function strikeFive(s) {
  for (let k = 0; k < 5; k++) { struck.add(s + k); fresh.set(s + k, k * 0.05); }
  step2Done(); render();
}

$("field").addEventListener("click", e => {
  const cell = e.target.closest(".cell");
  const row = e.target.closest(".row");
  const half = e.target.closest(".half");
  if (phase === "strike" && row) return strikeRow(+row.dataset.row);
  if (phase !== "step2") return;
  if (mode === "up") {
    if (cell && cell.dataset.slot) addCell(); else { say("Tippe auf ein leeres Feld am Ende.", true); render(); }
  } else if (mode === "down") {
    if (cell && cell.dataset.i) strikeCell(+cell.dataset.i); else { say("Tippe auf ein blaues Feld.", true); render(); }
  } else if (mode === "five") {
    if (half && half.dataset.half) strikeFive(+half.dataset.half);
    else { say("Nimm einen vollen Fünfer: 5 blaue Felder nebeneinander.", true); render(); }
  }
});
$("field").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  if (e.target.classList.contains("row")) { e.preventDefault(); strikeRow(+e.target.dataset.row); }
  else if (e.target.dataset && e.target.dataset.half && phase === "step2") { e.preventDefault(); strikeFive(+e.target.dataset.half); }
});

function check() {
  const v = parseInt($("askIn").value, 10);
  const want = phase === "count1" ? A - R : A - B;
  if (isNaN(v)) { say("Schreib eine Zahl hinein.", true); render(); return; }
  if (v === want) {
    say("");
    if (phase === "count1") { phase = "step2"; celebrate(pick(PRAISE)); }
    else { phase = "done"; celebrate("Super gemacht!", true); }
  } else {
    say(v > want ? "Hm, das sind zu viele. Zähl nochmal nach!" : "Hm, das sind zu wenige. Zähl nochmal nach!", true);
  }
  render();
}

function celebrate(text, big) {
  const p = $("praise");
  p.innerHTML = `<div>${text}</div>`;
  const n = big ? 18 : 8;
  for (let k = 0; k < n; k++) {
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * (big ? 220 : 120);
    const star = document.createElement("span");
    star.className = "star"; star.textContent = "★";
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

$("help").addEventListener("click", () => {
  if (phase === "strike") { const r = [...Array(fullRows()).keys()].reverse().find(r => !rowStruck(r)); strikeRow(r); }
  else if (phase === "step2") {
    if (mode === "up") addCell();
    else if (mode === "down") { let i = A - 1; while (i >= 0 && !isBlue(i)) i--; strikeCell(i); }
    else { for (let s = Math.floor((A - 5) / 5) * 5; s >= 0; s -= 5) if (halfFree(Math.floor(s / 10), (s % 10) / 5)) { strikeFive(s); break; } }
  }
  else if (phase === "count1" || phase === "count2") { $("askIn").value = phase === "count1" ? A - R : A - B; check(); }
});
$("askBtn").addEventListener("click", check);
$("askIn").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); check(); } });
// Neue Aufgabe von Hand oder per Zufall: danach die Adresse nachziehen. skr.state schreibt auf
// Layouts mit eigenen Fragmenten (visualization) nicht – deshalb dieselbe Form von Hand
// (ABWEICHUNGEN.md, A-002).
const syncUrl = () => {
  if (window.skr && skr.state) skr.state.update();
  const fresh = A === 57 && B === 19 ? "" : `#/?aufgabe=${A}-${B}`;
  if ((location.hash || "") === fresh) return;
  history.replaceState(null, "", fresh || location.pathname + location.search);
  window.dispatchEvent(new CustomEvent("skr-urlchange"));
};
$("setup").addEventListener("submit", e => { e.preventDefault(); if (setTask(parseInt($("inA").value, 10), parseInt($("inB").value, 10))) syncUrl(); });
$("reset").addEventListener("click", () => setTask(A, B));
$("rnd").addEventListener("click", () => {
  const ones = [9, 9, 8, 8, 7, 6, 5, 5, 4, 3, 2, 1];
  for (let t = 0; t < 100; t++) {
    const b = (1 + Math.floor(Math.random() * 6)) * 10 + pick(ones);
    const min = Math.max(b, Math.ceil(b / 10) * 10) + 2;
    const a = min + Math.floor(Math.random() * (100 - min));
    if (a > 99 || a % 10 === 0) continue;
    $("inA").value = a; $("inB").value = b;
    if (setTask(a, b)) { syncUrl(); return; }
  }
});

setTask(57, 19);

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
})();
