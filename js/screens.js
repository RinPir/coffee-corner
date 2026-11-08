/* ==========================================================================
   screens.js: builds each full-screen poster from your content.
   ========================================================================== */

// --- Small helpers ---------------------------------------------------------

// Makes typed text safe to place in the page
function esc(value) {
  const holder = document.createElement("div");
  holder.textContent = value;
  return holder.innerHTML;
}

// The handwritten font has no heart symbol, and the iPad would borrow one
// from a third font. So any typed heart is swapped for this little drawing.
const HEART = `<svg class="heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5C8 17.6 2.9 13.8 3.1 8.6 3.3 5.2 7.6 3.5 10.1 6c.9.9 1.6 1.9 2 2.8.6-1.2 1.4-2.3 2.5-3.1 2.8-1.9 6.5-.2 6.4 3.3-.2 4.6-5 8.5-9 11.5z"/></svg>`;
function pretty(value) {
  return esc(value).replace(/[♡♥❤]️?/g, HEART);
}

// Which season is showing right now
function currentSeason() {
  if (state.season !== "auto") return state.season;
  const month = new Date().getMonth(); // 0 = January
  if (month >= 8 && month <= 10) return "autumn";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  return "winter";
}

function drinksInSeason() {
  const season = currentSeason();
  return state.drinks.filter((drink) =>
    drink.seasons.includes("all") || drink.seasons.includes(season));
}

// --- Small seasonal drawings (they use the season's colors from theme.css) --

const DECOR = {
  autumn: `<svg viewBox="0 0 96 52"><path d="M14 44C36 42 58 32 84 10" fill="none" stroke="var(--s2)" stroke-width="1.6" stroke-linecap="round"/><path d="M40 38C33 24 42 11 58 6c5 14-2 28-18 32z" fill="var(--s1)"/><path d="M26 42C14 40 7 31 7 20c13 1 23 9 19 22z" fill="var(--s3)"/><path d="M62 26c1-11 11-18 25-16-1 12-11 20-25 16z" fill="var(--s3)"/></svg>`,
  winter: `<svg viewBox="0 0 96 52"><path d="M10 38C34 30 60 24 88 22" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"/><g fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"><path d="M24 33l-6-12M24 33l10 8M36 29l-5-13M36 29l11 8M48 26l-3-13M48 26l11 8M60 24l-2-12M60 24l11 7M72 23l0-11M72 23l10 6"/></g><circle cx="20" cy="43" r="4" fill="var(--s2)"/><circle cx="29" cy="46" r="3.4" fill="var(--s2)"/></svg>`,
  spring: `<svg viewBox="0 0 96 52"><g fill="var(--s1)"><circle cx="40" cy="14" r="8"/><circle cx="52" cy="23" r="8"/><circle cx="47" cy="37" r="8"/><circle cx="33" cy="37" r="8"/><circle cx="28" cy="23" r="8"/></g><circle cx="40" cy="27" r="5" fill="var(--s3)"/><g fill="var(--s2)"><circle cx="74" cy="20" r="3.6"/><circle cx="81" cy="27" r="3.6"/><circle cx="72" cy="31" r="3.6"/></g></svg>`,
  summer: `<svg viewBox="0 0 96 52"><circle cx="42" cy="26" r="22" fill="var(--s2)"/><circle cx="42" cy="26" r="17" fill="none" stroke="var(--oat-milk)" stroke-width="1.5"/><path d="M42 9v34M25 26h34M30 14l24 24M54 14 30 38" stroke="var(--oat-milk)" stroke-width="1.5"/><circle cx="78" cy="17" r="7" fill="var(--s1)"/><circle cx="82" cy="36" r="4" fill="var(--s3)"/></svg>`,
};

function decor() {
  return `<div class="decor">${DECOR[currentSeason()]}</div>`;
}

// --- The list of screens. New screens get added here in later steps. --------

const SCREENS = [
  { id: "menu",  label: "menu board", editTab: "drinks", render: renderMenu },
  { id: "order", label: "order card", editTab: "order",  render: renderOrder },
  { id: "pick",  label: "drink of the day", editTab: "drinks", render: renderPick, onTap: tapPick, onLeave: resetPick },
  { id: "sign",  label: "open / closed sign", editTab: "cafe", render: renderSign, onTap: tapSign },
  { id: "ambient", label: "ambient scene", editTab: "cafe", render: renderAmbient },
];

// --- 1. Menu board ----------------------------------------------------------

