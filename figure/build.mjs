// Cuatro figuras isométricas, una por paso del proceso (prototipo).
// node figure/build.mjs → figure/figure.css, figure/figure.js, figure/pasos.html (prueba)
// e inyecta cada SVG en ../index.html entre <!-- STEP:n --> y <!-- /STEP:n -->.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = "C:/Users/jaimi/.claude/skills/anatomy";
const k = await import(pathToFileURL(`${SKILL}/kit/iso-kit.mjs`).href);
const { kitScript } = await import(pathToFileURL(`${SKILL}/scripts/inline-kit.mjs`).href);
const HERE = dirname(fileURLToPath(import.meta.url));

const W = 320, H = 262;
const PLATE = { x: -64, y: -46, w: 128, d: 92, r: 6 };
const PLATE_H = 8, FOOT_H = 4;
const TALL = 62;

// Una sola proyección para las cuatro: misma escala y mismo encuadre.
const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-58, -44, 49], [44, -30, TALL]], W, H, { pad: 6, azimuth: 45 });

// ---------- ayudas ----------
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const f2 = (n) => n.toFixed(2);
const poly = (pts) => "M" + pts.map((p) => at(p).map(f2).join(" ")).join(" L") + " Z";
const faceY = (x0, x1, z0, z1, y) => poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
const faceX = (y0, y1, z0, z1, x) => poly([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]);
const depth = (x, y) => k.depthOf([x, y, 0], P);
const byDepth = (pts) => [...pts].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
const part = (name, html, extra = "") => `<g data-part="${name}"${extra}>${html}</g>`;

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 12))) {
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H, 1.2, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 3.8, -PLATE_H - FOOT_H + 1.2, FOOT_H - 1.2, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 7.5);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.6, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  return out.join("");
}
function cellSlab(plan, z, lines = 3) {
  const out = [S(k.slabOf(plan, z, 1.2, P, 2), { tone: "hi", crease: "lo" })];
  const cy = plan.y + plan.d / 2;
  const gap = plan.d / (lines + 1);
  const d = [];
  for (let i = 1; i <= lines; i++) d.push(k.lineOnTop([plan.x, plan.y + gap * i], [plan.x + plan.w, plan.y + gap * i], z + 1.2, P));
  out.push(L(d.join(""), { tone: "lo" }));
  return out.join("") + (cy ? "" : "");
}
function fig(n, label, body) {
  return k.figureSvg({ width: W, height: H, label, body: [plate(), ...body] }).replace("<svg", `<svg data-fig="${n}"`);
}

// ================= 1 · Residuo fotovoltaico =================
// Módulos apilados, cubeta de fragmentos y una cinta que lleva una célula hacia el siguiente paso.
const SHARDS = [
  [[-52, -32], [-40, -33], [-38, -24], [-51, -22]],
  [[-36, -32], [-24, -31], [-26, -22], [-37, -23]],
  [[-52, -18], [-41, -19], [-39, -10], [-50, -9]],
  [[-36, -18], [-23, -19], [-24, -10], [-35, -9]],
];
const BIN = { x: -56, y: -38, w: 40, d: 34, r: 2.5 };
const MODS = { x: -58, y: 8, w: 40, d: 30, r: 1.4 };
const BELT = { x: -4, w: 60, y0: -12, y1: 8 };
const BELT_TOP = 12;
const CELL1 = { x: -8, y: -10, w: 16, d: 16, r: 0.8 };
const RUN = [4, 42];

