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

// Marks a piece of text as tappable while editing on the screen (see edit.js)
function editable(path) {
  return `data-edit="${attr(path)}"`;
}

function decor() {
  return `<div class="decor">${DECOR[currentSeason()]}</div>`;
}

// --- The list of screens. New screens get added here in later steps. --------

const SCREENS = [
  { id: "menu",  label: "menu board", editTab: "drinks", render: renderMenu },
  { id: "shop",  label: "drink showcase", editTab: "drinks", render: renderShop, onTap: tapShop, onLeave: resetShop },
  { id: "order", label: "order card", editTab: "order",  render: renderOrder },
  { id: "pay",   label: "pay with kisses", editTab: "order", render: renderPay, onTap: tapPay, onLeave: resetPay },
  { id: "pour",  label: "pour it yourself", editTab: "cafe", render: renderPour, onTap: tapPour, onHold: startPour, onLeave: resetPour },
  { id: "ready", label: "order is ready", editTab: "order", render: renderReady, onTap: tapReady, onLeave: resetReady },
  { id: "pick",  label: "drink of the day", editTab: "drinks", render: renderPick, onTap: tapPick, onLeave: resetPick },
  { id: "note",  label: "note in the cup", editTab: "cafe", render: renderNote, onTap: tapNote, onLeave: resetNote },
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
        <span class="menu-name" ${editable(`drink:${drink.id}:name`)}>${pretty(drink.name)}</span>
        <span class="menu-dots"></span>
        <span class="menu-price hand" ${editable(`drink:${drink.id}:price`)}>${pretty(drink.price)}</span>
      </div>
      <p class="menu-desc" ${editable(`drink:${drink.id}:description`)}>${pretty(drink.description) || "&nbsp;"}</p>
    </li>`).join("");

  return `
    <div class="sheet">
      <div class="fit-area">
        <div class="menu fit-content">
          <header class="menu-head">
            <h1 class="title" ${editable("cafeName")}>${pretty(state.cafeName)}</h1>
            <p class="hand" ${editable("subtitle")}>${pretty(state.subtitle)}</p>
            ${decor()}
          </header>
          ${rows ? `<ul class="menu-list">${rows}</ul>`
                 : `<p class="menu-list menu-empty hand" ${editable("labels.empty")}>${pretty(state.labels.empty)}</p>`}
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
            <span class="ticket-cafe" ${editable("cafeName")}>${pretty(state.cafeName)}</span>
            ${decor()}
          </div>
          <div class="ticket-meta">
            <p class="ticket-label hand" ${editable("labels.order")}>${pretty(state.labels.order)}</p>
            <p class="ticket-no title"><span ${editable("labels.number")}>${pretty(state.labels.number)}</span> <bdi ${editable("order.number")}>${number}</bdi></p>
          </div>
          <hr class="ticket-line">
          <h2 class="ticket-drink title" ${editable("order.drink")} ${fitAttrs(order.drink, 4.2, 3)}></h2>
          ${order.username ? `<p class="ticket-for hand" ${editable("order.username")} ${fitAttrs("for @" + order.username, 2.1)}></p>` : ""}
          ${order.note ? `<p class="ticket-note hand" ${editable("order.note")}>${pretty(order.note)}</p>` : ""}
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
    <p class="pick-label hand" ${editable("labels.today")}>${pretty(state.labels.today)}</p>
    <h2 class="pick-name title" ${editable(`drink:${pickWinner.id}:name`)} ${fitAttrs(pickWinner.name, 5.4, 3.6)}></h2>
    ${pickWinner.description ? `<p class="pick-desc" ${editable(`drink:${pickWinner.id}:description`)}>${pretty(pickWinner.description)}</p>` : ""}
    <p class="pick-price hand" ${editable(`drink:${pickWinner.id}:price`)}>${pretty(pickWinner.price)}</p>`;
}

function renderPick() {
  if (pickPhase === "spinning") { clearTimeout(pickTimer); pickPhase = "idle"; }
  return `
    <div class="coaster"></div>
    <div class="pick" data-phase="${pickPhase}">
      <div class="pick-layer pick-idle fit-area"><div class="fit-content">
        <h2 class="pick-idle-title title" ${editable("labels.pick")}>${pretty(state.labels.pick)}</h2>
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

function signFace(side, title, note, titlePath, notePath) {
  return `
    <div class="sign-face sign-${side}"><div class="sign-inner fit-area"><div class="fit-content">
      <h2 class="sign-title title" ${editable(titlePath)} ${fitAttrs(title, 7.5, 4.6)}></h2>
      ${note ? `<p class="sign-note hand" ${editable(notePath)}>${pretty(note)}</p>` : ""}
    </div></div></div>`;
}

function renderSign() {
  return `
    <div class="sign ${state.signIsOpen ? "" : "is-closed"}">
      <svg class="sign-string" viewBox="0 0 100 40" fill="none" stroke="var(--hand)" stroke-width=".7" stroke-linecap="round"><path d="M12 40 50 5 88 40"/><circle cx="50" cy="4" r="2" fill="var(--hand)" stroke="none"/></svg>
      <div class="sign-card">
        ${signFace("front", state.signOpen, state.signOpenNote, "signOpen", "signOpenNote")}
        ${signFace("back", state.signClosed, state.signClosedNote, "signClosed", "signClosedNote")}
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

// --- Shared drawing: a cup on a saucer ---------------------------------------

function cupArt(color) {
  return `<svg class="cup-art" viewBox="0 0 120 104" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="56" cy="94" rx="50" ry="8" fill="var(--card)" stroke="var(--hand)" stroke-width="1.6"/>
    <path d="M92 40h6c11 0 16 7 16 15s-7 15-18 15h-9" stroke="var(--hand)" stroke-width="5"/>
    <path d="M18 28h76c0 32-5 62-38 62S18 60 18 28z" fill="var(--page)" stroke="var(--hand)" stroke-width="1.6"/>
    <ellipse cx="56" cy="28" rx="38" ry="9" fill="${color}" stroke="var(--hand)" stroke-width="1.6"/>
  </svg>`;
}

const CUP_COLORS = {
  coffee: "var(--caramel)", matcha: "var(--matcha)", tea: "var(--s1)",
  chocolate: "var(--mocha)", other: "var(--foam)",
};

function setPhase(selector, phase) {
  const element = document.querySelector(selector);
  if (element) element.dataset.phase = phase;
}

// --- 5. Drink showcase ------------------------------------------------------
// Swiping changes screens, so the arrows are tapped. "order" fills in the
// order card with a new number and moves on to it.

let shopIndex = 0;
let shopIsBusy = false;

function shopCardHtml() {
  const drinks = pickableDrinks();
  if (!drinks.length) return `<p class="hand shop-empty" ${editable("labels.empty")}>${pretty(state.labels.empty)}</p>`;
  const drink = drinks[shopIndex % drinks.length];
  return `
    <div class="shop-cup">${cupArt(CUP_COLORS[drink.category] || CUP_COLORS.other)}</div>
    <h2 class="shop-name title" ${editable(`drink:${drink.id}:name`)} ${fitAttrs(drink.name, 3.8, 2.8)}></h2>
    ${drink.description ? `<p class="shop-desc" ${editable(`drink:${drink.id}:description`)}>${pretty(drink.description)}</p>` : ""}
    <p class="shop-price hand" ${editable(`drink:${drink.id}:price`)}>${pretty(drink.price)}</p>
    <div class="shop-btn" ${editable("labels.shopButton")}>${pretty(state.labels.shopButton)}</div>`;
}

const ARROW = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;

function renderShop() {
  return `
    <div class="shop-arrow shop-prev">${ARROW("M15 5l-7 7 7 7")}</div>
    <div class="stand shop-stand fit-area"><div class="fit-content shop"><div class="shop-card">${shopCardHtml()}</div></div></div>
    <div class="shop-arrow shop-next">${ARROW("M9 5l7 7-7 7")}</div>`;
}

function moveShop(direction) {
  const count = pickableDrinks().length;
  if (!count) return;
  shopIndex = (shopIndex + direction + count) % count;
  const card = document.querySelector(".shop-card");
  card.innerHTML = shopCardHtml();
  card.style.animation = "none";
  card.getBoundingClientRect();
  card.style.animation = "";
  fitPosters();
}

function orderFromShop(button) {
  const drinks = pickableDrinks();
  if (!drinks.length) return;
  const drink = drinks[shopIndex % drinks.length];
  state.order = {
    number: Math.min(state.order.number + 1, 99999),
    drink: drink.name,
    username: state.order.username,
    note: "",
  };
  saveState();
  button.innerHTML = pretty(state.labels.shopAdded);
  button.classList.add("is-done");
  shopIsBusy = true;
  setTimeout(() => {
    shopIsBusy = false;
    if (activeScreenId !== "shop" || textMode) { renderStage(activeScreenId); return; }
    renderStage(activeScreenId); // puts the new order on the order card
    if (visibleScreens().some((screen) => screen.id === "order")) changeScreen(1, "order");
  }, 1200);
}

function tapShop(event) {
  if (shopIsBusy) return;
  const target = event.target;
  const button = target.closest(".shop-btn");
  if (button) orderFromShop(button);
  else if (target.closest(".shop-prev")) moveShop(-1);
  else if (target.closest(".shop-next")) moveShop(1);
}

function resetShop() {
  shopIsBusy = false;
}

// --- 6. Paying with kisses --------------------------------------------------
// Uses the drink on the order card. One tap per kiss: 4 kisses take 4 taps,
// and only then the payment goes through.

const PAY_MAX_KISSES = 12;   // a very big price still fits on the screen

let payPhase = "idle";       // idle, working or paid
let payTaps = 0;
let payTimer = null;

function orderPrice() {
  const drink = state.drinks.find((item) => item.name === state.order.drink);
  return drink ? drink.price : "";
}

function kissesToPay() {
  const found = orderPrice().match(/\d+/);
  return Math.min(PAY_MAX_KISSES, Math.max(1, found ? Number(found[0]) : 1));
}

function drawKisses() {
  document.querySelectorAll(".pay-kisses span").forEach((kiss, index) => {
    kiss.classList.toggle("is-on", index < payTaps);
  });
}

function renderPay() {
  const kisses = Array.from({ length: kissesToPay() }, (_, index) =>
    `<span class="${index < payTaps ? "is-on" : ""}">${HEART}</span>`).join("");
  return `
    <div class="stand fit-area"><div class="fit-content">
      <div class="pay" data-phase="${payPhase}">
        <p class="pay-drink" ${editable("order.drink")}>${pretty(state.order.drink)}</p>
        <p class="pay-price title">${pretty(orderPrice())}</p>
        <div class="pay-kisses">${kisses}</div>
        <div class="pay-pad">
          <span class="pay-state pay-idle hand" ${editable("labels.pay")}>${pretty(state.labels.pay)}</span>
          <span class="pay-state pay-working"><i></i><i></i><i></i></span>
          <span class="pay-state pay-paid">${HEART}<b class="hand" ${editable("labels.paid")}>${pretty(state.labels.paid)}</b></span>
        </div>
      </div>
    </div></div>`;
}

function tapPay() {
  if (payPhase === "working") return;
  if (payPhase === "paid") { resetPay(); return; }
  payTaps++;
  drawKisses();
  if (payTaps < kissesToPay()) return;
  payPhase = "working";
  setPhase(".pay", payPhase);
  payTimer = setTimeout(() => { payPhase = "paid"; setPhase(".pay", payPhase); }, 2000);
}

function resetPay() {
  clearTimeout(payTimer);
  payPhase = "idle";
  payTaps = 0;
  setPhase(".pay", payPhase);
  drawKisses();
}

// --- 7. Pour it yourself ----------------------------------------------------
// Coffee flows while a finger is held anywhere, and stops when it lifts.
// What pours depends on the drink on the order card: see pourRecipeFor below.
// It's drawn on one small canvas, and only while something is moving.

const POUR_TIME = 6500;       // how long the liquid takes to fill the cup (ms)
const SPRINKLE_SHARE = 0.16;  // how long each topping takes, compared with the liquid

const POUR_COLORS = {
  espresso: "#3A2921", milk: "#FBF7F0", matcha: "#8E9B6A", chocolate: "#4F3327",
  chai: "#B98A5E", tea: "#C58A3D", sakura: "#E8BDB5", other: "#C08A5B",
};

// Flavours poured first, as a thin layer. The first match wins.
const POUR_SYRUPS = [
  [/vanilla/, "#E6C98F"], [/caramel/, "#C08A5B"], [/maple/, "#B5712F"],
  [/lavender/, "#B8A9C9"], [/pumpkin/, "#C9733E"], [/ginger/, "#A5682F"],
  [/mint/, "#A9C7B5"], [/strawberry/, "#D9808A"], [/peach/, "#F0B48E"], [/hazelnut/, "#A67C52"],
];

// Toppings shaken over the top. Every match is used.
const POUR_TOPPINGS = [
  [/cinnamon|pumpkin|gingerbread|chai/, "#8E4A2F"],  // cinnamon
  [/sugar/, "#EAD9B8"],                                         // sugar
  [/mocha|chocolate/, "#4F3327"],                               // cocoa
];

// Turns a drink's name and note into a list of steps.
// To teach it a new drink, add a line in the same style.
function pourRecipeFor(order) {
  const words = `${order.drink} ${order.note}`.toLowerCase().replace(/\bno\s+\w+/g, " "); // "no sugar" means none
  const known = state.drinks.find((drink) => drink.name === order.drink);
  const category = known ? known.category : "";
  const { espresso, milk, matcha, chocolate, chai, tea, sakura, other } = POUR_COLORS;

  let base;
  if (/matcha/.test(words) || category === "matcha") base = [[matcha, 1]];
  else if (/mocha/.test(words)) base = [[espresso, .3], [chocolate, .7]];
  else if (/chocolate/.test(words) || category === "chocolate") base = [[chocolate, 1]];
  else if (/chai/.test(words)) base = [[chai, 1]];
  else if (/sakura/.test(words)) base = [[sakura, 1]];
  else if (/\btea\b|earl grey/.test(words) || category === "tea") base = [[tea, 1]];
  else if (/cappuccino/.test(words)) base = [[espresso, .3], [milk, .7]];
  else if (/flat white/.test(words)) base = [[espresso, .4], [milk, .6]];
  else if (/latte/.test(words)) base = [[milk, .7], [espresso, .3]];
  else if (/americano|espresso/.test(words)) base = [[espresso, 1]];
  else if (category === "coffee" || !category) base = [[espresso, .35], [milk, .65]];
  else base = [[other, 1]];

  const syrup = POUR_SYRUPS.find(([pattern]) => pattern.test(words));
  const syrupAmount = syrup ? .16 : 0;
  const steps = [];
  if (syrup) steps.push({ color: syrup[1], amount: syrupAmount, width: 5 });
  base.forEach(([color, amount]) => steps.push({ color, amount: amount * (1 - syrupAmount), width: 11 }));
  POUR_TOPPINGS.forEach(([pattern, color]) => {
    if (pattern.test(words)) steps.push({ color, sprinkle: true, amount: SPRINKLE_SHARE });
  });
  return steps;
}

let pourLevel = 0;            // how far along: 0 is the start, 100 is finished
let pourIsOn = false;
let pourIsLooping = false;
let pourLastTime = 0;
let pourSteps = [];
let pourFalling = [];         // toppings in the air
let pourSpecks = [];          // toppings that have landed

function pourPhase() {
  if (pourLevel >= 100) return "full";
  if (pourIsOn) return "pouring";
  return pourLevel > 0 ? "paused" : "empty";
}

function renderPour() {
  if (pourLevel === 0) pourSteps = pourRecipeFor(state.order);
  return `
    <div class="pour" data-phase="${pourPhase()}">
      <canvas class="pour-canvas"></canvas>
      <p class="pour-hint pour-hint-start hand" ${editable("labels.pour")}>${pretty(state.labels.pour)}</p>
      <p class="pour-hint pour-hint-full hand" ${editable("labels.full")}>${pretty(state.labels.full)}</p>
    </div>`;
}

// Where the timeline is: the liquid so far, and the step happening now
function pourProgress() {
  const total = pourSteps.reduce((sum, step) => sum + step.amount, 0);
  let time = pourLevel / 100 * total;
  let current = null;
  const layers = [];
  for (const step of pourSteps) {
    const done = Math.min(step.amount, Math.max(0, time));
    if (!current && time < step.amount) current = step;
    if (!step.sprinkle && done > 0) layers.push({ color: step.color, amount: done });
    time -= step.amount;
  }
  return { layers, current };
}

function cupOutline(ctx) {
  ctx.beginPath();
  ctx.moveTo(-112, 0);
  ctx.lineTo(112, 0);
  ctx.bezierCurveTo(112, 130, 76, 200, 0, 200);
  ctx.bezierCurveTo(-76, 200, -112, 130, -112, 0);
  ctx.closePath();
}

function drawPour() {
  const canvas = document.querySelector(".pour-canvas");
  if (!canvas || !canvas.clientWidth) return;

  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.round(canvas.clientWidth * scale);
  const height = Math.round(canvas.clientHeight * scale);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }

  const pour = canvas.parentElement;
  if (pour.dataset.phase !== pourPhase()) pour.dataset.phase = pourPhase();

  const ctx = canvas.getContext("2d");
  const colors = getComputedStyle(pour);
  const line = colors.getPropertyValue("--hand");
  const inside = colors.getPropertyValue("--card");
  const unit = width / 400;
  const originY = height * 0.55 / unit - 100; // the cup's rim, in cup units

  ctx.setTransform(unit, 0, 0, unit, width / 2 - 14 * unit, originY * unit);
  ctx.clearRect(-300, -originY, 700, height / unit);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Saucer and handle sit behind the cup
  ctx.beginPath();
  ctx.ellipse(0, 202, 160, 17, 0, 0, Math.PI * 2);
  ctx.fillStyle = inside; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = line; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, 38);
  ctx.bezierCurveTo(190, 18, 190, 132, 80, 130);
  ctx.lineWidth = 15; ctx.stroke();

  // The cup and what's in it
  cupOutline(ctx);
  ctx.fillStyle = inside; ctx.fill();

  const { layers, current } = pourProgress();
  const poured = layers.reduce((sum, layer) => sum + layer.amount, 0);
  const liquidTotal = pourSteps.filter((step) => !step.sprinkle).reduce((sum, step) => sum + step.amount, 0);
  const surfaceY = 200 - (liquidTotal ? poured / liquidTotal : 0) * 176;

  ctx.save();
  cupOutline(ctx);
  ctx.clip();
  if (poured > 0) {
    // Layers melt softly into each other
    const paint = ctx.createLinearGradient(0, 200, 0, surfaceY);
    let from = 0;
    let last = 0;
    const stop = (position, color) => { last = Math.max(last, Math.min(1, position)); paint.addColorStop(last, color); };
    layers.forEach((layer, index) => {
      const to = from + layer.amount / poured;
      stop(index === 0 ? 0 : from + .03, layer.color);
      stop(index === layers.length - 1 ? 1 : to - .03, layer.color);
      from = to;
    });
    ctx.fillStyle = paint;
    ctx.fillRect(-120, surfaceY, 240, 200 - surfaceY);
  }
  pourSpecks.forEach((speck) => {
    ctx.fillStyle = speck.color;
    ctx.fillRect(speck.x, surfaceY - 1 + speck.y, 3.4, 3.4);
  });
  ctx.restore();

  cupOutline(ctx);
  ctx.lineWidth = 3.5; ctx.strokeStyle = line; ctx.stroke();

  // What's falling
  if (pourIsOn && current && !current.sprinkle) {
    ctx.fillStyle = current.color;
    ctx.fillRect(-current.width / 2, -originY, current.width, originY + surfaceY);
  }
  pourFalling.forEach((grain) => {
    ctx.fillStyle = grain.color;
    ctx.fillRect(grain.x, grain.y, 3.4, 3.4);
  });
  pourSurfaceY = surfaceY;
}

let pourSurfaceY = 200;

function stepPour(now) {
  const elapsed = Math.min(50, now - pourLastTime);
  pourLastTime = now;

  if (pourIsOn) {
    const total = pourSteps.reduce((sum, step) => sum + step.amount, 0);
    pourLevel = Math.min(100, pourLevel + elapsed / (POUR_TIME * total) * 100);
    const { current } = pourProgress();
    if (current && current.sprinkle) {
      for (let i = 0; i < 2; i++) {
        pourFalling.push({ x: (Math.random() - .5) * 150, y: -60 - Math.random() * 40, speed: .22 + Math.random() * .12, color: current.color });
      }
    }
    if (pourLevel >= 100) pourIsOn = false;
  }

  pourFalling = pourFalling.filter((grain) => {
    grain.y += grain.speed * elapsed;
    if (grain.y < pourSurfaceY) return true;
    if (pourSpecks.length < 180) pourSpecks.push({ x: grain.x, y: Math.random() * 5, color: grain.color });
    return false;
  });

  drawPour();
  if (pourIsOn || pourFalling.length) requestAnimationFrame(stepPour);
  else pourIsLooping = false;
}

function runPourLoop() {
  if (pourIsLooping) return;
  pourIsLooping = true;
  pourLastTime = performance.now();
  requestAnimationFrame(stepPour);
}

function startPour() {
  if (pourIsOn || pourLevel >= 100) return;
  pourIsOn = true;
  runPourLoop();
}

function stopPour() {
  if (!pourIsOn) return;
  pourIsOn = false;
  drawPour();
}

// A tap on a finished cup empties it, ready for another take
function tapPour() {
  if (pourLevel >= 100) resetPour();
}

function resetPour() {
  pourIsOn = false;
  pourLevel = 0;
  pourFalling = [];
  pourSpecks = [];
  pourSteps = pourRecipeFor(state.order);
  drawPour();
}

// --- 8. Order is ready ------------------------------------------------------
// Tap the counter bell. Tap again and it goes quiet for another take.

let readyIsOn = false;

function renderReady() {
  const number = String(state.order.number).padStart(3, "0");
  return `
    <div class="stand fit-area"><div class="fit-content">
      <div class="ready" data-phase="${readyIsOn ? "on" : "off"}">
        <svg class="bell" viewBox="0 0 120 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M60 8v10" stroke="var(--ink)" stroke-width="5"/><ellipse cx="60" cy="8" rx="10" ry="4" fill="var(--ink)"/>
          <path d="M18 78c0-34 18-60 42-60s42 26 42 60z" fill="var(--caramel)" stroke="var(--hand)" stroke-width="1.6"/>
          <path d="M38 62c1-14 7-25 16-30" stroke="var(--foam)" stroke-width="3.5"/>
          <rect x="8" y="78" width="104" height="14" rx="7" fill="var(--ink)"/>
        </svg>
        <div class="ready-text">
          <p class="ready-number hand"><span ${editable("labels.number")}>${pretty(state.labels.number)}</span> <bdi ${editable("order.number")}>${number}</bdi></p>
          <h2 class="ready-title title" ${editable("labels.ready")}>${pretty(state.labels.ready)}</h2>
        </div>
      </div>
    </div></div>`;
}

function tapReady() {
  readyIsOn = !readyIsOn;
  setPhase(".ready", readyIsOn ? "on" : "off");
}

function resetReady() {
  readyIsOn = false;
  setPhase(".ready", "off");
}

// --- 9. A note in the cup ---------------------------------------------------
// Tap: a note rises out of the cup. Tap again: it slips back in.

let noteIndex = -1;          // which note is out; -1 means none

function noteHtml() {
  if (noteIndex < 0) return "";
  return `<p class="note-text hand" ${editable(`notes.${noteIndex}`)}>${pretty(state.notes[noteIndex] || "")}</p>`;
}

function renderNote() {
  return `
    <div class="note" data-phase="${noteIndex < 0 ? "in" : "out"}">
      <div class="note-paper fit-area"><div class="fit-content">${noteHtml()}</div></div>
      <div class="note-cup">${cupArt("var(--mocha)")}</div>
    </div>`;
}

function tapNote() {
  if (noteIndex >= 0) { resetNote(); return; }
  const usable = state.notes.map((note, index) => (note.trim() ? index : -1)).filter((index) => index >= 0);
  if (!usable.length) return;
  const others = usable.filter((index) => index !== noteLastIndex);
  const pool = others.length ? others : usable;
  noteIndex = pool[Math.floor(Math.random() * pool.length)];
  noteLastIndex = noteIndex;
  document.querySelector(".note-paper .fit-content").innerHTML = noteHtml();
  fitPosters();
  setPhase(".note", "out");
}

let noteLastIndex = -1;      // so the same note doesn't come up twice in a row

function resetNote() {
  noteIndex = -1;
  setPhase(".note", "in");
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
  drawPour(); // the cup needs redrawing when the screen is resized
}

function renderStage(activeId) {
  applyTheme();
  document.getElementById("stage").innerHTML = visibleScreens().map((screen) => `
    <section class="screen screen-${screen.id} ${screen.id === activeId ? "is-active" : ""}"
             data-screen="${screen.id}">${screen.render()}</section>`).join("");
  fitPosters();
  ambientWake();
}
