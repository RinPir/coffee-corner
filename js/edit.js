/* ==========================================================================
   edit.js: the edit panel. Every change is saved the moment you make it.
   ========================================================================== */

const editPanel = document.getElementById("edit");
const TABS = [
  { id: "order",  label: "order" },
  { id: "drinks", label: "drinks" },
  { id: "cafe",   label: "café" },
  { id: "backup", label: "backup" },
];

let editTab = "order";
let openDrinkId = null;   // the drink currently unfolded in the list
let backupMessage = "";

function openEdit(tab) {
  editTab = tab;
  openDrinkId = null;
  backupMessage = "";
  editPanel.hidden = false;
  drawEdit();
}

function closeEdit() {
  document.activeElement && document.activeElement.blur();
  editPanel.hidden = true;
  onEditClosed(); // defined in app.js: redraws the posters
}

function drawEdit() {
  const scroll = editPanel.scrollTop;
  const views = { order: orderView, drinks: drinksView, cafe: cafeView, backup: backupView };
  editPanel.innerHTML = `
    <div class="e-top"><div class="e-top-inner">
      <div class="e-tabs">${TABS.map((tab) =>
        `<button class="e-tab ${tab.id === editTab ? "on" : ""}" data-tab="${tab.id}">${tab.label}</button>`).join("")}
      </div>
      <button class="e-btn primary" data-action="close">done</button>
    </div></div>
    <div class="e-body">${views[editTab]()}</div>`;
  editPanel.scrollTop = scroll;
}