function renderMenu() {
  const drinks = drinksInSeason()
    .filter((drink) => drink.onBoard)
    .slice(0, MAX_ON_BOARD);

  const rows = drinks.map((drink) => `
    <li>
      <div class="menu-row">
        <span class="menu-name">${pretty(drink.name)}</span>
        <span class="menu-dots"></span>
        <span class="menu-price hand">${pretty(drink.price)}</span>
      </div>
      <p class="menu-desc">${pretty(drink.description) || "&nbsp;"}</p>
    </li>`).join("");

  return `
    <div class="sheet">
      <div class="fit-area">
        <div class="menu fit-content">
          <header class="menu-head">
            <h1 class="title">${pretty(state.cafeName)}</h1>
            <p class="hand">${pretty(state.subtitle)}</p>
            ${decor()}
          </header>
          ${rows ? `<ul class="menu-list">${rows}</ul>`
                 : `<p class="menu-list menu-empty hand">back soon</p>`}
        </div>
      </div>
    </div>`;
}

// --- 2. Order card ----------------------------------------------------------

function renderOrder() {
  const order = state.order;
  const number = String(order.number).padStart(3, "0");

  return `
    <div class="fit-area">
      <div class="ticket-wrap fit-content">
        <div class="ticket">
          <div class="ticket-head">
            <span class="ticket-cafe">${pretty(state.cafeName)}</span>
            ${decor()}
          </div>
          <div class="ticket-meta">
            <p class="ticket-label hand">today's order</p>
            <p class="ticket-no title"><span>no.</span> ${number}</p>
          </div>
          <hr class="ticket-line">
          <h2 class="ticket-drink title" ${fitAttrs(order.drink, 4.2, 3)}></h2>
          ${order.username ? `<p class="ticket-for hand" ${fitAttrs("for @" + order.username, 2.1)}></p>` : ""}
          ${order.note ? `<p class="ticket-note hand">${pretty(order.note)}</p>` : ""}
        </div>
      </div>
    </div>`;
}

// --- 3. Drink of the day ----------------------------------------------------
// Tap: the names drift slowly and settle. Then the winner fades up large.
// Tap again to go back to the starting picture, ready for another take.

const REEL_LENGTH = 11;      // how many names drift past
const REEL_TIME = 7000;      // how long the drift lasts (ms), matches css/screens.css

let pickPhase = "idle";      // idle, spinning or result
let pickWinner = null;
let pickLastName = "";       // so the same drink doesn't come up twice in a row
let pickTimer = null;

function pickableDrinks() {
  return drinksInSeason().filter((drink) => drink.name.trim());
}

function pickResultHtml() {
  if (!pickWinner) return "";
  return `
    <p class="pick-label hand">today's drink</p>
    <h2 class="pick-name title" ${fitAttrs(pickWinner.name, 5.4, 3.6)}></h2>
    ${pickWinner.description ? `<p class="pick-desc">${pretty(pickWinner.description)}</p>` : ""}
    <p class="pick-price hand">${pretty(pickWinner.price)}</p>`;
}

function renderPick() {
  if (pickPhase === "spinning") { clearTimeout(pickTimer); pickPhase = "idle"; }
  return `
    <div class="coaster"></div>
    <div class="pick" data-phase="${pickPhase}">
      <div class="pick-layer pick-idle fit-area"><div class="fit-content">
        <h2 class="pick-idle-title title">drink of the day</h2>
      </div></div>
      <div class="pick-reel-window"><div class="pick-reel"></div></div>
      <div class="pick-layer pick-result fit-area"><div class="fit-content">${pickResultHtml()}</div></div>
    </div>`;
}

function setPickPhase(phase) {
  pickPhase = phase;
  const pick = document.querySelector(".pick");
  if (pick) pick.dataset.phase = phase;
}

function tapPick() {
  if (pickPhase === "spinning") return;
  if (pickPhase === "result") { setPickPhase("idle"); return; }

  const drinks = pickableDrinks();
  if (!drinks.length) return;

  // Choose the winner first; the drift is only for show
  const choices = drinks.filter((drink) => drink.name !== pickLastName);
  const pool = choices.length ? choices : drinks;
  pickWinner = pool[Math.floor(Math.random() * pool.length)];
  pickLastName = pickWinner.name;

  // Any shuffled order, taking care the name before the winner is a different one
  const shuffled = [...drinks].sort(() => Math.random() - 0.5);
  const names = [];
  for (let i = 0; i < REEL_LENGTH - 1; i++) names.push(shuffled[i % shuffled.length].name);
  if (drinks.length > 1 && names[names.length - 1] === pickWinner.name) names.reverse();
  names.push(pickWinner.name);

  const reel = document.querySelector(".pick-reel");
  reel.innerHTML = names.map((name) =>
    `<div class="pick-row title"><span ${fitAttrs(name, 1)}></span></div>`).join("");
  reel.querySelectorAll("[data-fit-max]").forEach(fitText);

  const result = document.querySelector(".pick-result");
  result.querySelector(".fit-content").innerHTML = pickResultHtml();
  fitPosters();

  // Start with the first name in the middle, without animating...
  reel.style.transition = "none";
  reel.style.transform = "translateY(var(--row))";
  reel.getBoundingClientRect();

  // ...then drift until the winner is in the middle
  reel.style.transition = "";
  reel.style.transform = `translateY(calc(var(--row) * ${2 - names.length}))`;
  setPickPhase("spinning");
  pickTimer = setTimeout(() => setPickPhase("result"), REEL_TIME + 400);
}

