/* ==========================================================================
   storage.js: saves everything on the device, and handles JSON backups.
   ========================================================================== */

const STORAGE_KEY = "coffee-corner";

let nextDrinkId = 1;

// The app's current content and settings. Every other file reads this.
let state = loadState();

function makeDrinkId() {
  return "d" + Date.now().toString(36) + "-" + nextDrinkId++;
}

function text(value, fallback, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

// Builds a complete, valid state from anything, filling gaps with defaults.
// A damaged or partial backup can't break the app because of this.
function cleanState(raw) {
  const d = DEFAULT_STATE;
  const rawOrder = raw.order || {};
  const number = Math.floor(Number(rawOrder.number));

  // Updates a drink from an older save, one time:
  // prices become "3 kisses", and starter drinks gain their new descriptions.
  const upgradeDrink = (drink) => {
    if (raw.version === d.version || !drink || typeof drink !== "object") return drink;
    const starter = d.drinks.find((item) => item.name === drink.name);
    const description = drink.description || (starter ? starter.description : "");
    let price = drink.price;
    if (raw.priceNote === undefined && starter) price = starter.price;
    else if (raw.priceNote && /^\s*\d+\s*$/.test(price)) price = `${price.trim()} ${raw.priceNote}`;
    return { ...drink, price, description };
  };

  return {
    version: d.version,
    cafeName: text(raw.cafeName, d.cafeName, 60),
    subtitle: text(raw.subtitle, d.subtitle, 80),
    signOpen: text(raw.signOpen, d.signOpen, 30),
    signOpenNote: text(raw.signOpenNote, d.signOpenNote, 50),
    signClosed: text(raw.signClosed, d.signClosed, 30),
    signClosedNote: text(raw.signClosedNote, d.signClosedNote, 50),
    signIsOpen: raw.signIsOpen !== false,
    season: [...SEASONS, "auto"].includes(raw.season) ? raw.season : d.season,
    background: raw.background === "dark" ? "dark" : "light",
    textSize: Math.min(1.5, Math.max(0.8, Number(raw.textSize) || 1)),
    screens: { ...d.screens, ...(raw.screens || {}) },
    order: {
      number: number >= 1 ? Math.min(number, 99999) : 1,
      drink: text(rawOrder.drink, d.order.drink, 60),
      username: text(rawOrder.username, d.order.username, 40),
      note: text(rawOrder.note, d.order.note, 100),
    },
    drinks: (Array.isArray(raw.drinks) ? raw.drinks : d.drinks)
      .map(upgradeDrink)
      .filter((drink) => drink && typeof drink === "object")
      .map((drink) => {
        const seasons = (Array.isArray(drink.seasons) ? drink.seasons : [])
          .filter((season) => SEASONS.includes(season));
        return {
          id: text(drink.id, "", 40) || makeDrinkId(),
          name: text(drink.name, "", 60),
          category: CATEGORIES.includes(drink.category) ? drink.category : "other",
          // Anything not tied to a real season counts as all-year
          seasons: seasons.length && !(drink.seasons || []).includes("all") ? seasons : ["all"],
          price: text(drink.price, "", 40),
          description: text(drink.description, "", 100),
          onBoard: drink.onBoard !== false,
        };
      }),
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
