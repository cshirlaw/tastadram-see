// The guide's words and pictures. One source for the pages at /guide, the
// printed producer's guide (/guide/print) and the table card (/p/<code>/card).
// The pictures are the real screens at phone size, taken on 30 Sep 2026 with a
// Slow Sauce example; the ringed part is the thing to press or look at.

export interface Step { title: string; lines: string[]; img: string; alt: string }

export const PRODUCER_STEPS: Step[] = [
  {
    title: "Set up a login",
    lines: [
      "Go to tastadram-see.vercel.app/admin and press “No passcode? Set one up”.",
      "Enter your business and your name, then press “Set up”. Write down the passcode it shows you: you sign in with it.",
    ],
    img: "/guide/p1-login.png", alt: "Set up a login: business, name and the Set up button",
  },
  {
    title: "The demonstration",
    lines: [
      "Your console has a tasting that is always ready, with four samples on the table. Press “Open the demonstration”.",
      "Use it to show someone how it works. Nothing tasted in it counts in your results.",
    ],
    img: "/guide/p2-demo.png", alt: "The console with Open the demonstration",
  },
  {
    title: "A new tasting",
    lines: [
      "Under “New tasting”, give it a name and a place. Enter your product and three others at a similar price: product, producer, what it is, price and size.",
      "Mark yours with “This is my product”. They go on A, B, C and D in this order. Press “Create”.",
    ],
    img: "/guide/p3-create.png", alt: "The new tasting form with four samples filled in",
  },
  {
    title: "The link and the code",
    lines: [
      "The tasting page opens. Show the QR code, send the link, or give out the code.",
      "People join on their own phones. Nobody needs an account.",
    ],
    img: "/guide/p4-link.png", alt: "The tasting page with the link, the code and the QR code",
  },
  {
    title: "Serve blind",
    lines: [
      "Only you see this list. Serve each sample on a plate or in a cup marked with its letter, away from the table.",
      "Nobody tasting sees a label.",
    ],
    img: "/guide/p5-serve.png", alt: "The four samples on A, B, C and D, with yours marked",
  },
  {
    title: "Who has tasted",
    lines: [
      "Each person makes three comparisons, then says whether they would buy the one they preferred. “Finished” shows Yes when they have.",
      "Each person sees the names as soon as they finish.",
    ],
    img: "/guide/p6-who.png", alt: "The list of who has tasted",
  },
  {
    title: "Show the answers",
    lines: [
      "When everyone has finished, press “Show the answers to everyone”.",
      "The result shows, for each sample, how many people preferred it and how many of them would buy it at the price.",
    ],
    img: "/guide/p7-answers.png", alt: "Show the answers to everyone, and the result",
  },
  {
    title: "All your tastings",
    lines: [
      "On your console, “Your products, all tastings together” adds up every tasting you have run.",
      "A test tasting can be archived from its page, under “More”. It then stops counting.",
    ],
    img: "/guide/p8-all.png", alt: "Your products, all tastings together",
  },
];

export const GUEST_STEPS: (Step & { card: string })[] = [
  { title: "Scan the code and enter a name", lines: ["Any name you like. Then press “Join”."], img: "/guide/g1-join.png", card: "/guide/c1-join.png", alt: "Join the tasting: enter a name" },
  { title: "Taste the two named, tap the one you prefer", lines: ["Three times. The last time is the two you preferred."], img: "/guide/g2-compare.png", card: "/guide/c2-compare.png", alt: "Comparison 1 of 3: A or B" },
  { title: "Would you buy it at that price?", lines: ["Yes or no."], img: "/guide/g3-buy.png", card: "/guide/c3-buy.png", alt: "Would you buy A at the price: Yes or No" },
  { title: "See what each sample was", lines: ["And how everyone else chose."], img: "/guide/g4-answers.png", card: "/guide/c4-answers.png", alt: "The answers" },
];
