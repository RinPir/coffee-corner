/* ==========================================================================
   app.js: starts the app and handles swipes and the long press.
   ========================================================================== */

// Change these numbers if touches feel too sensitive or not sensitive enough.
const GESTURES = {
  edgeGuard: 20,          // touches starting this close to the edge (px) are ignored: that's your grip
  swipeMinDistance: 110,  // a swipe must travel at least this far (px)...
  swipeMinShare: 0.12,    // ...and at least this share of the screen width
  swipeMinTime: 100,      // faster than this (ms) is a brush, not a swipe
  swipeMaxTime: 1200,     // slower than this (ms) is a slow drag, not a swipe
  swipeStraightness: 1.8, // sideways travel must be this many times the up/down travel
  tapMinTime: 60,         // a touch shorter than this (ms) is a brush, not a tap
  tapMaxTime: 600,        // a touch longer than this (ms) is a rest, not a tap
  holdTime: 2000,         // long press length (ms)
  holdCorner: 220,        // size of the top-right corner area (px)
  holdMaxMove: 40,        // the finger may wander this far (px) during a long press
  tapMaxMove: 10,         // a tap may wander this far (px)
  cornerTaps: 3,          // this many quick taps in the corner also open edit mode...
  cornerTapTime: 1000,    // ...if they all happen within this time (ms)
};

let activeScreenId = visibleScreens()[0].id;
let isChanging = false; // true while a screen is fading, so swipes can't pile up

// --- Moving between screens -------------------------------------------------

function changeScreen(direction) {
  const list = visibleScreens();
  if (list.length < 2 || isChanging) return;

  const index = list.findIndex((screen) => screen.id === activeScreenId);
  const nextId = list[(index + direction + list.length) % list.length].id;
  const current = document.querySelector(`.screen[data-screen="${activeScreenId}"]`);
  const next = document.querySelector(`.screen[data-screen="${nextId}"]`);

  // Place the next screen on the correct side without animating...
  next.style.transition = "none";
  next.style.setProperty("--off", `${direction * 4}%`);
  next.getBoundingClientRect();
  next.style.transition = "";

  // ...then let both drift softly
  current.style.setProperty("--off", `${direction * -4}%`);
  current.classList.remove("is-active");
  next.classList.add("is-active");

  const left = list[index];
  activeScreenId = nextId;
  isChanging = true;
  ambientWake();
  setTimeout(() => {
    isChanging = false;
    if (left.onLeave) left.onLeave();
  }, 900);
}

function onEditClosed() {
  resetPick(); // the drinks or season may have changed
  // A screen may have just been switched off in the settings
  if (!visibleScreens().some((screen) => screen.id === activeScreenId)) {
    activeScreenId = visibleScreens()[0].id;
  }
  renderStage(activeScreenId);
}

// --- Touches ----------------------------------------------------------------
// A gesture only counts if it's one finger, away from the edges, and clearly
// deliberate. A second finger at any moment cancels it until all are lifted,
// because picking up or positioning the iPad nearly always uses several.

const fingers = new Set();
let gesture = null;
let holdTimer = null;
let cornerTapTimes = [];  // when the recent taps in the corner happened

function stopGesture() {
  clearTimeout(holdTimer);
  gesture = null;
}

function startsAtEdge(x, y) {
  const edge = GESTURES.edgeGuard;
  return x < edge || y < edge || x > innerWidth - edge || y > innerHeight - edge;
}

function inHoldCorner(x, y) {
  return x > innerWidth - GESTURES.holdCorner && y < GESTURES.holdCorner;
}

window.addEventListener("pointerdown", (event) => {
  if (event.isPrimary) fingers.clear(); // a fresh touch: forget any lost finger
  fingers.add(event.pointerId);
  stopGesture();

  const isOneFinger = fingers.size === 1;
  if (!editPanel.hidden || !isOneFinger || startsAtEdge(event.clientX, event.clientY)) return;
  if (event.target.closest("#text-bar")) return;

  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };

  if (!textMode && inHoldCorner(event.clientX, event.clientY)) {
    // Way two: a few quick taps in the corner
    const now = performance.now();
    cornerTapTimes = cornerTapTimes.filter((time) => now - time < GESTURES.cornerTapTime);
    cornerTapTimes.push(now);
    if (cornerTapTimes.length >= GESTURES.cornerTaps) { openEditHere(); return; }

    // Way one: a long press
    holdTimer = setTimeout(openEditHere, GESTURES.holdTime);
  }
});