function binSvg() {
  const out = [S(k.slabOf(BIN, 0, 2, P, 3), { tone: "lo" })];
  const wall = (plan) => S(k.slabOf(plan, 2, 11, P, 2, 0.4), { tone: "mid" });
  out.push(wall({ x: BIN.x, y: BIN.y, w: BIN.w, d: 2.2, r: 0.7 }));
  out.push(wall({ x: BIN.x, y: BIN.y, w: 2.2, d: BIN.d, r: 0.7 }));
  for (const ring of SHARDS) {
    out.push(S(k.extrude(ring, 2, 0.8, P), { tone: "hi", crease: "lo" }));
    const a = [(ring[0][0] + ring[3][0]) / 2, (ring[0][1] + ring[3][1]) / 2];
    const b = [(ring[1][0] + ring[2][0]) / 2, (ring[1][1] + ring[2][1]) / 2];
    out.push(L(k.lineOnTop(a, b, 2.8, P), { tone: "lo" }));
  }
  out.push(wall({ x: BIN.x + BIN.w - 2.2, y: BIN.y, w: 2.2, d: BIN.d, r: 0.7 }));
  out.push(wall({ x: BIN.x, y: BIN.y + BIN.d - 2.2, w: BIN.w, d: 2.2, r: 0.7 }));
  return out.join("");
}
function modulesSvg() {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const z = 0.6 + i * 3;
    out.push(S(k.slabOf({ ...MODS, x: MODS.x + 2, y: MODS.y + 2, w: MODS.w - 4, d: MODS.d - 4 }, z - 0.6, 0.6, P, 2), { tone: "lo", crease: "none" }));
    out.push(S(k.slabOf(MODS, z, 2.4, P, 2, 0.4), { tone: "mid" }));
  }
  const top = 0.6 + 2 * 3 + 2.4;
  const glass = k.insetPlan(MODS, 2);
  out.push(L(k.planOutline(glass, top, P, 2), { tone: "lo" }));
  const d = [];
  for (let i = 1; i < 5; i++) d.push(k.lineOnTop([glass.x + (glass.w / 5) * i, glass.y], [glass.x + (glass.w / 5) * i, glass.y + glass.d], top, P));
  for (let i = 1; i < 3; i++) d.push(k.lineOnTop([glass.x, glass.y + (glass.d / 3) * i], [glass.x + glass.w, glass.y + (glass.d / 3) * i], top, P));
  out.push(L(d.join(""), { tone: "faint" }));
  out.push(D([at([MODS.x + 1.2, MODS.y + MODS.d / 2, top])], { size: 0.45 }));
  return out.join("");
}
function beltBack() {
  const out = [];
  for (const x of [BELT.x + 2, BELT.x + BELT.w - 6]) out.push(S(k.slabOf({ x, y: BELT.y0 - 2, w: 4, d: 3, r: 0.8 }, 0, 8, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BELT.x, y: BELT.y0 - 3, w: BELT.w, d: 2, r: 0.6 }, 6, 9, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BELT.x + 1, y: BELT.y0 - 1, w: BELT.w - 2, d: BELT.y1 - BELT.y0 + 2, r: 2 }, 8, BELT_TOP - 8, P, 4), { tone: "lo" }));
  const seams = [];
  for (let x = BELT.x + 6; x < BELT.x + BELT.w - 2; x += 8) seams.push(k.lineOnTop([x, BELT.y0 - 1], [x, BELT.y1 + 1], BELT_TOP, P));
  out.push(L(seams.join(""), { tone: "faint" }));
  return out.join("");
}
function beltFront() {
  const out = [];
  const y = BELT.y1 + 1;
  out.push(S(k.slabOf({ x: BELT.x, y, w: BELT.w, d: 2, r: 0.6 }, 6, 9, P, 2, 0.3), { tone: "mid" }));
  for (const x of [BELT.x + 4, BELT.x + BELT.w - 4]) {
    out.push(L(k.sideRing([x, y + 2, 10.5], 2.4, "y", P), { tone: "lo" }));
    out.push(D([at([x, y + 2, 10.5])], { size: 0.5 }));
  }
  for (const x of [BELT.x + 2, BELT.x + BELT.w - 6]) out.push(S(k.slabOf({ x, y: y + 1, w: 4, d: 3, r: 0.8 }, 0, 6, P, 2), { tone: "mid" }));
  return out.join("");
}
const FIG1 = fig(0, "Paso 1, residuo fotovoltaico: módulos apilados, una cubeta con fragmentos de célula y una cinta que lleva una célula al separador.", [
  binSvg(),
  beltBack(),
  part("cell", cellSlab(CELL1, BELT_TOP), ` transform="${k.translateAlong(P, [RUN[0], 0, 0])}" style="opacity:0"`),
  beltFront(),
  modulesSvg(),
]);

// ================= 2 · Separación propia =================
const SEP = { x: -8, y: -40, w: 62, d: 46, r: 3 };
const SEP_FACE = SEP.y + SEP.d;     // 6
const SEP_TOP = 44;
const LAMP = [44, -30];
const CART = { x: -12, y: -35, w: 24, d: 22, r: 2 };
const CELL2 = { x: -8, y: -32, w: 16, d: 16, r: 0.8 };
const CART_RUN = [-44, 10];

