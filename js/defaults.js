/* ==========================================================================
   defaults.js: what the app contains the very first time it opens.
   After that, your own content is saved on the iPad and changed in edit mode,
   so editing this file only affects a fresh install.
   ========================================================================== */

const CATEGORIES = ["coffee", "matcha", "tea", "chocolate", "other"];
const SEASONS = ["autumn", "winter", "spring", "summer"];

// The menu board never shows more drinks than this
const MAX_ON_BOARD = 6;

const DEFAULT_STATE = {
  version: 2,              // lets the app update older saved content
  cafeName: "the little nook",
  subtitle: "made at home ♡",
  signOpen: "open",        // the two sides of the sign
  signOpenNote: "come on in",
  signClosed: "see you tomorrow",
  signClosedNote: "the kettle is resting",
  signIsOpen: true,
  labels: {                // the small fixed words on the screens
    order: "today's order",
    number: "no.",
    pick: "drink of the day",
    today: "today's drink",
    empty: "back soon",
    shopButton: "order",
    shopAdded: "added ♡",
    pay: "touch to pay",
    paid: "paid",
    pour: "hold to pour",
    full: "all yours",
    ready: "is ready",
  },
  season: "auto",          // autumn, winter, spring, summer or auto
  background: "light",     // light or dark
  textSize: 1,             // 1 is normal; the slider goes from 0.8 to 1.5
  screens: { menu: true, shop: true, order: true, pay: true, pour: true, ready: true, pick: true, note: true, sign: true, ambient: true }, // which screens you can swipe to

  // The little notes that come out of the cup, one idea each
  notes: [
    "you are doing better than you think",
    "drink this slowly",
    "today is allowed to be small",
    "someone is glad you exist",
    "rest counts as doing something",
    "the kettle believes in you",
    "go outside for five minutes",
    "text the friend you just thought of",
    "you don't have to finish it all today",
    "good things are on their way",
    "be as kind to yourself as you are to your cup",
    "this moment is enough",
  ],

  order: {
    number: 1,
    drink: "oat flat white",
    username: "yourfollower",
    note: "extra foam, no sugar",
  },

  // seasons: one or several of the four, or ["all"] for all year.
  // onBoard: whether the drink appears on the menu board.
  drinks: [
    { name: "oat flat white",        category: "coffee",    seasons: ["all"],              price: "3 kisses", description: "small, smooth, silky",      onBoard: true },
    { name: "vanilla cappuccino",    category: "coffee",    seasons: ["all"],              price: "3 kisses", description: "with a cloud of foam",      onBoard: false },
    { name: "matcha latte",          category: "matcha",    seasons: ["all"],              price: "4 kisses", description: "whisked slowly",            onBoard: true },
    { name: "earl grey",             category: "tea",       seasons: ["all"],              price: "3 kisses", description: "bergamot and quiet",        onBoard: false },
    { name: "pumpkin spice latte",   category: "coffee",    seasons: ["autumn"],           price: "5 kisses", description: "real pumpkin, warm spice",  onBoard: true },
    { name: "maple cinnamon latte",  category: "coffee",    seasons: ["autumn"],           price: "5 kisses", description: "maple syrup, cinnamon dust", onBoard: true },
    { name: "chai latte",            category: "tea",       seasons: ["autumn", "winter"], price: "4 kisses", description: "simmered with cardamom",    onBoard: true },
    { name: "gingerbread latte",     category: "coffee",    seasons: ["winter"],           price: "5 kisses", description: "ginger, molasses, nutmeg",  onBoard: true },
    { name: "hot chocolate",         category: "chocolate", seasons: ["winter"],           price: "4 kisses", description: "thick and slow",            onBoard: true },
    { name: "peppermint mocha",      category: "chocolate", seasons: ["winter"],           price: "5 kisses", description: "dark chocolate, cool mint", onBoard: true },
    { name: "lavender latte",        category: "coffee",    seasons: ["spring"],           price: "4 kisses", description: "lightly floral",            onBoard: true },
    { name: "sakura milk tea",       category: "tea",       seasons: ["spring"],           price: "4 kisses", description: "soft pink and delicate",    onBoard: true },
    { name: "strawberry matcha",     category: "matcha",    seasons: ["spring", "summer"], price: "5 kisses", description: "layered over ice",          onBoard: true },
    { name: "iced matcha latte",     category: "matcha",    seasons: ["summer"],           price: "4 kisses", description: "cold, green, calm",         onBoard: true },
    { name: "iced peach tea",        category: "tea",       seasons: ["summer"],           price: "3 kisses", description: "cold-brewed and golden",    onBoard: true },
  ],
};
