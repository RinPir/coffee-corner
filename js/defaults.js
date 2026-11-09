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
  version: 4,              // lets the app update older saved content
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
  screens: { menu: true, shop: true, order: true, pay: true, pour: true, ready: true, pick: false, note: true, sign: true, ambient: true }, // which screens you can swipe to

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
    drink: "flat white",
    username: "yourfollower",
    note: "extra foam, no sugar",
  },

  // seasons: one or several of the four, or ["all"] for all year.
  // price: just the number of kisses. The app writes "3 kisses" or "1 kiss".
  // onBoard: the seasons in which the drink appears on the menu board.
  // notes: a short recipe for you. It only shows in the drink editor.
  drinks: [
    // All year
    { name: "espresso", category: "coffee", seasons: ["all"], price: 2, description: "short, strong, honest", onBoard: [],
      notes: "just espresso" },
    { name: "cappuccino", category: "coffee", seasons: ["all"], price: 3, description: "foam first, then coffee", onBoard: ["spring"],
      notes: "espresso, thick milk foam, cinnamon optional" },
    { name: "flat white", category: "coffee", seasons: ["all"], price: 3, description: "small, smooth, silky", onBoard: ["autumn", "spring"],
      notes: "double espresso, a little silky milk" },
    { name: "honey latte", category: "coffee", seasons: ["all"], price: 4, description: "a spoon of honey, a pinch of cinnamon", onBoard: ["autumn"],
      notes: "dissolve honey in hot espresso, add milk, cinnamon on top" },
    { name: "vanilla latte", category: "coffee", seasons: ["all"], price: 4, description: "soft and sweet", onBoard: [],
      notes: "vanilla sugar dissolved in espresso, then milk" },
    { name: "sweet milk coffee", category: "coffee", seasons: ["all"], price: 4, description: "condensed milk, slow layers", onBoard: [],
      notes: "condensed milk at the bottom, espresso on top, hot or iced" },
    { name: "mocha", category: "coffee", seasons: ["all"], price: 5, description: "coffee meets chocolate", onBoard: [],
      notes: "melted dark chocolate or cocoa with sugar, espresso, milk, whipped cream" },
    { name: "matcha latte", category: "matcha", seasons: ["all"], price: 4, description: "whisked slowly", onBoard: [],
      notes: "matcha with a little water, then milk, honey optional" },
    { name: "hot chocolate", category: "chocolate", seasons: ["all"], price: 4, description: "thick, warm, comforting", onBoard: [],
      notes: "milk, dark chocolate, a little sugar, whipped cream" },
    { name: "pour over", category: "coffee", seasons: ["all"], price: 3, description: "clean and bright", onBoard: [],
      notes: "brewed in the dripper" },

    // Autumn
    { name: "pumpkin spice latte", category: "coffee", seasons: ["autumn"], price: 5, description: "real pumpkin, warm spice", onBoard: ["autumn"],
      notes: "baked pumpkin mashed with sugar, cinnamon, ginger, nutmeg; espresso, milk, whipped cream" },
    { name: "chai latte", category: "tea", seasons: ["autumn"], price: 4, description: "simmered with cardamom", onBoard: ["autumn"],
      notes: "black tea simmered in milk with cinnamon, cardamom, cloves, ginger, sugar" },
    { name: "cinnamon honey cappuccino", category: "coffee", seasons: ["autumn"], price: 4, description: "cozy in a cup", onBoard: ["autumn"],
      notes: "cappuccino with honey and a thick layer of cinnamon on the foam" },
    { name: "feijoa honey tea", category: "tea", seasons: ["autumn"], price: 3, description: "a little taste of autumn", onBoard: ["autumn"],
      notes: "mashed feijoa with honey, topped with hot water or green tea" },

    // Winter
    { name: "gingerbread latte", category: "coffee", seasons: ["winter"], price: 5, description: "spiced like cookies", onBoard: ["winter"],
      notes: "brown sugar or honey, grated ginger, cinnamon, a pinch of cloves; espresso, milk, whipped cream" },
    { name: "cinnamon roll latte", category: "coffee", seasons: ["winter"], price: 5, description: "like a warm bun", onBoard: ["winter"],
      notes: "brown sugar and cinnamon in espresso, milk, whipped cream with cinnamon" },
    { name: "toasted marshmallow latte", category: "coffee", seasons: ["winter"], price: 5, description: "a little campfire", onBoard: ["winter"],
      notes: "latte topped with marshmallows toasted on a fork over the flame" },
    { name: "orange mocha", category: "coffee", seasons: ["winter"], price: 5, description: "chocolate and orange peel", onBoard: ["winter"],
      notes: "mocha with orange zest, whipped cream and zest on top" },
    { name: "pomegranate winter punch", category: "other", seasons: ["winter"], price: 4, description: "spiced and ruby red", onBoard: ["winter"],
      notes: "pomegranate juice warmed with orange, cinnamon, cloves, honey to taste" },
    { name: "winter hot chocolate", category: "chocolate", seasons: ["winter"], price: 5, description: "for long evenings", onBoard: ["winter"],
      notes: "hot chocolate with whipped cream, marshmallows and cinnamon" },
    { name: "homemade caramel latte", category: "coffee", seasons: ["winter"], price: 5, description: "caramel from scratch", onBoard: [],
      notes: "caramel from sugar and cream (melt sugar, pour in hot cream), espresso, milk" },
    { name: "salted caramel hot chocolate", category: "chocolate", seasons: ["winter"], price: 5, description: "sweet with a pinch of salt", onBoard: [],
      notes: "hot chocolate with a spoon of the same caramel and a pinch of salt" },
    { name: "white chocolate latte", category: "coffee", seasons: ["winter"], price: 4, description: "creamy and snowy", onBoard: [],
      notes: "melted white chocolate, espresso, milk" },
    { name: "white chocolate matcha", category: "matcha", seasons: ["winter"], price: 5, description: "soft green snow", onBoard: [],
      notes: "melted white chocolate, matcha, milk" },

    // Spring
    { name: "strawberry matcha", category: "matcha", seasons: ["spring"], price: 5, description: "pink and green", onBoard: ["spring"],
      notes: "strawberries mashed with sugar, ice, milk, matcha on top" },
    { name: "vanilla cream latte", category: "coffee", seasons: ["spring"], price: 4, description: "a cloud on top", onBoard: ["spring"],
      notes: "latte topped with cream whipped with vanilla sugar" },
    { name: "honey matcha", category: "matcha", seasons: ["spring"], price: 4, description: "gentle and sweet", onBoard: ["spring"],
      notes: "matcha latte with honey and a pinch of cinnamon" },
    { name: "lemon ginger tea", category: "tea", seasons: ["spring"], price: 3, description: "bright and warming", onBoard: ["spring"],
      notes: "ginger, lemon, honey, hot water" },

    // Summer
    { name: "iced latte", category: "coffee", seasons: ["summer"], price: 3, description: "simple and cold", onBoard: ["summer"],
      notes: "espresso, ice, cold milk, sugar optional" },
    { name: "iced sweet milk coffee", category: "coffee", seasons: ["summer"], price: 4, description: "summer in a glass", onBoard: ["summer"],
      notes: "condensed milk, ice, espresso" },
    { name: "affogato", category: "coffee", seasons: ["summer"], price: 4, description: "ice cream drowning in coffee", onBoard: ["summer"],
      notes: "a scoop of vanilla ice cream, hot espresso poured over" },
    { name: "shaken espresso", category: "coffee", seasons: ["summer"], price: 4, description: "shaken, not stirred", onBoard: ["summer"],
      notes: "espresso, sugar and ice shaken in a jar until foamy, topped with milk" },
    { name: "peach iced tea", category: "tea", seasons: ["summer"], price: 4, description: "sun-ripe peaches", onBoard: ["summer"],
      notes: "ripe peaches with sugar, cold black tea, ice" },
    { name: "iced mint lemonade", category: "other", seasons: ["summer"], price: 3, description: "fresh from the garden", onBoard: ["summer"],
      notes: "lemon, sugar, fresh mint, ice, water" },
  ],
};
