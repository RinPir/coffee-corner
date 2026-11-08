/* ==========================================================================
   ambient.js: the calm animated scene. It follows the season:
   winter = snow, spring = rain on a window,
   autumn = a candle, summer = dappled sunlight.
   Everything is measured in "u": one hundredth of the screen's shorter side.
   ========================================================================== */

function renderAmbient() {
  return `<canvas class="ambient-canvas"></canvas>`;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function paintSky(ctx, w, h, top, bottom) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

// A soft round dot, prepared once and reused so the animation stays smooth
function softDot(color) {
  const dot = document.createElement("canvas");
  dot.width = dot.height = 64;
  const ctx = dot.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, color);
  glow.addColorStop(0.55, color);
  glow.addColorStop(1, "rgba(245, 238, 228, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  return dot;
}

// Slow, irregular wobble between about -1 and 1, used for the candle flame
function wobble(t) {
  return (Math.sin(t * 1.7) + Math.sin(t * 2.9 + 1.3) * 0.6 + Math.sin(t * 5.3 + 0.7) * 0.25) / 1.85;
}

const SCENES = {
  // --- Winter: slowly falling snow ------------------------------------------
  winter: {
    setup(s, w, h, u, dark) {
      s.top = dark ? "#2F3A33" : "#8FA39A";
      s.bottom = dark ? "#3A2921" : "#B7C3BC";
      s.dot = softDot("rgba(245, 238, 228, 1)");
      s.flakes = Array.from({ length: 90 }, () => {
        const depth = Math.random(); // 0 is far away, 1 is close
        return {
          x: rand(0, w), y: rand(0, h), depth,
          size: (1 + depth * 2.2) * u,
          speed: (1.6 + depth * 4.5) * u,
          phase: rand(0, 6.28),
        };
      });
    },
    draw(ctx, s, w, h, u, t, dt) {
      paintSky(ctx, w, h, s.top, s.bottom);
      for (const flake of s.flakes) {
        flake.y += flake.speed * dt;
        if (flake.y > h + flake.size) { flake.y = -flake.size; flake.x = rand(0, w); }
        const x = flake.x + Math.sin(t * 0.35 + flake.phase) * 3 * u;
        ctx.globalAlpha = 0.45 + flake.depth * 0.5;
        ctx.drawImage(s.dot, x - flake.size / 2, flake.y - flake.size / 2, flake.size, flake.size);
      }
      ctx.globalAlpha = 1;
    },
  },

  // --- Spring: rain trickling down a window ---------------------------------
  spring: {
    setup(s, w, h, u, dark) {
      s.top = dark ? "#3A2F3A" : "#CFC5D3";
      s.bottom = dark ? "#3A2921" : "#E7D9C6";
      s.body = dark ? "rgba(245, 238, 228, .24)" : "rgba(122, 86, 66, .24)";
      s.shine = dark ? "rgba(245, 238, 228, .55)" : "rgba(245, 238, 228, .85)";
      s.trail = dark ? "rgba(245, 238, 228, .12)" : "rgba(122, 86, 66, .13)";

      // The small resting droplets are drawn once
      s.still = document.createElement("canvas");
      s.still.width = w;
      s.still.height = h;
      const layer = s.still.getContext("2d");
      for (let i = 0; i < 170; i++) drawDrop(layer, s, rand(0, w), rand(0, h), rand(0.14, 0.55) * u);

      s.runners = Array.from({ length: 8 }, () => resetRunner({}, w, h, u, true));
    },
    draw(ctx, s, w, h, u, t, dt) {
      paintSky(ctx, w, h, s.top, s.bottom);
      ctx.drawImage(s.still, 0, 0);
      ctx.lineCap = "round";
      for (const drop of s.runners) {
        drop.wait -= dt;
        if (drop.wait > 0) continue;
        // Drops hesitate, then slide on, like real ones
        drop.y += drop.speed * (0.55 + 0.45 * Math.sin(t * 0.8 + drop.phase)) * dt;
        const x = (y) => drop.x + Math.sin(y / (9 * u) + drop.phase) * 0.9 * u;

        ctx.strokeStyle = s.trail;
        ctx.lineWidth = drop.r * 0.9;
        ctx.beginPath();
        const start = Math.max(drop.startY, drop.y - drop.trail);
        for (let y = start; y < drop.y; y += u) ctx.lineTo(x(y), y);
        ctx.stroke();

        drawDrop(ctx, s, x(drop.y), drop.y, drop.r);
        if (drop.y - drop.trail > h) resetRunner(drop, w, h, u, false);
      }
    },
  },

  // --- Autumn: a candle ------------------------------------------------------
  autumn: {
    setup(s, w, h, u, dark) {
      s.dark = dark;
      s.wall = dark ? "#3A2921" : "#E7D9C6";
      s.table = dark ? "#2F211B" : "#D6C3AA";
      s.waxLeft = dark ? "#C9B79F" : "#F5EEE4";
      s.waxRight = dark ? "#8F735A" : "#D8C5AD";
      s.waxTop = dark ? "#E7D9C6" : "#FBF7F0";
      s.smokeDot = softDot(dark ? "rgba(231, 217, 198, .55)" : "rgba(122, 86, 66, .5)");
    },
    draw(ctx, s, w, h, u, t, dt) {
      updateCandle(dt);
      const cx = w / 2;
      const tableY = h * 0.8;
      const wax = { w: 17 * u, h: 32 * u };
      const topY = tableY - wax.h;
      const flicker = wobble(t);
      const flameH = 11.5 * u * (1 + flicker * 0.07) * candleFlame;
      const sway = wobble(t * 0.6 + 4) * 0.7 * u;
      const flameBase = topY - 2.6 * u;

      // Wall and table
      ctx.fillStyle = s.wall;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = s.table;
      ctx.fillRect(0, tableY, w, h - tableY);

      // The room dims when the candle is out
      ctx.fillStyle = `rgba(58, 41, 33, ${0.26 * (1 - candleFlame)})`;
      ctx.fillRect(0, 0, w, h);

      // Warm glow, breathing with the flame
      const glowR = 62 * u;
      const glow = ctx.createRadialGradient(cx, flameBase - flameH / 2, 0, cx, flameBase - flameH / 2, glowR);
      const strength = ((s.dark ? 0.34 : 0.42) + flicker * 0.04) * candleFlame;
      glow.addColorStop(0, `rgba(217, 164, 91, ${strength})`);
      glow.addColorStop(1, "rgba(217, 164, 91, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Soft shadow under the candle
      ctx.fillStyle = "rgba(58, 41, 33, .14)";
      ctx.beginPath();
      ctx.ellipse(cx, tableY + 0.6 * u, wax.w * 0.72, 2 * u, 0, 0, 6.29);
      ctx.fill();

      // Wax
      const body = ctx.createLinearGradient(cx - wax.w / 2, 0, cx + wax.w / 2, 0);
      body.addColorStop(0, s.waxLeft);
      body.addColorStop(1, s.waxRight);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(cx, tableY, wax.w / 2, 1.5 * u, 0, 0, 3.15);
      ctx.lineTo(cx - wax.w / 2, topY);
      ctx.lineTo(cx + wax.w / 2, topY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = s.waxTop;
      ctx.beginPath();
      ctx.ellipse(cx, topY, wax.w / 2, 1.5 * u, 0, 0, 6.29);
      ctx.fill();

      // Wick
      ctx.strokeStyle = "#7A5642";
      ctx.lineWidth = 0.55 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx + sway * 0.2, flameBase + 0.8 * u);
      ctx.stroke();

      // Flame: three nested teardrops
      if (candleFlame > 0.02) {
        flame(ctx, cx, flameBase, sway, 3.3 * u * candleFlame, flameH, "#C9733E");
        flame(ctx, cx, flameBase - 0.2 * u, sway, 2.6 * u * candleFlame, flameH * 0.86, "#D9A45B");
        flame(ctx, cx, flameBase - 0.4 * u, sway * 0.8, 1.45 * u * candleFlame, flameH * 0.56, "#F3E0B0");
      }

      drawSmoke(ctx, s, cx, flameBase, u, t, dt);
      drawMatch(ctx, cx, flameBase, w, u, t);
    },
  },

  // --- Summer: dappled sunlight drifting across a wall -----------------------
  summer: {
    setup(s, w, h, u, dark) {
      s.wall = dark ? "#3A2921" : "#E3D3BC";
      s.light = dark ? ["217, 164, 91", "240, 180, 142"] : ["251, 243, 220", "245, 226, 170"];
      s.patches = Array.from({ length: 26 }, (_, i) => ({
        x: rand(-0.05, 1.05) * w, y: rand(-0.05, 1.05) * h,
        r: rand(9, 26) * u,
        color: s.light[i % 2],
        alpha: rand(0.45, 0.85) * (dark ? 0.45 : 1),
        driftX: rand(2, 6) * u, driftY: rand(1.5, 5) * u,
        speed: rand(0.1, 0.24), phase: rand(0, 6.28),
      }));
    },
    draw(ctx, s, w, h, u, t) {
      ctx.fillStyle = s.wall;
      ctx.fillRect(0, 0, w, h);
      for (const patch of s.patches) {
        const x = patch.x + Math.sin(t * patch.speed + patch.phase) * patch.driftX;
        const y = patch.y + Math.cos(t * patch.speed * 0.8 + patch.phase) * patch.driftY;
        const alpha = patch.alpha * (0.72 + 0.28 * Math.sin(t * patch.speed * 2.2 + patch.phase * 2));
        const light = ctx.createRadialGradient(x, y, 0, x, y, patch.r);
        light.addColorStop(0, `rgba(${patch.color}, ${alpha})`);
        light.addColorStop(0.5, `rgba(${patch.color}, ${alpha * 0.6})`);
        light.addColorStop(1, `rgba(${patch.color}, 0)`);
        ctx.fillStyle = light;
        ctx.fillRect(x - patch.r, y - patch.r, patch.r * 2, patch.r * 2);
      }
    },
  },
};

// --- The candle's little story ----------------------------------------------
// Tap: it's blown out and smoke curls up. Tap again: a match comes in and
// lights it. Only the autumn scene has a candle.

const MATCH_TIME = 2.6;      // how long the match's visit takes (seconds)

let candleIsLit = true;
let candleFlame = 1;         // 0 is out, 1 is full size
let candleMatch = -1;        // the match's journey from 0 to 1; -1 means no match
let candleSmokeLeft = 0;     // seconds of new smoke still to come
let candleSmokeWait = 0;
let candleSmoke = [];

function tapAmbient() {
  if (currentSeason() !== "autumn" || candleMatch >= 0) return;
  if (candleIsLit) {
    candleIsLit = false;
    candleSmokeLeft = 4;
  } else {
    candleMatch = 0;
  }
}

function resetAmbient() {
  candleIsLit = true;
  candleFlame = 1;
  candleMatch = -1;
  candleSmokeLeft = 0;
  candleSmoke = [];
}

function updateCandle(dt) {
  if (candleMatch >= 0) {
    candleMatch += dt / MATCH_TIME;
    if (candleMatch >= 0.48) candleIsLit = true; // the match has reached the wick
    if (candleMatch >= 1) candleMatch = -1;
  }
  candleFlame = candleIsLit
    ? Math.min(1, candleFlame + dt / 0.8)
    : Math.max(0, candleFlame - dt / 0.3);
}

function drawSmoke(ctx, s, cx, base, u, t, dt) {
  candleSmokeLeft = Math.max(0, candleSmokeLeft - dt);
  candleSmokeWait -= dt;
  if (candleSmokeLeft > 0 && !candleIsLit && candleSmokeWait <= 0) {
    candleSmoke.push({ age: 0, phase: t });
    candleSmokeWait = 0.09;
  }
  // The ember on the wick fades as the smoke runs out
  if (!candleIsLit && candleSmokeLeft > 0) {
    ctx.fillStyle = `rgba(201, 115, 62, ${Math.min(1, candleSmokeLeft / 2)})`;
    ctx.beginPath();
    ctx.arc(cx, base + 0.8 * u, 0.6 * u, 0, 6.29);
    ctx.fill();
  }

  candleSmoke = candleSmoke.filter((puff) => (puff.age += dt) < 4);
  for (const puff of candleSmoke) {
    const size = (1.6 + puff.age * 2.6) * u;
    const x = cx + Math.sin(puff.age * 1.7 + puff.phase * 0.3) * puff.age * 2.2 * u;
    const y = base - puff.age * 11 * u;
    ctx.globalAlpha = 0.75 * (1 - puff.age / 4);
    ctx.drawImage(s.smokeDot, x - size / 2, y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawMatch(ctx, cx, base, w, u, t) {
  if (candleMatch < 0) return;
  // In for the first half, a short pause at the wick, then away
  const away = candleMatch < 0.42 ? 1 - candleMatch / 0.42
             : candleMatch < 0.58 ? 0
             : (candleMatch - 0.58) / 0.42;
  const eased = away * away * (3 - 2 * away);
  const tipX = cx + 3 * u + eased * w * 0.75;
  const tipY = base - 2 * u + eased * 14 * u;

  ctx.strokeStyle = "#C08A5B";
  ctx.lineWidth = 1 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + 42 * u, tipY + 26 * u);
  ctx.stroke();
  ctx.fillStyle = "#8E4A2F";
  ctx.beginPath();
  ctx.arc(tipX, tipY, 1.1 * u, 0, 6.29);
  ctx.fill();

  const lick = wobble(t * 2) * 0.5 * u;
  flame(ctx, tipX, tipY + 0.4 * u, lick, 2 * u, 7 * u, "#C9733E");
  flame(ctx, tipX, tipY + 0.2 * u, lick, 1.2 * u, 4.6 * u, "#F3E0B0");
}

function drawDrop(ctx, s, x, y, r) {
  ctx.fillStyle = s.body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 6.29);
  ctx.fill();
  ctx.fillStyle = s.shine;
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, 6.29);
  ctx.fill();
}

function resetRunner(drop, w, h, u, firstTime) {
  drop.x = rand(0, w);
  drop.y = firstTime ? rand(0, h) : rand(-0.1, 0.35) * h;
  drop.startY = drop.y;
  drop.r = rand(0.55, 1) * u;
  drop.speed = rand(3.5, 9) * u;
  drop.trail = rand(9, 22) * u;
  drop.phase = rand(0, 6.28);
  drop.wait = firstTime ? rand(0, 4) : rand(1, 6);
  return drop;
}

function flame(ctx, x, base, sway, halfWidth, height, color) {
  const tipX = x + sway;
  const tipY = base - height;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.bezierCurveTo(x + halfWidth * 0.3 + sway * 0.6, base - height * 0.62, x + halfWidth * 1.15, base - height * 0.32, x + halfWidth * 0.7, base - height * 0.1);
  ctx.bezierCurveTo(x + halfWidth * 0.4, base + height * 0.03, x - halfWidth * 0.4, base + height * 0.03, x - halfWidth * 0.7, base - height * 0.1);
  ctx.bezierCurveTo(x - halfWidth * 1.15, base - height * 0.32, x - halfWidth * 0.3 + sway * 0.6, base - height * 0.62, tipX, tipY);
  ctx.fill();
}

// --- The animation loop -----------------------------------------------------
// It only runs while the scene is on screen, to spare the battery.

let ambientRunning = false;
let ambientScene = {};
let ambientLast = 0;
let ambientDrawn = 0;

function ambientCanvas() {
  return document.querySelector(".ambient-canvas");
}

function ambientShouldRun() {
  return editPanel.hidden && !document.hidden && ambientCanvas() &&
         (activeScreenId === "ambient" || isChanging);
}

// Called whenever the scene might have become visible
function ambientWake() {
  if (ambientRunning || !ambientShouldRun()) return;
  ambientRunning = true;
  ambientLast = performance.now();
  ambientDrawn = 0;
  requestAnimationFrame(ambientFrame);
}

function ambientFrame(now) {
  if (!ambientShouldRun()) { ambientRunning = false; return; }
  requestAnimationFrame(ambientFrame);
  if (now - ambientDrawn < 32) return; // about 30 pictures a second is plenty
  ambientDrawn = now;

  const dt = Math.min((now - ambientLast) / 1000, 0.1);
  ambientLast = now;

  const canvas = ambientCanvas();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * ratio);
  const h = Math.round(canvas.clientHeight * ratio);
  const u = Math.min(w, h) / 100;
  const season = currentSeason();
  const key = `${season} ${state.background} ${w} ${h}`;

  // Start the scene afresh after a change of season, background or rotation
  if (ambientScene.key !== key || canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    ambientScene = { key };
    SCENES[season].setup(ambientScene, w, h, u, state.background === "dark");
  }
  SCENES[season].draw(canvas.getContext("2d"), ambientScene, w, h, u, now / 1000, dt);
}