// Puts typed text safely inside an input's value="..."
function attr(value) {
  return esc(value).replace(/"/g, "&quot;");
}

function field(label, name, value, placeholder = "") {
  return `<label class="e-field"><span>${label}</span>
    <input class="e-input" data-field="${name}" value="${attr(value)}" placeholder="${attr(placeholder)}" autocomplete="off"></label>`;
}

// A row of buttons where exactly one is chosen
function choices(name, options, current) {
  return `<div class="e-chips">${options.map(([value, label]) =>
    `<button class="e-chip ${value === current ? "on" : ""}" data-choice="${name}" data-value="${value}">${label}</button>`).join("")}</div>`;
}

// --- Order tab --------------------------------------------------------------

function orderView() {
  const order = state.order;
  const chips = drinksInSeason().map((drink) =>
    `<button class="e-chip ${drink.name === order.drink ? "on" : ""}" data-pick-drink="${attr(drink.name)}">${esc(drink.name)}</button>`).join("");

  return `
    <div class="e-section">
      <div class="e-row">
        <label class="e-field e-grow"><span>order number</span>
          <input class="e-input" id="order-number" data-field="order.number" type="number" inputmode="numeric" min="1" max="99999" value="${order.number}"></label>
        <button class="e-btn" data-action="reset-counter">reset to 1</button>
      </div>
    </div>
    <div class="e-section">
      ${field("drink", "order.drink", order.drink, "tap one below or type your own")}
      <div class="e-chips">${chips}</div>
      <label class="e-field"><span>for</span>
        <div class="e-at"><i>@</i><input class="e-input" data-field="order.username" value="${attr(order.username)}" autocapitalize="none" autocorrect="off" autocomplete="off"></div></label>
      ${field("note", "order.note", order.note, "extra foam, no sugar")}
    </div>
    <button class="e-btn primary wide" data-action="next-order">next order (no. ${String(order.number + 1).padStart(3, "0")})</button>
    <p class="e-hint">Moves to the next number and clears the drink, name and note.</p>`;
}

// --- Drinks tab -------------------------------------------------------------

function drinksView() {
  const onBoard = drinksInSeason().filter((drink) => drink.onBoard).length;
  const hint = onBoard > MAX_ON_BOARD
    ? `${onBoard} drinks are ticked for ${currentSeason()}. The board shows the first ${MAX_ON_BOARD} in this list.`
    : `On the board for ${currentSeason()}: ${onBoard} of ${MAX_ON_BOARD}.`;

  return `
    <button class="e-btn primary wide" data-action="add-drink">add a drink</button>
    <p class="e-hint">${hint}</p>
    ${state.drinks.map(drinkCard).join("")}`;
}

function drinkCard(drink) {
  const summary = drink.seasons.includes("all") ? "all year" : drink.seasons.join(", ");
  const head = `<button class="e-drink-head" data-toggle-drink="${drink.id}">
      <span>${esc(drink.name) || "new drink"}</span>
      <small>${drink.onBoard ? "on board · " : ""}${summary}</small>
    </button>`;
  if (drink.id !== openDrinkId) return `<div class="e-drink">${head}</div>`;

  const seasonChips = [["all", "all year"], ...SEASONS.map((season) => [season, season])].map(([value, label]) =>
    `<button class="e-chip ${drink.seasons.includes(value) ? "on" : ""}" data-drink-season="${value}">${label}</button>`).join("");

  return `<div class="e-drink" data-drink="${drink.id}">${head}
    <div class="e-drink-form">
      ${field("name", "drink.name", drink.name)}
      ${field("price", "drink.price", drink.price, "3 kisses")}
      ${field("short description (optional)", "drink.description", drink.description)}
      <label class="e-field"><span>category</span>
        <select class="e-select" data-field="drink.category">${CATEGORIES.map((category) =>
          `<option ${category === drink.category ? "selected" : ""}>${category}</option>`).join("")}</select></label>
      <div class="e-field"><span>seasons</span><div class="e-chips">${seasonChips}</div></div>
      <label class="e-switch"><span>show on the menu board</span>
        <input type="checkbox" data-field="drink.onBoard" ${drink.onBoard ? "checked" : ""}></label>
      <button class="e-btn danger" data-action="delete-drink">delete this drink</button>
    </div></div>`;
}

// --- Café tab ---------------------------------------------------------------

function cafeView() {
  const seasonOptions = [["auto", "auto by date"], ...SEASONS.map((season) => [season, season])];
  const onCount = SCREENS.filter((screen) => state.screens[screen.id] !== false).length;

  return `
    <div class="e-section">
      ${field("café name", "cafeName", state.cafeName)}
      ${field("subtitle", "subtitle", state.subtitle)}
    </div>
    <div class="e-section"><h2>small words on the screens</h2>
      ${field("order card title", "labels.order", state.labels.order)}
      ${field("before the order number", "labels.number", state.labels.number)}
      ${field("drink of the day, before the tap", "labels.pick", state.labels.pick)}
      ${field("drink of the day, above the result", "labels.today", state.labels.today)}
      ${field("menu with no drinks", "labels.empty", state.labels.empty)}
    </div>
    <div class="e-section"><h2>open / closed sign</h2>
      ${field("open side", "signOpen", state.signOpen)}
      ${field("small line, open side", "signOpenNote", state.signOpenNote)}
      ${field("closed side", "signClosed", state.signClosed)}
      ${field("small line, closed side", "signClosedNote", state.signClosedNote)}
    </div>
    <div class="e-section"><h2>season</h2>
      ${choices("season", seasonOptions, state.season)}
    </div>
    <div class="e-section"><h2>background</h2>
      ${choices("background", [["light", "light"], ["dark", "dark"]], state.background)}
    </div>
    <div class="e-section"><h2>text size</h2>
      <input class="e-range" type="range" min="0.8" max="1.5" step="0.05" data-field="textSize" value="${state.textSize}">
    </div>
    <div class="e-section"><h2>screens</h2>
      ${SCREENS.map((screen) => {
        const isOn = state.screens[screen.id] !== false;
        return `<label class="e-switch"><span>${screen.label}</span>
          <input type="checkbox" data-screen-toggle="${screen.id}" ${isOn ? "checked" : ""} ${isOn && onCount === 1 ? "disabled" : ""}></label>`;
      }).join("")}
    </div>`;
}

// --- Backup tab -------------------------------------------------------------

function backupView() {
  return `
    <div class="e-section"><h2>save a backup</h2>
      <p class="e-hint">Saves all your drinks and settings in one file. On the iPad, choose "Save to Files".</p>
      <button class="e-btn wide" data-action="export">export backup</button>
    </div>
    <div class="e-section"><h2>restore a backup</h2>
      <p class="e-hint">Replaces everything in the app with the contents of the file.</p>
      <label class="e-btn wide" style="display:flex;align-items:center;justify-content:center">choose backup file
        <input type="file" accept=".json,application/json" data-action="import" hidden></label>
      <p class="e-status">${esc(backupMessage)}</p>
    </div>`;
}

// --- Reacting to taps and typing --------------------------------------------

function save() {
  if (!saveState()) alert("This device could not save your changes.");
}

function currentDrink() {
  return state.drinks.find((drink) => drink.id === openDrinkId);
}

editPanel.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const data = target.dataset;

  if (data.tab) { editTab = data.tab; openDrinkId = null; backupMessage = ""; editPanel.scrollTop = 0; }
  else if (data.choice) {
    state[data.choice] = data.value;
    save();
  }
  else if (data.pickDrink !== undefined) { state.order.drink = data.pickDrink; save(); }
  else if (data.toggleDrink) { openDrinkId = openDrinkId === data.toggleDrink ? null : data.toggleDrink; }
  else if (data.drinkSeason) { toggleDrinkSeason(data.drinkSeason); save(); }
  else if (data.action === "close") { closeEdit(); return; }
  else if (data.action === "next-order") {
    state.order = { number: Math.min(state.order.number + 1, 99999), drink: "", username: "", note: "" };
    save();
  }
  else if (data.action === "reset-counter") { state.order.number = 1; save(); }
  else if (data.action === "add-drink") {
    const drink = { id: makeDrinkId(), name: "", category: "coffee", seasons: ["all"], price: "", description: "", onBoard: true };
    state.drinks.unshift(drink);
    openDrinkId = drink.id;
    editPanel.scrollTop = 0;
    save();
  }
  else if (data.action === "delete-drink") {
    // Two taps, so one stray tap can't lose a drink
    if (target.dataset.armed !== "yes") {
      target.dataset.armed = "yes";
      target.textContent = "tap again to delete";
      return;
    }
    state.drinks = state.drinks.filter((drink) => drink.id !== openDrinkId);
    openDrinkId = null;
    save();
  }
  else if (data.action === "export") {
    backupMessage = await exportBackup();
  }
  else return;

  drawEdit();
});