function openEditHere() {
  stopGesture();
  cornerTapTimes = [];
  setTextMode(true); // defined in edit.js
}

// Tells the iPad that touches on the posters are ours, so its own long-press
// handling can't interrupt them. The edit panel is not affected.
document.getElementById("stage").addEventListener("touchstart", (event) => {
  if (!textMode) event.preventDefault(); // while editing, taps must reach the text
}, { passive: false });

// If the iPad still interrupts a touch, this is how we learn the finger lifted
window.addEventListener("touchend", (event) => {
  if (event.touches.length === 0) clearTimeout(holdTimer);
});

window.addEventListener("pointermove", (event) => {
  if (!gesture || event.pointerId !== gesture.id) return;
  const moved = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
  if (moved > GESTURES.holdMaxMove) clearTimeout(holdTimer);
});

window.addEventListener("pointerup", (event) => {
  fingers.delete(event.pointerId);
  if (!gesture || event.pointerId !== gesture.id) return;

  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  const duration = performance.now() - gesture.time;
  const startedInCorner = inHoldCorner(gesture.x, gesture.y);
  stopGesture();

  const farEnough = Math.abs(dx) >= Math.max(GESTURES.swipeMinDistance, innerWidth * GESTURES.swipeMinShare);
  const rightSpeed = duration >= GESTURES.swipeMinTime && duration <= GESTURES.swipeMaxTime;
  const straight = Math.abs(dx) >= Math.abs(dy) * GESTURES.swipeStraightness;

  if (farEnough && rightSpeed && straight) { changeScreen(dx < 0 ? 1 : -1); return; }

  // A tap: only for screens that use one, such as the sign
  // The corner is kept for opening edit mode, so taps there do nothing else.
  const stayedStill = Math.hypot(dx, dy) <= GESTURES.tapMaxMove;
  const tapSpeed = duration >= GESTURES.tapMinTime && duration <= GESTURES.tapMaxTime;
  const screen = SCREENS.find((item) => item.id === activeScreenId);
  if (stayedStill && tapSpeed && !isChanging && !startedInCorner && !textMode && screen.onTap) screen.onTap();
});

// The iPad interrupted the touch. The long press keeps counting until the
// finger really lifts (see "touchend" above).
window.addEventListener("pointercancel", (event) => {
  fingers.delete(event.pointerId);
  gesture = null;
});

// No long-press pop-up menus anywhere in show mode
window.addEventListener("contextmenu", (event) => {
  if (editPanel.hidden) event.preventDefault();
});

// --- Keeping the screen awake -----------------------------------------------
// Not every iPad allows this, so "Auto-Lock: Never" is still the safe choice.

let wakeLock = null;

async function keepAwake() {
  if (wakeLock || !navigator.wakeLock || document.hidden) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch (error) {
    wakeLock = null; // not allowed right now, the next touch tries again
  }
}
window.addEventListener("pointerdown", keepAwake);

// --- Offline support --------------------------------------------------------

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch((error) => {
    console.warn("Offline support is not available.", error);
  });
}

// --- Start ------------------------------------------------------------------

renderStage(activeScreenId);

// Measure again once the fonts are in, and whenever the iPad rotates
if (document.fonts) document.fonts.ready.then(fitPosters);
window.addEventListener("resize", fitPosters);

// With "auto" season, catch a new month when the app comes back from sleep
document.addEventListener("visibilitychange", () => {
  stopGesture();
  fingers.clear();
  if (!document.hidden && editPanel.hidden && !textMode) { renderStage(activeScreenId); keepAwake(); }
});
