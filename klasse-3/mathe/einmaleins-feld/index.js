// Einmaleins-Feld: Ein Rechteck im 10×10-Feld aufziehen, die Kästchen zeilenweise zählen.
// Der gezeigte Zustand steht in der Adresse (skr.state): `#/?feld=3x4` sind 3 Zeilen mit je
// 4 Kästchen oben links, `#/?feld=3x4@2,1` dasselbe ab Zeile 3, Spalte 2.
(() => {
  const N = 10;
  const root = document.querySelector(".einmaleins-feld");
  if (!root) return;
  const grid = document.getElementById("emf-grid");
  const eq = document.getElementById("emf-eq");
  const sub = document.getElementById("emf-sub");
  const optEnd = document.getElementById("emf-opt-end");
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const d = document.createElement("div");
    d.className = "emf-c"; d.dataset.r = r; d.dataset.c = c;
    grid.appendChild(d); cells.push(d);
  }

  // Auswahl: Anker und gegenüberliegende Ecke (in jede Richtung)
  let anchor = { r: 0, c: 0 }, corner = { r: 1, c: 2 }, dragging = false;

  const box = () => ({
    r0: Math.min(anchor.r, corner.r), r1: Math.max(anchor.r, corner.r),
    c0: Math.min(anchor.c, corner.c), c1: Math.max(anchor.c, corner.c)
  });

  function render() {
    const { r0, r1, c0, c1 } = box();
    const rows = r1 - r0 + 1, cols = c1 - c0 + 1;
    const showEnd = optEnd.checked;
    for (const d of cells) {
      const r = +d.dataset.r, c = +d.dataset.c;
      const inside = r >= r0 && r <= r1 && c >= c0 && c <= c1;
      d.classList.toggle("is-on", inside);
      d.classList.toggle("is-end", inside && showEnd && c === c1);
      d.classList.toggle("is-anchor", dragging && r === anchor.r && c === anchor.c);
      d.textContent = inside ? ((r - r0) * cols + (c - c0) + 1) : "";
    }
    eq.innerHTML = `<span>${rows}</span><span class="emf-op">·</span><span>${cols}</span><span class="emf-op">=</span><span class="emf-res">${rows * cols}</span>`;
    sub.textContent = `${rows} ${rows === 1 ? "Zeile" : "Zeilen"} mit je ${cols} Kästchen`;
  }

  const feld = () => {
    const { r0, r1, c0, c1 } = box();
    return `${r1 - r0 + 1}x${c1 - c0 + 1}` + (r0 || c0 ? `@${r0 + 1},${c0 + 1}` : "");
  };

  // Nach jeder Bedienung die Adresse nachziehen. skr.state schreibt auf Layouts mit eigenen
  // Fragmenten (visualization) nicht – deshalb dieselbe Form von Hand (ABWEICHUNGEN.md, A-002).
  function changed() {
    render();
    if (window.skr && skr.state) skr.state.update();
    const fresh = feld() === "2x3" ? "" : `#/?feld=${feld()}`;
    if ((location.hash || "") === fresh) return;
    history.replaceState(null, "", fresh || location.pathname + location.search);
    window.dispatchEvent(new CustomEvent("skr-urlchange"));
  }

  function cellAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (el && el.classList.contains("emf-c")) return { r: +el.dataset.r, c: +el.dataset.c };
    // außerhalb des Felds: an den Rand des Felds klemmen
    const b = grid.getBoundingClientRect();
    const cx = Math.min(Math.max(x, b.left + 4), b.right - 4);
    const cy = Math.min(Math.max(y, b.top + 4), b.bottom - 4);
    const el2 = document.elementFromPoint(cx, cy);
    if (el2 && el2.classList.contains("emf-c")) return { r: +el2.dataset.r, c: +el2.dataset.c };
    return null;
  }

  grid.addEventListener("pointerdown", e => {
    const p = cellAt(e.clientX, e.clientY); if (!p) return;
    e.preventDefault();
    grid.setPointerCapture(e.pointerId);
    dragging = true; anchor = p; corner = { ...p }; render();
  });
  grid.addEventListener("pointermove", e => {
    if (!dragging) return;
    const p = cellAt(e.clientX, e.clientY);
    if (p && (p.r !== corner.r || p.c !== corner.c)) { corner = p; render(); }
  });
  const end = () => { if (dragging) { dragging = false; changed(); } };
  grid.addEventListener("pointerup", end);
  grid.addEventListener("pointercancel", end);

  grid.addEventListener("keydown", e => {
    const k = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
    if (!k) return;
    e.preventDefault();
    corner = { r: Math.min(N - 1, Math.max(0, corner.r + k[0])), c: Math.min(N - 1, Math.max(0, corner.c + k[1])) };
    changed();
  });

  optEnd.addEventListener("change", render);
  document.getElementById("emf-reset").addEventListener("click", () => { anchor = { r: 0, c: 0 }; corner = { r: 0, c: 0 }; changed(); });

  render();

  if (window.skr && skr.state) {
    skr.state.register({
      key: "feld",
      read: feld,
      apply: value => {
        const m = /^(\d+)x(\d+)(?:@(\d+),(\d+))?$/.exec(value || "");
        if (!m) return;
        const r0 = m[3] ? +m[3] - 1 : 0, c0 = m[4] ? +m[4] - 1 : 0;
        const r1 = r0 + +m[1] - 1, c1 = c0 + +m[2] - 1;
        if (+m[1] < 1 || +m[2] < 1 || r0 < 0 || c0 < 0 || r1 >= N || c1 >= N) return;
        anchor = { r: r0, c: c0 }; corner = { r: r1, c: c1 }; render();
      }
    });
  }
})();