function toggleDrinkSeason(season) {
  const drink = currentDrink();
  if (season === "all") { drink.seasons = ["all"]; return; }
  const list = drink.seasons.filter((item) => item !== "all");
  drink.seasons = list.includes(season) ? list.filter((item) => item !== season) : [...list, season];
  if (!drink.seasons.length) drink.seasons = ["all"];
}

// Typing doesn't redraw the panel, so the keyboard stays open
editPanel.addEventListener("input", (event) => {
  const input = event.target;
  const name = input.dataset.field;

  if (name === "order.number") {
    const number = Math.floor(Number(input.value));
    if (number >= 1 && number <= 99999) { state.order.number = number; updateNextButton(); }
    else return; // half-typed or empty: wait, see the "change" listener below
  }
  else if (name === "order.username") state.order.username = input.value.replace(/^@+/, "").trim();
  else if (name === "order.drink" || name === "order.note") state.order[name.split(".")[1]] = input.value;
  else if (name === "textSize") state.textSize = Number(input.value);
  else if (name && name.startsWith("labels.")) state.labels[name.split(".")[1]] = input.value;
  else if (["cafeName", "subtitle", "signOpen", "signOpenNote", "signClosed", "signClosedNote"].includes(name)) state[name] = input.value;
  else if (name && name.startsWith("drink.")) {
    const key = name.split(".")[1];
    currentDrink()[key] = key === "onBoard" ? input.checked : input.value;
  }
  else if (input.dataset.screenToggle) {
    state.screens[input.dataset.screenToggle] = input.checked;
    save();
    drawEdit();
    return;
  }
  else return;
  save();
});