function cartSvg() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CART, 2), 2, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(CART, 2.5, 3.5, P, 4, 0.5), { tone: "mid" }));
  out.push(D([-8, 0, 8].map((x) => at([x, CART.y + CART.d - 2, 6])), { size: 0.4, tone: "lo" }));
  out.push(part("cell", cellSlab(CELL2, 6)));
  return out.join("");
}
function separatorSvg() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(SEP, -2), 0, 3, P)}"/>`];
  out.push(S(k.slabOf(k.insetPlan(SEP, -2), 0, 3, P, 4, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(SEP, 3, SEP_TOP - 3, P, 4, 0.9), { tone: "mid", inner: L(k.sideSeam(SEP, 16, P, 4), { tone: "faint" }) }));
  out.push(S(k.slabOf(k.insetPlan(SEP, 2.5), SEP_TOP, 2, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline({ x: -2, y: -34, w: 30, d: 30, r: 1.6 }, SEP_TOP + 2, P, 3), { tone: "faint" }));
  out.push(D(k.dotGrid(1, -31, 6, 6, 4.4, SEP_TOP + 2, P), { size: 0.42, tone: "lo" }));
  // baliza
  const [lx, ly] = LAMP;
  out.push(S(k.cylinder(lx, ly, 3.4, SEP_TOP + 2, 2.4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(lx, ly, 2.6, SEP_TOP + 4.4, 4, P, 24), { tone: "mid" }));
  out.push(L(k.sideArc(lx, ly, 2.6, SEP_TOP + 8.4, P, 12), { tone: "lo" }));
  out.push(part("lamp", S(k.cylinder(lx, ly, 2.6, SEP_TOP + 8.4, 4, P, 24), { tone: "hi" })));
  out.push(L(k.sideArc(lx, ly, 2.6, SEP_TOP + 12.4, P, 12), { tone: "lo" }));
  out.push(S(k.cylinder(lx, ly, 2.6, SEP_TOP + 12.4, 3, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(lx, ly, 1.8, SEP_TOP + 15.4, 1.6, P, 18), { tone: "mid" }));
  // cara frontal
  out.push(`<path class="sv-screen" d="${faceY(-2, 22, 28, 38, SEP_FACE)}"/>`);
  out.push(L(faceY(-2, 22, 28, 38, SEP_FACE), { tone: "lo" }));
  out.push(`<g data-part="display">${k.faceTextSvg(k.sideMatrix([10, SEP_FACE], 30.3, P, "left"), "P-02", { size: 7, tone: "lit", anchor: "middle" })}</g>`);
  for (let i = 0; i < 4; i++) out.push(L(faceY(30 + i * 6, 32.4 + i * 6, 27, 38, SEP_FACE), { tone: "lo" }));
  out.push(L(faceY(-2, 48, 8, 20, SEP_FACE), { tone: "lo" }));
  out.push(D([[0.5, 10.5], [45.5, 10.5], [0.5, 17.5], [45.5, 17.5]].map(([x, z]) => at([x, SEP_FACE, z])), { size: 0.42 }));
  // cara derecha
  out.push(L(faceX(-34, 0, 8, 38, SEP.x + SEP.w), { tone: "lo" }));
  out.push(S(k.slabOf({ x: SEP.x + SEP.w, y: -20, w: 2.4, d: 6, r: 0.8 }, 20, 9, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}
function railsSvg() {
  const out = [];
  for (const y of [-32, -20]) {
    out.push(S(k.slabOf({ x: -58, y, w: 50, d: 4, r: 0.8 }, 0, 2.5, P, 3, 0.3), { tone: "mid" }));
    out.push(D([at([-54, y + 2, 2.5]), at([-24, y + 2, 2.5])], { size: 0.4 }));
  }
  out.push(S(k.slabOf({ x: -62, y: -35, w: 4, d: 26, r: 1 }, 0, 6, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}
function tagSvg(plan) {
  const out = [S(k.slabOf(plan, 0, 0.7, P, 3), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 1.3), 0.7, P, 3), { tone: "faint" }));
  [0.7, 0.55, 0.4].forEach((share, i) => {
    out.push(L(k.lineOnTop([plan.x + 4, plan.y + 4 + i * 3], [plan.x + 4 + (plan.w - 8) * share, plan.y + 4 + i * 3], 0.7, P), { tone: "lo", free: true }));
  });
  return out.join("");
}
const FIG2 = fig(1, "Paso 2, separación propia: un carro introduce la célula en el separador; la baliza se enciende mientras separa los materiales.", [
  railsSvg(),
  `<g data-part="cart" transform="${k.translateAlong(P, [CART_RUN[0], 0, 0])}">${cartSvg()}</g>`,
  separatorSvg(),
  tagSvg({ x: -48, y: 18, w: 34, d: 14, r: 1.4 }),
]);

// ================= piezas comunes de salida =================
const WALL = { x: -58, y: -44, w: 116, d: 18, r: 3 };
const WALL_FACE = WALL.y + WALL.d;   // -26
const WALL_H = 48;
function wallSvg(chutes) {
  const out = [`<path class="iso-halo" d="${k.haloOf(WALL, 0, 4, P)}"/>`];
  out.push(S(k.slabOf(k.insetPlan(WALL, -2), 0, 3, P, 4, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(WALL, 3, WALL_H - 3, P, 4, 0.9), { tone: "mid", inner: L(k.sideSeam(WALL, 14, P, 4), { tone: "faint" }) }));
  out.push(D(k.dotGrid(-50, -40, 22, 2, 4.6, WALL_H, P), { size: 0.42, tone: "lo" }));
  for (const c of chutes) {
    out.push(S(k.slabOf({ x: c - 12, y: WALL_FACE, w: 24, d: 2.5, r: 1 }, 30, 16, P, 3, 0.4), { tone: "mid" }));
    const y = WALL_FACE + 2.5;
    out.push(`<path class="sv-void" d="${faceY(c - 8, c + 8, 36, 44, y)}"/>`);
    out.push(L(faceY(c - 8, c + 8, 36, 44, y), { tone: "lo" }));
    out.push(D([at([c - 10, y, 44]), at([c + 10, y, 44])], { size: 0.4 }));
  }
  return out.join("");
}
function traySvg(c, end) {
  const y = WALL_FACE + 2.5;
  const d = end - y;
  return [
    S(k.slabOf({ x: c - 10, y, w: 2, d, r: 0.5 }, 33, 7, P, 2, 0.3), { tone: "mid" }),
    S(k.slabOf({ x: c - 8, y, w: 16, d, r: 0.5 }, 33, 3, P, 2), { tone: "lo" }),
    S(k.slabOf({ x: c + 8, y, w: 2, d, r: 0.5 }, 33, 7, P, 2, 0.3), { tone: "mid" }),
  ].join("");
}

// ================= 3 · Recuperación de plata y silicio =================
const C_AG = -26, C_SI = 26;
const MOULD = { x: -40, y: 2, w: 28, d: 24, r: 2 };
const INGOT = { x: -34, y: 7.5, w: 16, d: 13, r: 1.1 };
const INGOT_START = [0, -24, 30];
const RACK = { x: 12, y: 2, w: 28, d: 24, r: 2 };
const WAFER = { x: 18, y: 6, w: 16, d: 16, r: 1 };
const PINS = [[16.4, 4.4], [35.6, 4.4], [16.4, 23.6], [35.6, 23.6]];
const WAFERS = 6;

function silverSvg() {
  const out = [traySvg(C_AG, -4)];
  out.push(S(k.slabOf(MOULD, 0, 6, P, 4, 0.7), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MOULD, 3), 6, P, 3), { tone: "faint" }));
  out.push(D(k.corners(MOULD, 1.8).map(([x, y]) => at([x, y, 6])), { size: 0.42 }));
  const ingot =
    S(k.slabOf(INGOT, 6, 5, P, 3, 0.5), { tone: "hi", crease: "lo" }) +
    L(k.planOutline(k.insetPlan(INGOT, 2), 11, P, 3), { tone: "faint" }) +
    k.faceTextSvg(k.topMatrix([C_AG, 15.3], 11, P, "x"), "Ag", { size: 3.6, tone: "lo", anchor: "middle" });
  out.push(part("ingot", ingot, ` transform="${k.translateAlong(P, INGOT_START)}" style="opacity:0"`));
  return out.join("");
}
function siliconSvg() {
  const out = [traySvg(C_SI, -4)];
  out.push(S(k.slabOf(RACK, 0, 4, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(RACK, 2), 4, P, 3), { tone: "faint" }));
  const pin = ([x, y]) => S(k.cylinder(x, y, 1.1, 4, 12, P, 12), { tone: "mid", crease: "none" }) + S(k.cylinder(x, y, 1.5, 16, 0.9, P, 12), { tone: "mid" });
  const front = PINS[3];
  for (const p of byDepth(PINS.filter((p) => p !== front))) out.push(pin(p));
  for (let i = 0; i < WAFERS; i++) {
    const z = 4.5 + i * 1.7;
    const wafer = S(k.slabOf(WAFER, z, 1, P, 2), { tone: "hi", crease: "lo" }) + L(k.planOutline(k.insetPlan(WAFER, 1.8), z + 1, P, 2), { tone: "faint" });
    out.push(`<g data-wafer="${i}" style="opacity:0">${i === WAFERS - 1 ? part("wafer", wafer) : wafer}</g>`);
  }
  out.push(pin(front));
  return out.join("");
}
function rulerSvg() {
  const strip = { x: -50, y: 33, w: 100, d: 6, r: 1 };
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3.5, 5, strip.y + 0.7, 0.6, [1.6, 3], P);
  return S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }) + L(t.minor, { tone: "lo" }) + L(t.major, { tone: "mid" });
}
const FIG3 = fig(2, "Paso 3, recuperación de plata y silicio: de una bandeja cae un lingote de plata a su molde, y de la otra se apilan obleas de silicio.", [
  rulerSvg(),
  wallSvg([C_AG, C_SI]),
  silverSvg(),
  siliconSvg(),
]);

// ================= 4 · Valorización integral =================
const BEAKER = [0, 14];
const BEAKER_R = 13, RIM_Z = 30;
const LV_LOW = 12, LV_FULL = 27.5;
const POUR_Y = 5;
const DRUM = [40, 22];

function coagulantSvg() {
  const [bx, by] = BEAKER;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: bx - 16, y: by - 16, w: 32, d: 32, r: 16 }, 0, 3, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.cylinder(bx, by, 16, 0, 3, P, 56, 0.5), { tone: "lo" }));
  out.push(D([0.6, 2.7, 4.8].map((a) => at([bx + Math.cos(a) * 14.4, by + Math.sin(a) * 14.4, 3])), { size: 0.42 }));
  out.push(S(k.cylinder(bx, by, BEAKER_R, 3, RIM_Z - 3, P, 64), {
    tone: "mid",
    inner: L([10, 20].map((z) => k.sideArc(bx, by, BEAKER_R, z, P, 40)).join(""), { tone: "faint" }),
  }));
  const rimIn = k.ring(bx, by, BEAKER_R - 1, RIM_Z, P, 64);
  out.push(`<clipPath id="sv-mouth"><path d="${rimIn}"/></clipPath>`);
  out.push(`<path class="sv-cavity" d="${rimIn}"/>`);
  const lv = k.ring(bx, by, BEAKER_R - 1, LV_LOW, P, 64);
  out.push(`<g clip-path="url(#sv-mouth)"><g data-part="liquid"><path class="sv-liquid" data-liquid d="${lv}"/><path class="iso-line" data-tone="lo" data-liquid d="${lv}"/></g>`);
  const a = at([bx, POUR_Y, 33]), b = at([bx, POUR_Y, LV_LOW]);
  out.push(`<path class="sv-pour" data-pour style="opacity:0" d="M${a.map(f2).join(" ")} L${b.map(f2).join(" ")}"/></g>`);
  out.push(L(rimIn, { tone: "lo" }));
  out.push(traySvg(0, 6));
  // bidón de almacenamiento
  const [dx, dy] = DRUM;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: dx - 10, y: dy - 10, w: 20, d: 20, r: 10 }, 0, 2, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.cylinder(dx, dy, 10, 0, 24, P, 48, 0.6), { tone: "mid", inner: L([6, 18].map((z) => k.sideArc(dx, dy, 10, z, P, 32)).join(""), { tone: "lo" }) }));
  out.push(L(k.ring(dx, dy, 8.6, 24, P, 40), { tone: "faint" }));
  out.push(S(k.cylinder(dx + 4, dy - 3, 1.8, 24, 1.6, P, 16), { tone: "mid" }));
  out.push(D([at([dx - 4, dy + 2, 24])], { size: 0.45 }));
  return out.join("");
}
const FIG4 = fig(3, "Paso 4, valorización integral: otra corriente del proceso cae desde la bandeja a un vaso que se llena de coagulante, junto a un bidón de almacenamiento.", [
  wallSvg([0]),
  coagulantSvg(),
]);