function resetPick() {
  clearTimeout(pickTimer);
  setPickPhase("idle");
}

// --- 4. Open / closed sign --------------------------------------------------

let signIsFlipping = false;

function signFace(side, title, note) {
  return `
    <div class="sign-face sign-${side}"><div class="sign-inner fit-area"><div class="fit-content">
      <h2 class="sign-title title" ${fitAttrs(title, 7.5, 4.6)}></h2>
      ${note ? `<p class="sign-note hand">${pretty(note)}</p>` : ""}
    </div></div></div>`;
}

function renderSign() {
  return `
    <div class="sign ${state.signIsOpen ? "" : "is-closed"}">
      <svg class="sign-string" viewBox="0 0 100 40" fill="none" stroke="var(--hand)" stroke-width=".7" stroke-linecap="round"><path d="M12 40 50 5 88 40"/><circle cx="50" cy="4" r="2" fill="var(--hand)" stroke="none"/></svg>
      <div class="sign-card">
        ${signFace("front", state.signOpen, state.signOpenNote)}
        ${signFace("back", state.signClosed, state.signClosedNote)}
      </div>
    </div>`;
}

function tapSign() {
  if (signIsFlipping) return;
  signIsFlipping = true;
  state.signIsOpen = !state.signIsOpen;
  saveState();
  document.querySelector(".sign").classList.toggle("is-closed", !state.signIsOpen);
  setTimeout(() => { signIsFlipping = false; }, 1200);
}

// --- Drawing ----------------------------------------------------------------

// The screens you've switched on. There is always at least one.
function visibleScreens() {
  const on = SCREENS.filter((screen) => state.screens[screen.id] !== false);
  return on.length ? on : [SCREENS[0]];
}

// Applies season, light/dark and text size to the whole page
function applyTheme() {
  const root = document.documentElement;
  root.dataset.season = currentSeason();
  root.dataset.background = state.background;
  root.style.setProperty("--text-size", state.textSize);
  const color = state.background === "dark" ? "#3A2921" : "#F5EEE4";
  document.querySelector('meta[name="theme-color"]').content = color;
  document.title = state.cafeName || "the little nook";
}

// --- Auto-fitting text ------------------------------------------------------

// Marks an element for fitText. max is the largest size allowed.
// If twoLinesBelow is given and one line would have to get smaller than that,
// the text splits into two balanced lines instead.
function fitAttrs(text, max, twoLinesBelow = 0) {
  return `data-fit-text="${attr(text)}" data-fit-max="${max}" data-fit-two="${twoLinesBelow}"`;
}

function widthOf(element, html) {
  element.innerHTML = html;
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect().width;
}

function fitText(element) {
  const text = element.dataset.fitText.trim();
  const max = Number(element.dataset.fitMax);
  const twoLinesBelow = Number(element.dataset.fitTwo);
  if (!text) { element.innerHTML = "&nbsp;"; return; }

  element.style.whiteSpace = "nowrap";
  element.style.fontSize = max + "em";
  const room = element.clientWidth * 0.995;
  const sizeFor = (width) => max * Math.min(1, room / width);

  const oneLineSize = sizeFor(widthOf(element, pretty(text)));
  const words = text.split(/\s+/);

  if (oneLineSize < twoLinesBelow && words.length > 1) {
    // Try every place to break the line and keep the most balanced one
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const first = pretty(words.slice(0, i).join(" "));
      const second = pretty(words.slice(i).join(" "));
      const widest = Math.max(widthOf(element, first), widthOf(element, second));
      if (!best || widest < best.widest) best = { first, second, widest };
    }
    if (sizeFor(best.widest) > oneLineSize) {
      element.style.fontSize = sizeFor(best.widest) + "em";
      element.innerHTML = `${best.first}<br>${best.second}`;
      return;
    }
  }
  element.style.fontSize = oneLineSize + "em";
  element.innerHTML = pretty(text);
}

// Gently shrinks a poster's content if it would not fit on the screen,
// for example with a big text size and long descriptions
function fitPosters() {
  document.querySelectorAll("#stage .fit-area").forEach((area) => {
    const content = area.querySelector(".fit-content");
    let fit = 1;
    content.style.setProperty("--fit", fit);
    content.querySelectorAll("[data-fit-max]").forEach(fitText);
    while (content.getBoundingClientRect().height > area.clientHeight && fit > 0.4) {
      fit -= 0.03;
      content.style.setProperty("--fit", fit);
    }
  });
}

function renderStage(activeId) {
  applyTheme();
  document.getElementById("stage").innerHTML = visibleScreens().map((screen) => `
    <section class="screen screen-${screen.id} ${screen.id === activeId ? "is-active" : ""}"
             data-screen="${screen.id}">${screen.render()}</section>`).join("");
  fitPosters();
  ambientWake();
}