function updateNextButton() {
  const button = editPanel.querySelector('[data-action="next-order"]');
  if (button) button.textContent = `next order (no. ${String(state.order.number + 1).padStart(3, "0")})`;
}

editPanel.addEventListener("change", async (event) => {
  const input = event.target;

  // Leaving the number field empty puts the real number back
  if (input.id === "order-number") input.value = state.order.number;

  if (input.dataset.action === "import" && input.files[0]) {
    try {
      await importBackup(input.files[0]);
      backupMessage = "backup restored";
    } catch (error) {
      backupMessage = "That file doesn't look like a coffee corner backup. Nothing was changed.";
    }
    drawEdit();
  }
  // Redraw the card's title once the name is finished
  if (input.dataset.field === "drink.onBoard") drawEdit();
});

// --- Changing text right on the poster --------------------------------------
// The long press lands here first. Every text with data-edit gets a soft outline;
// tap one, type in the bar at the top, and the poster changes as you type.
// Paths look like "cafeName", "labels.pick", "order.note" or "drink:ID:price".

const textBar = document.getElementById("text-bar");
const textInput = document.getElementById("text-input");
const textHint = document.getElementById("text-hint");

let textMode = false;
let textModeSince = 0;    // the finger that opened this mode must not also pick a text
let textPath = null;      // the text being changed right now

function drinkById(id) {
  return state.drinks.find((drink) => drink.id === id);
}

function readText(path) {
  if (path.startsWith("drink:")) {
    const [, id, key] = path.split(":");
    return drinkById(id)[key];
  }
  const [first, second] = path.split(".");
  return String(second ? state[first][second] : state[first]);
}

function writeText(path, value) {
  if (path.startsWith("drink:")) {
    const [, id, key] = path.split(":");
    drinkById(id)[key] = value;
  }
  else if (path === "order.number") {
    const number = Math.floor(Number(value));
    if (number >= 1 && number <= 99999) state.order.number = number;
  }
  else if (path === "order.username") state.order.username = value.replace(/^@+/, "").trim();
  else if (path.includes(".")) {
    const [first, second] = path.split(".");
    state[first][second] = value;
  }
  else state[path] = value;
}

function outlineChosenText() {
  document.querySelectorAll("#stage [data-edit]").forEach((element) => {
    element.classList.toggle("is-chosen", element.dataset.edit === textPath);
  });
}

function chooseText(path) {
  textPath = path;
  textHint.hidden = true;
  textInput.hidden = false;
  textInput.value = readText(path);
  textInput.inputMode = path === "order.number" ? "numeric" : "text";
  textInput.focus(); // has to happen during the tap, or the iPad won't show the keyboard
  outlineChosenText();
}

function setTextMode(isOn) {
  textMode = isOn;
  textModeSince = performance.now();
  textPath = null;
  textInput.blur();
  textInput.hidden = true;
  textHint.hidden = false;
  textBar.hidden = !isOn;
  document.body.classList.toggle("text-mode", isOn);
  renderStage(activeScreenId); // the bar takes some room, so everything is measured again
}

document.getElementById("stage").addEventListener("click", (event) => {
  if (!textMode || performance.now() - textModeSince < 500) return;
  const element = event.target.closest("[data-edit]");
  if (element) chooseText(element.dataset.edit);
});

textInput.addEventListener("input", () => {
  writeText(textPath, textInput.value);
  save();
  renderStage(activeScreenId);
  outlineChosenText();
});

document.getElementById("text-done").addEventListener("click", () => setTextMode(false));

document.getElementById("text-more").addEventListener("click", () => {
  const screen = SCREENS.find((item) => item.id === activeScreenId);
  setTextMode(false);
  openEdit(screen.editTab);
});