// ---------- estilos de marca ----------
const BRAND_CSS = `
.iso[data-theme="light"]{
  --anatomy-card:transparent;--anatomy-paper:#fbfcfc;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
  --anatomy-shade-0:#d3dce2;--anatomy-shade-1:#dde4e8;--anatomy-shade-2:#e7ecef;--anatomy-shade-3:#f0f3f5;
  --anatomy-lit-top:#e3f3ed;--anatomy-lit-shade:#cfe8df;
  --anatomy-hi:#0b2036;--anatomy-mid:#6d8191;--anatomy-lo:#a9b8c3;--anatomy-faint:#d2dbe1;--anatomy-lit:#16806c;
  --anatomy-halo:#5b7486;--anatomy-dot:#2c3e50;
  --sv-void:#8fa3b1;--sv-cavity:#c4d0d8;--sv-screen:#0d2a4c;--sv-liquid:#bfe4d6;
}
.sv-void{fill:var(--sv-void)}
.sv-cavity{fill:var(--sv-cavity)}
.sv-screen{fill:var(--sv-screen)}
.sv-liquid{fill:var(--sv-liquid);transition:fill .4s}
[data-part="liquid"][data-on] .sv-liquid{fill:#9fd7c3}
.sv-pour{fill:none;stroke:#2fa37e;stroke-width:1.3;stroke-linecap:round}
[data-part="display"] .iso-face-text{font-family:var(--anatomy-mono);font-weight:600;fill:#56d6a6}
.step-fig{margin:-1.2rem -1rem .5rem;aspect-ratio:${W}/${H}}
.step-fig .iso-svg{width:100%;height:auto}
`;

