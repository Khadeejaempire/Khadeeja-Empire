import type { Product, HeroSlide, ValueItem } from "@/types";

/**
 * DEMO PRICE MAP — single source of truth for prototype pricing.
 * Replace these values when the client provides the actual price list.
 * All prices are in INR.
 */
export const demoPrices: Record<string, number> = {
  "short-kurtis": 890,
  "coord-sets": 1890,
  "everyday-tops": 790,
  "dresses": 1490,
  "resort-and-whites": 1690,
  "new-arrivals": 1290,
};

export const currency = "INR";

const img = (id: string) => `/assets/images/${id}.jpg`;
const vid = (id: string) => `/assets/videos/${id}.mp4`;

export const products: Product[] = [
  // ── Short Kurtis ──────────────────────────────────────────────
  {
    id: "p-kurti-01",
    slug: "chatpati-short-kurti",
    name: "Chatpati Short Kurti",
    category: "short-kurtis",
    collection: "short-kurtis",
    description:
      "A playful short kurti with a vibrant floral print and a tailored fit. Crafted from breathable cotton for all-day comfort. Designed to pair effortlessly with jeans or palazzos.",
    images: [img("3936178179397803674")],
    video: vid("3936178179397803674"),
    price: demoPrices["short-kurtis"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Ethnic", "Summer", "Casual"],
    availability: "in-stock",
    sourcePostId: "3936178179397803674",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "featured",
  },
  {
    id: "p-kurti-02",
    slug: "cotton-everyday-kurti",
    name: "Cotton Everyday Kurti",
    category: "short-kurtis",
    collection: "short-kurtis",
    description:
      "Premium cotton kurti that holds its colour and shape wash after wash. A versatile piece for daily wear with a clean, modern silhouette.",
    images: [img("3939802292590768865")],
    video: vid("3939802292590768865"),
    price: demoPrices["short-kurtis"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Ethnic", "Casual", "Minimal"],
    availability: "in-stock",
    sourcePostId: "3939802292590768865",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-kurti-03",
    slug: "premium-cotton-kurti-purple",
    name: "Premium Cotton Kurti — Purple",
    category: "short-kurtis",
    collection: "short-kurtis",
    description:
      "A rich purple kurti in premium cotton with an elegant wrap-around silhouette. Combines ethnic charm with everyday ease.",
    images: [img("3932554101906649932")],
    video: vid("3932554101906649932"),
    price: demoPrices["short-kurtis"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Ethnic", "Indo-Western", "Summer"],
    availability: "in-stock",
    sourcePostId: "3932554101906649932",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "new",
  },
  {
    id: "p-kurti-04",
    slug: "summer-edit-kurti",
    name: "Summer Edit Kurti",
    category: "short-kurtis",
    collection: "short-kurtis",
    description:
      "Part of our summer edit featuring 15 elegant designs. A breezy kurti crafted for comfort, style, and everyday versatility.",
    images: [img("3918403316976935650")],
    price: demoPrices["short-kurtis"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Summer", "Ethnic"],
    availability: "in-stock",
    sourcePostId: "3918403316976935650",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-kurti-05",
    slug: "purple-floral-short-kurti",
    name: "Purple Floral Short Kurti",
    category: "short-kurtis",
    collection: "short-kurtis",
    description:
      "A vibrant pop of colour for your everyday wardrobe. This purple floral kurti features a gorgeous fit and intricate detailing.",
    images: [img("3931104797681236517")],
    price: demoPrices["short-kurtis"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Ethnic", "Summer", "Statement"],
    availability: "in-stock",
    sourcePostId: "3931104797681236517",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-kurti-06",
    slug: "fusion-short-kurti-drop",
    name: "Fusion Short Kurti Drop",
    category: "short-kurtis",
    collection: "short-kurtis",
    description:
      "One wardrobe, endless moods. This short kurti drop features fusion styling that transitions from day to night effortlessly.",
    images: [img("3937627844097571363")],
    price: demoPrices["short-kurtis"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Indo-Western", "Casual", "Ethnic"],
    availability: "in-stock",
    sourcePostId: "3937627844097571363",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },

  // ── Co-ord Sets ───────────────────────────────────────────────
  {
    id: "p-coord-01",
    slug: "floral-coord-set-white",
    name: "Floral Co-ord Set — White & Black",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "A crisp white and black floral co-ord set that is super soft and breathable. Perfect for travel and everyday wear with an effortless drape.",
    images: [img("3911022349174249793")],
    video: vid("3911022349174249793"),
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "White", "Travel", "Summer"],
    availability: "in-stock",
    sourcePostId: "3911022349174249793",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "featured",
  },
  {
    id: "p-coord-02",
    slug: "sheer-overlay-floral-set",
    name: "Sheer Overlay Floral Set",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "A floral sheer overlay set that transitions from casual to Khadeeja Empire elegance. Handcrafted details meet effortless summer styling.",
    images: [img("3897412631952592325")],
    video: vid("3897412631952592325"),
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Banaras-inspired", "Summer", "Statement"],
    availability: "in-stock",
    sourcePostId: "3897412631952592325",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-coord-03",
    slug: "banaras-embroidered-set",
    name: "Banaras Embroidered Co-ord Set",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "From the streets of Banaras to your summer mood board. This floral embroidered set is the ultimate OOTD for those who love colour and craft.",
    images: [img("3895371692098630743")],
    video: vid("3895371692098630743"),
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Banaras-inspired", "Summer", "Ethnic"],
    availability: "in-stock",
    sourcePostId: "3895371692098630743",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "new",
  },
  {
    id: "p-coord-04",
    slug: "whisper-elegance-cord-set",
    name: "Whisper Elegance Cord Set",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "A cord set that whispers elegance with every step. Crafted in Banaras with breathable fabric and a fluid drape.",
    images: [img("3900319569828324606")],
    video: vid("3900299515141596522"),
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Banaras-inspired", "Minimal", "Summer"],
    availability: "in-stock",
    sourcePostId: "3900319569828324606",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-coord-05",
    slug: "paisley-coord-set",
    name: "Paisley Co-ord Set",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "Step into the sunshine with our latest paisley obsession. This co-ord set blends intricate lace details with vibrant prints for the perfect summer look.",
    images: [img("3894492185875542527")],
    video: vid("3894492185875542527"),
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Paisley", "Summer", "Travel", "Statement"],
    availability: "in-stock",
    sourcePostId: "3894492185875542527",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-coord-06",
    slug: "summer-whites-coord-set",
    name: "Summer Whites Co-ord Set",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "Sun-kissed and styled in our favourite summer whites. This floral embroidered co-ord set is all about comfort without compromise.",
    images: [img("3895375655824473281")],
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Floral", "Summer", "Minimal"],
    availability: "low-stock",
    sourcePostId: "3895375655824473281",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-coord-07",
    slug: "white-floral-summer-coord",
    name: "White Floral Summer Co-ord",
    category: "coord-sets",
    collection: "coord-sets",
    description:
      "Summer whites done right. A clean co-ord set with floral embroidery that feels like a breath of fresh air. Casual, comfortable, and effortlessly chic.",
    images: [img("3895369217693688298")],
    price: demoPrices["coord-sets"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Floral", "Summer", "Minimal"],
    availability: "in-stock",
    sourcePostId: "3895369217693688298",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },

  // ── Everyday Tops ─────────────────────────────────────────────
  {
    id: "p-top-01",
    slug: "effortless-elegance-top",
    name: "Effortless Elegance Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "Elegance that speaks before you do. A timeless top designed for effortless style and all-day comfort.",
    images: [img("3945260404659568172")],
    video: vid("3945260404659568172"),
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Minimal", "Casual", "Summer"],
    availability: "in-stock",
    sourcePostId: "3945260404659568172",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "new",
  },
  {
    id: "p-top-02",
    slug: "blue-aesthetic-top",
    name: "Blue Aesthetic Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "Your next favourite top. A soft blue piece that pairs beautifully with jeans or a skirt for a versatile everyday look.",
    images: [img("3948711001626445713")],
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Casual", "Summer", "Minimal"],
    availability: "in-stock",
    sourcePostId: "3948711001626445713",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-top-03",
    slug: "soft-hues-top",
    name: "Soft Hues Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "Soft hues, effortless charm, endless compliments. Your new favourite top is here with a beautifully relaxed fit.",
    images: [img("3945249942773160313")],
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Minimal", "Casual", "Summer"],
    availability: "in-stock",
    sourcePostId: "3945249942773160313",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-top-04",
    slug: "everyday-elegance-top",
    name: "Everyday Elegance Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "The top that makes every outfit look effortless. Comfort meets elegance in our newest arrival with a clean, versatile design.",
    images: [img("3947985919258649252")],
    video: vid("3947985919258649252"),
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Casual", "Summer", "Minimal"],
    availability: "in-stock",
    sourcePostId: "3947985919258649252",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-top-05",
    slug: "twist-front-floral-top",
    name: "Twist-Front Floral Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "Your go-to casual favourite. Breathable fabric, a timeless floral print, and a perfectly tailored twist-front design.",
    images: [img("3923489547532341720")],
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Casual", "Summer"],
    availability: "in-stock",
    sourcePostId: "3923489547532341720",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-top-06",
    slug: "white-halter-top",
    name: "White Halter Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "A crisp white halter top that is minimal, beautifully structured, and gives that effortless look without trying too hard.",
    images: [img("3923512320514713148")],
    video: vid("3923512320514713148"),
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Halter", "Minimal", "Summer"],
    availability: "in-stock",
    sourcePostId: "3923512320514713148",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "featured",
  },
  {
    id: "p-top-07",
    slug: "floral-halter-top",
    name: "Floral Halter Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "Sweet florals and effortless summer silhouettes. Keep it cool and classic with this white halter-style top with delicate floral detailing.",
    images: [img("3923476630602737800")],
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Halter", "White", "Summer"],
    availability: "in-stock",
    sourcePostId: "3923476630602737800",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-top-08",
    slug: "asymmetrical-cami-top",
    name: "Asymmetrical Cami Top",
    category: "everyday-tops",
    collection: "everyday-tops",
    description:
      "Brunch date or a casual day out—this top is ready for both. A subtle floral print with an asymmetrical flare on this cami top.",
    images: [img("3913335584870887646")],
    price: demoPrices["everyday-tops"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Casual", "Summer", "Statement"],
    availability: "in-stock",
    sourcePostId: "3913335584870887646",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },

  // ── Dresses ───────────────────────────────────────────────────
  {
    id: "p-dress-01",
    slug: "chocolate-brown-halter-dress",
    name: "Chocolate Brown Halter Dress",
    category: "dresses",
    collection: "dresses",
    description:
      "From basic lounge layers to the ultimate confidence boost. A deep chocolate brown halter dress with an effortless flow and stunning drape.",
    images: [img("3920746353986469456")],
    video: vid("3920746353986469456"),
    price: demoPrices["dresses"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Halter", "Statement", "Indo-Western"],
    availability: "in-stock",
    sourcePostId: "3920746353986469456",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "featured",
  },
  {
    id: "p-dress-02",
    slug: "statement-evening-dress",
    name: "Statement Evening Dress",
    category: "dresses",
    collection: "dresses",
    description:
      "When the outfit looks this good, being late is worth it. A statement dress that makes getting ready a breeze for brunch or an evening out.",
    images: [img("3929655482518054688")],
    video: vid("3929655482518054688"),
    price: demoPrices["dresses"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Statement", "Indo-Western", "Summer"],
    availability: "in-stock",
    sourcePostId: "3929655482518054688",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-dress-03",
    slug: "indowestern-maxi-dress",
    name: "Indo-Western Maxi Dress",
    category: "dresses",
    collection: "dresses",
    description:
      "Getting ready for a brunch or an evening out is a breeze when you have a statement piece like this. An Indo-Western maxi with a flawless silhouette.",
    images: [img("3930379962365755965")],
    price: demoPrices["dresses"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Indo-Western", "Summer", "Statement"],
    availability: "in-stock",
    sourcePostId: "3930379962365755965",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "new",
  },
  {
    id: "p-dress-04",
    slug: "cream-maxi-dress",
    name: "Cream Maxi Dress",
    category: "dresses",
    collection: "dresses",
    description:
      "When comfort meets high fashion, you get this stunning cream maxi. The lightweight fabric keeps you cool while the silhouette turns heads.",
    images: [img("3928572692891905122")],
    price: demoPrices["dresses"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Minimal", "Summer", "Casual"],
    availability: "in-stock",
    sourcePostId: "3928572692891905122",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-dress-05",
    slug: "elegant-halter-dress",
    name: "Elegant Halter Dress",
    category: "dresses",
    collection: "dresses",
    description:
      "It is all in the details—from the delicate halter tie to the flawless drape. Stepping out in pure elegance with a dress that speaks for itself.",
    images: [img("3920761862438556080")],
    price: demoPrices["dresses"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Halter", "Statement", "Summer"],
    availability: "in-stock",
    sourcePostId: "3920761862438556080",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-dress-06",
    slug: "summer-ready-dress",
    name: "Summer Ready Dress",
    category: "dresses",
    collection: "dresses",
    description:
      "Consider the outfit of the day sorted. A beautiful print and elegant silhouette make this summer-ready piece a wardrobe essential.",
    images: [img("3920737631633963676")],
    price: demoPrices["dresses"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Floral", "Summer", "Casual"],
    availability: "in-stock",
    sourcePostId: "3920737631633963676",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },

  // ── Resort & Whites ───────────────────────────────────────────
  {
    id: "p-resort-01",
    slug: "white-tiered-resort-dress",
    name: "White Tiered Resort Dress",
    category: "resort-and-whites",
    collection: "resort-and-whites",
    description:
      "Packing for your next getaway? Make sure this is the first thing in your suitcase. A dreamy, tiered white dress that says vacation mode.",
    images: [img("3942701400028659556")],
    video: vid("3942701400028659556"),
    price: demoPrices["resort-and-whites"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Travel", "Summer", "Minimal"],
    availability: "in-stock",
    sourcePostId: "3942701400028659556",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "featured",
  },
  {
    id: "p-resort-02",
    slug: "smocked-white-dress",
    name: "Smocked White Dress",
    category: "resort-and-whites",
    collection: "resort-and-whites",
    description:
      "Minimal effort, maximum elegance. For the days when you want to look instantly put-together without trying too hard. A beautifully smocked white dress.",
    images: [img("3944875503212557962")],
    price: demoPrices["resort-and-whites"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Minimal", "Summer"],
    availability: "in-stock",
    sourcePostId: "3944875503212557962",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-resort-03",
    slug: "white-embroidered-dress",
    name: "White Embroidered Dress",
    category: "resort-and-whites",
    collection: "resort-and-whites",
    description:
      "The ultimate white dress your wardrobe has been missing. Designed with breathable fabric, a flattering plunge neckline, and intricate embroidery details.",
    images: [img("3941251484517112834")],
    price: demoPrices["resort-and-whites"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Floral", "Summer", "Minimal"],
    availability: "in-stock",
    sourcePostId: "3941251484517112834",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },
  {
    id: "p-resort-04",
    slug: "breezy-white-look",
    name: "Breezy White Look",
    category: "resort-and-whites",
    collection: "resort-and-whites",
    description:
      "Light, breezy, effortless. Embrace comfort with style in this relaxed white piece designed for sun-soaked days.",
    images: [img("3909860176766659847")],
    price: demoPrices["resort-and-whites"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["White", "Minimal", "Summer", "Travel"],
    availability: "in-stock",
    sourcePostId: "3909860176766659847",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
  },

  // ── New Arrivals ──────────────────────────────────────────────
  {
    id: "p-new-01",
    slug: "statement-corset-tunic",
    name: "Statement Corset Tunic",
    category: "new-arrivals",
    collection: "new-arrivals",
    description:
      "Serving looks you cannot ignore. This statement corset tunic is giving all the right vibes—perfect for turning heads.",
    images: [img("3952741041305855070")],
    video: vid("3952741041305855070"),
    price: demoPrices["new-arrivals"],
    currency,
    priceStatus: "demo",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["Statement", "Indo-Western", "Summer"],
    availability: "in-stock",
    sourcePostId: "3952741041305855070",
    sourceUrl: "https://www.instagram.com/p/",
    isPrototypeData: true,
    badge: "new",
  },
];

// ── Hero Carousel Slides ─────────────────────────────────────────
export const heroSlides: HeroSlide[] = [
  {
    id: "hero-1",
    title: "ETHNIC WEAR",
    subtitle: "Everyday Elegance",
    image: "/assets/slides/girl-1.png",
    imageAlt: "Woman wearing a black-and-white zigzag tunic with light blue jeans against a dark background.",
    video: vid("3932554101906649932"),
    cta: "Explore",
    ctaLink: "/collections/short-kurtis",
    collection: "short-kurtis",
  },
  {
    id: "hero-2",
    title: "MODERN STYLES",
    subtitle: "Casual Comfort",
    image: "/assets/slides/girl-2.png",
    imageAlt: "Woman wearing a light blue gingham halter top and pale skirt against a brown background.",
    video: vid("3895371692098630743"),
    cta: "Explore",
    ctaLink: "/collections/coord-sets",
    collection: "coord-sets",
  },
  {
    id: "hero-3",
    title: "WOMEN'S FASHION",
    subtitle: "Timeless Traditions",
    image: "/assets/slides/girl-3.png",
    imageAlt: "Woman wearing a pale blue embroidered camisole with black trousers against a brown background.",
    video: vid("3942701400028659556"),
    cta: "Explore",
    ctaLink: "/collections/resort-and-whites",
    collection: "resort-and-whites",
  },
];

// ── Brand Values ─────────────────────────────────────────────────
export const brandValues: ValueItem[] = [
  {
    title: "Easy Silhouettes",
    description:
      "Pieces designed to move with you—breathable, comfortable, and made for real life.",
  },
  {
    title: "Crafted Details",
    description:
      "Every thread tells a story. Handcrafted in Banaras with attention to every seam.",
  },
  {
    title: "Made to be Worn Your Way",
    description:
      "Versatile by design. Dress it up, dress it down—your wardrobe, your rules.",
  },
];

// ── Helper Functions ─────────────────────────────────────────────
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductsByCollection(collection: string): Product[] {
  return products.filter((p) => p.collection === collection);
}

export function getNewArrivals(limit = 6): Product[] {
  return products.filter((p) => p.badge === "new").slice(0, limit);
}

export function getFeaturedProducts(limit = 6): Product[] {
  return products.filter((p) => p.badge === "featured").slice(0, limit);
}

export function getLatestProducts(limit = 6): Product[] {
  return products.slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function formatPrice(price: number, curr = currency): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 0,
  });
  return formatter.format(price);
}

export const allTags: Product["tags"][number][] = [
  "Floral",
  "Paisley",
  "White",
  "Halter",
  "Casual",
  "Ethnic",
  "Indo-Western",
  "Summer",
  "Travel",
  "Banaras-inspired",
  "Statement",
  "Minimal",
];

export const allSizes = ["XS", "S", "M", "L", "XL"];
