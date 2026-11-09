/* ==========================================================================
   storage.js: saves everything on the device, and handles JSON backups.
   ========================================================================== */

const STORAGE_KEY = "coffee-corner";

let nextDrinkId = 1;

// The starter drinks from before the real menu: [name, price, description].
// An older save still holding one of these, unchanged, gets the real menu instead.
const OLD_STARTERS = [
  ["oat flat white", 3, "small, smooth, silky"], ["vanilla cappuccino", 3, "with a cloud of foam"],
  ["matcha latte", 4, "whisked slowly"], ["earl grey", 3, "bergamot and quiet"],
  ["pumpkin spice latte", 5, "real pumpkin, warm spice"], ["maple cinnamon latte", 5, "maple syrup, cinnamon dust"],
  ["chai latte", 4, "simmered with cardamom"], ["gingerbread latte", 5, "ginger, molasses, nutmeg"],
  ["hot chocolate", 4, "thick and slow"], ["peppermint mocha", 5, "dark chocolate, cool mint"],
  ["lavender latte", 4, "lightly floral"], ["sakura milk tea", 4, "soft pink and delicate"],
  ["strawberry matcha", 5, "layered over ice"], ["iced matcha latte", 4, "cold, green, calm"],
  ["iced peach tea", 3, "cold-brewed and golden"],
];

// The app's current content and settings. Every other file reads this.
let state = loadState();

function makeDrinkId() {
  return "d" + Date.now().toString(36) + "-" + nextDrinkId++;
}

function text(value, fallback, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

// Finds the number of kisses in anything: 3, "3" or "3 kisses". No number means 0.
function parsePrice(value) {
  const found = String(value === undefined || value === null ? "" : value).match(/\d+/);
  return found ? Math.min(999, Number(found[0])) : 0;
}

// Older saves, one time: untouched starter drinks become the real menu.
// Anything you changed or added yourself stays.
function moveToRealMenu(drinks) {
  const isOldStarter = (drink) => OLD_STARTERS.some(([name, price, description]) =>
    drink.name === name && parsePrice(drink.price) === price && (!drink.description || drink.description === description));
  const yours = drinks.filter((drink) => drink && typeof drink === "object" && !isOldStarter(drink));
  const menu = DEFAULT_STATE.drinks.map((item) => {
    const same = yours.find((drink) => drink.name === item.name);
    return same ? { ...item, price: same.price, description: same.description } : item;
  });
  return [...menu, ...yours.filter((drink) => !menu.some((item) => item.name === drink.name))];
}

// Builds a complete, valid state from anything, filling gaps with defaults.
// A damaged or partial backup can't break the app because of this.
function cleanState(raw) {
  const d = DEFAULT_STATE;
  const rawOrder = raw.order || {};
  const number = Math.floor(Number(rawOrder.number));

  const rawDrinks = Array.isArray(raw.drinks) ? raw.drinks : d.drinks;
  const drinks = (raw.version >= 4 ? rawDrinks : moveToRealMenu(rawDrinks))
    .filter((drink) => drink && typeof drink === "object")
    .map((drink) => {
      const listed = (Array.isArray(drink.seasons) ? drink.seasons : [])
        .filter((season) => SEASONS.includes(season));
      // Anything not tied to a real season counts as all-year
      const seasons = listed.length && !(drink.seasons || []).includes("all") ? listed : ["all"];
      const ownSeasons = seasons.includes("all") ? SEASONS : seasons;
      return {
        id: text(drink.id, "", 40) || makeDrinkId(),
        name: text(drink.name, "", 60),
        category: CATEGORIES.includes(drink.category) ? drink.category : "other",
        seasons,
        price: parsePrice(drink.price),
        description: text(drink.description, "", 100),
        // Older saves had one tick for the whole year
        onBoard: Array.isArray(drink.onBoard)
          ? drink.onBoard.filter((season) => SEASONS.includes(season))
          : (drink.onBoard !== false ? [...ownSeasons] : []),
        notes: text(drink.notes, "", 300),
      };
    });

  // An older order may name a starter drink that has just gone away
  const orderDrink = text(rawOrder.drink, d.order.drink, 60);
  const orderDrinkIsGone = !(raw.version >= 4)
    && OLD_STARTERS.some(([name]) => name === orderDrink)
    && !drinks.some((drink) => drink.name === orderDrink);

  return {
    version: d.version,
    cafeName: text(raw.cafeName, d.cafeName, 60),
    subtitle: text(raw.subtitle, d.subtitle, 80),
    signOpen: text(raw.signOpen, d.signOpen, 30),
    signOpenNote: text(raw.signOpenNote, d.signOpenNote, 50),
    signClosed: text(raw.signClosed, d.signClosed, 30),
    signClosedNote: text(raw.signClosedNote, d.signClosedNote, 50),
    signIsOpen: raw.signIsOpen !== false,
    notes: (() => {
      const notes = (Array.isArray(raw.notes) ? raw.notes : [])
        .filter((note) => typeof note === "string" && note.trim())
        .map((note) => note.slice(0, 100))
        .slice(0, 40);
      return notes.length ? notes : [...d.notes];
    })(),
    labels: Object.fromEntries(Object.keys(d.labels).map((key) =>
      [key, text((raw.labels || {})[key], d.labels[key], 40)])),
    season: [...SEASONS, "auto"].includes(raw.season) ? raw.season : d.season,
    background: raw.background === "dark" ? "dark" : "light",
    textSize: Math.min(1.5, Math.max(0.8, Number(raw.textSize) || 1)),
    screens: {
      ...d.screens,
      ...(raw.screens || {}),
      // Older saves: drink of the day was taken off the swipe list in version 3
      ...(raw.version >= 3 ? {} : { pick: false }),
    },
    order: {
      number: number >= 1 ? Math.min(number, 99999) : 1,
      drink: orderDrinkIsGone ? d.order.drink : orderDrink,
      username: text(rawOrder.username, d.order.username, 40),
      note: text(rawOrder.note, d.order.note, 100),
    },
    drinks,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return cleanState(JSON.parse(saved));
  } catch (error) {
    console.warn("Could not read saved content, using the defaults.", error);
  }
  return cleanState(DEFAULT_STATE);
}

// Returns false if the device refused to save
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Could not save.", error);
    return false;
  }
}

// --- Backups ---------------------------------------------------------------

async function exportBackup() {
  const date = new Date().toISOString().slice(0, 10);
  const name = `coffee-corner-backup-${date}.json`;
  const file = new File([JSON.stringify(state, null, 2)], name, { type: "application/json" });

  // On iPad the share sheet is the reliable route ("Save to Files")
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "backup ready";
    } catch (error) {
      if (error.name === "AbortError") return "";
      // anything else: fall through to a normal download
    }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  return "backup saved to your downloads";
}

// Replaces everything with the backup. Throws if it isn't a real backup.
async function importBackup(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || !Array.isArray(parsed.drinks)) throw new Error("Not a backup file");
  state = cleanState(parsed);
  saveState();
}