// ---------- animación ----------
const live = `
const P = ${JSON.stringify(P)};
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const setLit = (g, on) => { if (!g || g.__lit === on) return; g.__lit = on; g.querySelectorAll(".iso-solid").forEach((el) => el.toggleAttribute("data-lit", on)); g.toggleAttribute("data-on", on); };
const figs = [];

function residuo(svg) {
  const cell = svg.querySelector('[data-part="cell"]');
  const RUN = ${JSON.stringify(RUN)};
  setLit(cell, true);
  return { period: 3.8, rest: 1.6, pose(t) {
    const x = RUN[0] + (RUN[1] - RUN[0]) * ease(span(t, 0.2, 3.1));
    cell.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    cell.style.opacity = (span(t, 0, 0.4) * (1 - span(t, 2.9, 3.4))).toFixed(3);
  } };
}
function separacion(svg) {
  const cart = svg.querySelector('[data-part="cart"]');
  const cell = svg.querySelector('[data-part="cell"]');
  const lamp = svg.querySelector('[data-part="lamp"]');
  const RUN = ${JSON.stringify(CART_RUN)};
  return { period: 5.2, rest: 2, pose(t) {
    const into = ease(span(t, 0.2, 1.5)), back = ease(span(t, 2.9, 4.2));
    const x = RUN[0] + (RUN[1] - RUN[0]) * (into - back);
    cart.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    cell.style.opacity = (t < 1.6 ? 1 : span(t, 4.3, 4.9)).toFixed(3);
    const on = t > 1.5 && t < 2.9;
    setLit(lamp, on);
    setLit(cell, !on);
  } };
}
function plataSilicio(svg) {
  const ingot = svg.querySelector('[data-part="ingot"]');
  const wafers = [...svg.querySelectorAll("[data-wafer]")];
  const top = svg.querySelector('[data-part="wafer"]');
  const S0 = ${JSON.stringify(INGOT_START)}, N = ${WAFERS};
  return { period: 7.6, rest: 6.2, pose(t) {
    const fade = 1 - span(t, 6.7, 7.3);
    const u = span(t, 0.2, 1.8);
    let oy, oz;
    if (u < 0.5) { oy = S0[1] * (1 - 0.7 * ease(u / 0.5)); oz = S0[2]; }
    else { const v = (u - 0.5) / 0.5; oy = S0[1] * 0.3 * (1 - ease(v)); oz = S0[2] * (1 - v * v); }
    ingot.setAttribute("transform", translateAlong(P, [0, oy, oz]));
    ingot.style.opacity = (span(t, 0.2, 0.5) * fade).toFixed(3);
    const count = N * span(t, 2.2, 4.6);
    wafers.forEach((w, i) => {
      const op = clamp(count - i, 0, 1);
      w.style.opacity = (op * fade).toFixed(3);
      w.setAttribute("transform", translateAlong(P, [0, 0, (1 - ease(op)) * 6]));
    });
    setLit(ingot, t < 2.2);
    setLit(top, t >= 2.2);
  } };
}
function coagulante(svg) {
  const paths = [...svg.querySelectorAll("[data-liquid]")];
  const liquid = svg.querySelector('[data-part="liquid"]');
  const pour = svg.querySelector("[data-pour]");
  const B = ${JSON.stringify(BEAKER)}, R = ${BEAKER_R - 1}, LOW = ${LV_LOW}, FULL = ${LV_FULL}, PY = ${POUR_Y};
  return { period: 6.4, rest: 4, pose(t) {
    const level = LOW + (FULL - LOW) * (ease(span(t, 0.3, 3.4)) - ease(span(t, 4.9, 6.1)));
    const d = ring(B[0], B[1], R, level, P, 64);
    paths.forEach((p) => p.setAttribute("d", d));
    const a = iso([B[0], PY, 33], P), b = iso([B[0], PY, level], P);
    pour.setAttribute("d", "M" + a[0].toFixed(2) + " " + a[1].toFixed(2) + " L" + b[0].toFixed(2) + " " + b[1].toFixed(2));
    pour.style.opacity = (span(t, 0.2, 0.5) * (1 - span(t, 3.0, 3.4))).toFixed(3);
    setLit(liquid, t > 0.3 && t < 4.9);
  } };
}
const makers = [residuo, separacion, plataSilicio, coagulante];
document.querySelectorAll("svg[data-fig]").forEach((svg) => {
  const f = makers[Number(svg.dataset.fig)](svg);
  f.svg = svg; f.t = 0; f.visible = false;
  f.pose(still.matches ? f.rest : 0);
  figs.push(f);
  new IntersectionObserver((entries) => { f.visible = entries[entries.length - 1].isIntersecting; if (f.visible) run(); }, { rootMargin: "60px 0px" }).observe(svg);
});
let frame = 0, last = 0;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  let any = false;
  for (const f of figs) {
    if (!f.visible || still.matches) continue;
    any = true;
    f.t = (f.t + dt) % f.period;
    f.pose(f.t);
  }
  frame = any ? requestAnimationFrame(tick) : 0;
  if (!any) last = 0;
}
function run() { if (!frame && !still.matches) frame = requestAnimationFrame(tick); }
`;

// ---------- salida ----------
const FIGS = [FIG1, FIG2, FIG3, FIG4];
writeFileSync(join(HERE, "figure.css"), k.ISO_CSS + BRAND_CSS);
writeFileSync(join(HERE, "figure.js"), `(function(){\n${kitScript()}\n${live}\n})();\n`);
writeFileSync(join(HERE, "pasos.html"), k.pageHtml({
  title: "Pasos SilverSunshine",
  theme: "light",
  width: 760,
  body: `<style>${BRAND_CSS}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.grid>div{background:#fbfcfc;border-radius:14px;padding:8px}</style><div class="grid">${FIGS.map((s) => `<div class="iso-plate step-fig">${s}</div>`).join("")}</div>`,
  script: kitScript() + live,
}));
const indexPath = join(HERE, "..", "index.html");
let index = readFileSync(indexPath, "utf8");
FIGS.forEach((svg, n) => {
  index = index.replace(new RegExp(`<!-- STEP:${n} -->[\\s\\S]*?<!-- /STEP:${n} -->`), `<!-- STEP:${n} -->${svg}<!-- /STEP:${n} -->`);
});
writeFileSync(indexPath, index);
console.log("wrote figure.css, figure.js, pasos.html, index.html");
