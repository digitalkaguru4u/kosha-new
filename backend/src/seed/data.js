// Sample catalogue. Replace with the brand's real products (or manage them in /admin).
export const collections = [
 {
  "slug": "metal",
  "name": "Metalcraft",
  "desc": "Bronze, brass, copper and Bidri, cast and chased by hand.",
  "heroSlug": "bidri-vase",
  "sort": 0
 },
 {
  "slug": "stone",
  "name": "Stone and inlay",
  "desc": "Makrana marble and soapstone, carved and set with stone.",
  "heroSlug": "pietra-dura-platter",
  "sort": 1
 },
 {
  "slug": "wood",
  "name": "Carved wood",
  "desc": "Sheesham and Kashmiri walnut, carved by hand.",
  "heroSlug": "saharanpur-box",
  "sort": 2
 },
 {
  "slug": "textile",
  "name": "Textiles",
  "desc": "Hand-spun, hand-woven, hand-printed and hand-stitched.",
  "heroSlug": "pashmina-throw",
  "sort": 3
 },
 {
  "slug": "light",
  "name": "Light",
  "desc": "Lanterns, lamps and candle pillars for a softer room.",
  "heroSlug": "jaali-lantern",
  "sort": 4
 },
 {
  "slug": "clay",
  "name": "Clay",
  "desc": "Blue pottery, Longpi stoneware and Bankura terracotta.",
  "heroSlug": "blue-pottery-vase",
  "sort": 5
 }
];

export const products = [
 {
  "slug": "dhokra-rider",
  "name": "Dhokra rider",
  "collectionSlug": "metal",
  "price": 38500,
  "stock": 3,
  "leadDays": 0,
  "tags": [
   "heirloom"
  ],
  "images": [],
  "art": {
   "mat": "bronze",
   "shape": "rider",
   "pat": "dhokra",
   "bg": "#DCD2C1"
  },
  "region": "Bastar, Chhattisgarh",
  "craft": "Dhokra lost-wax casting",
  "material": "Bronze alloy (brass and bell metal)",
  "dims": "H 38 × W 30 × D 12 cm",
  "weight": 4.2,
  "finish": "Hand-burnished, natural patina",
  "care": "Dust with a dry cloth. Do not polish; the patina is part of the piece.",
  "desc": "A horse and rider cast in a single pour, the wax threads of the mould still visible on the surface.",
  "craftText": "Each piece begins as a clay core wrapped in hand-rolled wax thread. The wax is covered in clay, melted out, and replaced with molten metal. The mould is broken to release the piece, so no two are the same.",
  "moq": 10,
  "exportReady": true,
  "active": true,
  "sort": 0
 },
 {
  "slug": "bidri-vase",
  "name": "Bidri vase, tall",
  "collectionSlug": "metal",
  "price": 24800,
  "stock": 5,
  "leadDays": 0,
  "tags": [
   "heirloom",
   "best"
  ],
  "images": [],
  "art": {
   "mat": "bidri",
   "shape": "vaseTall",
   "pat": "bidri",
   "bg": "#D9D3C8"
  },
  "region": "Bidar, Karnataka",
  "craft": "Bidriware silver inlay",
  "material": "Zinc-copper alloy, fine silver inlay",
  "dims": "H 34 × Ø 18 cm",
  "weight": 2.1,
  "finish": "Blackened with Bidar fort soil, hand-oiled",
  "care": "Wipe with a soft dry cloth. A drop of coconut oil restores the black.",
  "desc": "Silver vines hammered into a blackened body, a craft that came to the Deccan with the Bahmani court.",
  "craftText": "The vessel is cast, the pattern engraved by hand, and fine silver wire hammered into each groove. The piece is then darkened with a paste of soil from the Bidar fort, which turns the alloy black but leaves the silver bright.",
  "moq": 12,
  "exportReady": true,
  "active": true,
  "sort": 1
 },
 {
  "slug": "moradabad-urli",
  "name": "Hammered brass urli",
  "collectionSlug": "metal",
  "price": 9600,
  "stock": 14,
  "leadDays": 0,
  "tags": [
   "best"
  ],
  "images": [],
  "art": {
   "mat": "brass",
   "shape": "urli",
   "pat": "hammer",
   "bg": "#E3DBCC"
  },
  "region": "Moradabad, Uttar Pradesh",
  "craft": "Hand-hammered brass",
  "material": "Brass",
  "dims": "H 12 × Ø 42 cm",
  "weight": 3.4,
  "finish": "Hand-planished, lacquered against tarnish",
  "care": "Float flowers in water; dry after use. Avoid abrasive cleaners.",
  "desc": "A wide, shallow bowl for floating flowers and candles, beaten from a single sheet.",
  "craftText": "Moradabad has worked brass for four centuries. This urli is raised from one sheet by hand, and every facet on the surface is a single hammer blow.",
  "moq": 24,
  "exportReady": true,
  "active": true,
  "sort": 2
 },
 {
  "slug": "pietra-dura-platter",
  "name": "Pietra dura platter",
  "collectionSlug": "stone",
  "price": 56000,
  "stock": 2,
  "leadDays": 0,
  "tags": [
   "heirloom"
  ],
  "images": [],
  "art": {
   "mat": "marble",
   "shape": "platter",
   "pat": "inlay",
   "bg": "#D6CDBE"
  },
  "region": "Agra, Uttar Pradesh",
  "craft": "Parchin kari stone inlay",
  "material": "Makrana marble; lapis lazuli, carnelian, malachite, mother of pearl",
  "dims": "Ø 45 × H 3 cm",
  "weight": 6.8,
  "finish": "Hand-polished",
  "care": "Wipe with a damp cloth. Keep away from acidic food and cleaners.",
  "desc": "The inlay tradition of the Taj Mahal, set by hand into white Makrana marble.",
  "craftText": "Each petal is cut from a sliver of stone and filed to fit its recess in the marble to a hairline. A single platter holds several hundred pieces and takes weeks to finish.",
  "moq": 5,
  "exportReady": true,
  "active": true,
  "sort": 3
 },
 {
  "slug": "jaali-lantern",
  "name": "Soapstone jaali lantern",
  "collectionSlug": "light",
  "price": 7400,
  "stock": 22,
  "leadDays": 0,
  "tags": [
   "best",
   "new"
  ],
  "images": [],
  "art": {
   "mat": "soap",
   "shape": "lantern",
   "pat": "jaali",
   "bg": "#DCD4C6"
  },
  "region": "Agra, Uttar Pradesh",
  "craft": "Hand-carved jaali",
  "material": "Soapstone",
  "dims": "H 24 × Ø 16 cm",
  "weight": 1.9,
  "finish": "Matte, hand-sanded",
  "care": "For tea lights only. Wipe with a dry cloth.",
  "desc": "A lattice pierced by hand so candlelight falls in a pattern across the room.",
  "craftText": "The jaali is drilled and filed through the stone without a template. The same technique screens the windows of Mughal tombs.",
  "moq": 24,
  "exportReady": true,
  "active": true,
  "sort": 4
 },
 {
  "slug": "marble-pillars",
  "name": "Marble candle pillars, pair",
  "collectionSlug": "light",
  "price": 6200,
  "stock": 18,
  "leadDays": 0,
  "tags": [
   "new"
  ],
  "images": [],
  "art": {
   "mat": "marble",
   "shape": "pillars",
   "pat": "",
   "bg": "#CFC6B6"
  },
  "region": "Makrana, Rajasthan",
  "craft": "Lathe-turned marble",
  "material": "Makrana marble",
  "dims": "H 22 cm and 15 cm × Ø 9 cm",
  "weight": 3.2,
  "finish": "Honed",
  "care": "Wipe with a damp cloth. Seal once a year.",
  "desc": "Two pillars in the white marble of the Taj, turned and honed to a soft finish.",
  "craftText": "Turned on a lathe from single blocks and honed by hand, so the stone keeps a quiet, low sheen.",
  "moq": 20,
  "exportReady": true,
  "active": true,
  "sort": 5
 },
 {
  "slug": "saharanpur-box",
  "name": "Sheesham box with brass inlay",
  "collectionSlug": "wood",
  "price": 8900,
  "stock": 11,
  "leadDays": 0,
  "tags": [
   "best"
  ],
  "images": [],
  "art": {
   "mat": "sheesham",
   "shape": "box",
   "pat": "brassinlay",
   "bg": "#E0D8CA"
  },
  "region": "Saharanpur, Uttar Pradesh",
  "craft": "Wood carving and tarkashi brass inlay",
  "material": "Sheesham (Indian rosewood), brass wire",
  "dims": "H 10 × W 28 × D 18 cm",
  "weight": 1.6,
  "finish": "Hand-rubbed wax",
  "care": "Keep out of direct sun. Wax twice a year.",
  "desc": "A lidded box inlaid with brass wire, lined in raw silk.",
  "craftText": "In tarkashi, fine brass wire is pressed into channels cut in the wood, then sanded flush so metal and grain sit in one surface.",
  "moq": 20,
  "exportReady": true,
  "active": true,
  "sort": 6
 },
 {
  "slug": "walnut-tray",
  "name": "Kashmiri walnut tray",
  "collectionSlug": "wood",
  "price": 12500,
  "stock": 0,
  "leadDays": 28,
  "tags": [
   "new"
  ],
  "images": [],
  "art": {
   "mat": "walnut",
   "shape": "tray",
   "pat": "chinar",
   "bg": "#D8D0C0"
  },
  "region": "Srinagar, Kashmir",
  "craft": "Walnut wood carving",
  "material": "Kashmiri walnut",
  "dims": "W 46 × D 32 × H 4 cm",
  "weight": 1.8,
  "finish": "Natural oil",
  "care": "Wipe clean; do not soak. Oil occasionally.",
  "desc": "Chinar leaves carved in deep relief into a single walnut board.",
  "craftText": "Kashmiri walnut is dense and fine-grained, which lets the carver cut deep undercuts without splitting. Made to order in a Srinagar workshop.",
  "moq": 10,
  "exportReady": true,
  "active": true,
  "sort": 7
 },
 {
  "slug": "pashmina-throw",
  "name": "Pashmina throw",
  "collectionSlug": "textile",
  "price": 42000,
  "stock": 4,
  "leadDays": 0,
  "tags": [
   "heirloom"
  ],
  "images": [],
  "art": {
   "mat": "pashmina",
   "shape": "throw",
   "pat": "paisley",
   "bg": "#DAD2C4"
  },
  "region": "Srinagar, Kashmir",
  "craft": "Hand-spun, hand-woven pashmina",
  "material": "100% Changthangi pashmina",
  "dims": "200 × 100 cm",
  "weight": 0.45,
  "finish": "Hand-knotted fringe",
  "care": "Dry clean only. Store folded with cedar.",
  "desc": "Spun by hand from the fine undercoat of the Changthangi goat and woven on a wooden loom.",
  "craftText": "The fibre is combed from goats in Ladakh, spun on a charkha, and woven on a hand loom. The yarn is too fine for machines to handle without breaking.",
  "moq": 5,
  "exportReady": true,
  "active": true,
  "sort": 8
 },
 {
  "slug": "ajrakh-cushions",
  "name": "Ajrakh cushion covers, set of 2",
  "collectionSlug": "textile",
  "price": 5800,
  "stock": 36,
  "leadDays": 0,
  "tags": [
   "best"
  ],
  "images": [],
  "art": {
   "mat": "ajrakh",
   "shape": "cushion",
   "pat": "ajrakh",
   "bg": "#E2DACB"
  },
  "region": "Kutch, Gujarat",
  "craft": "Ajrakh resist block printing",
  "material": "Cotton, natural indigo and madder",
  "dims": "45 × 45 cm each",
  "weight": 0.4,
  "finish": "Hidden zip",
  "care": "Cold hand wash, dry in shade.",
  "desc": "Printed by hand with carved wooden blocks and dyed in indigo and madder.",
  "craftText": "Ajrakh takes up to sixteen stages of printing, resist and washing. Each colour is a separate pass with a hand-carved block.",
  "moq": 50,
  "exportReady": true,
  "active": true,
  "sort": 9
 },
 {
  "slug": "kantha-quilt",
  "name": "Kantha quilt",
  "collectionSlug": "textile",
  "price": 18900,
  "stock": 6,
  "leadDays": 0,
  "tags": [],
  "images": [],
  "art": {
   "mat": "kantha",
   "shape": "quilt",
   "pat": "kantha",
   "bg": "#DDD5C6"
  },
  "region": "Bolpur, West Bengal",
  "craft": "Kantha running stitch",
  "material": "Layered cotton, hand-stitched",
  "dims": "230 × 150 cm",
  "weight": 1.9,
  "finish": "Hand-hemmed",
  "care": "Gentle cold wash, dry flat.",
  "desc": "Layers of soft cotton held together by tens of thousands of hand stitches.",
  "craftText": "Kantha was first made by stitching old saris together. The running stitch gives the quilt its rippled texture and takes one embroiderer several weeks.",
  "moq": 10,
  "exportReady": true,
  "active": true,
  "sort": 10
 },
 {
  "slug": "nilavilakku",
  "name": "Brass temple lamp",
  "collectionSlug": "light",
  "price": 14200,
  "stock": 9,
  "leadDays": 0,
  "tags": [
   "best"
  ],
  "images": [],
  "art": {
   "mat": "brass",
   "shape": "lamp",
   "pat": "",
   "bg": "#D9D0C0"
  },
  "region": "Mannar, Kerala",
  "craft": "Bell-metal casting",
  "material": "Brass",
  "dims": "H 46 × Ø 16 cm",
  "weight": 3.9,
  "finish": "Hand-polished",
  "care": "Polish with tamarind or a brass cleaner.",
  "desc": "The nilavilakku of Kerala homes, cast in sections and joined by hand.",
  "craftText": "Cast in sand moulds in Mannar, a village known for bell metal, then turned and polished by hand.",
  "moq": 12,
  "exportReady": true,
  "active": true,
  "sort": 11
 },
 {
  "slug": "blue-pottery-vase",
  "name": "Blue pottery vase",
  "collectionSlug": "clay",
  "price": 6900,
  "stock": 12,
  "leadDays": 0,
  "tags": [
   "new"
  ],
  "images": [],
  "art": {
   "mat": "bluepot",
   "shape": "vaseBlue",
   "pat": "blue",
   "bg": "#E1DACD"
  },
  "region": "Jaipur, Rajasthan",
  "craft": "Jaipur blue pottery",
  "material": "Quartz paste, cobalt glaze",
  "dims": "H 28 × Ø 16 cm",
  "weight": 1.2,
  "finish": "Glazed, low-fired",
  "care": "Decorative. Wipe with a damp cloth.",
  "desc": "Painted by hand in cobalt on a quartz body; no clay is used.",
  "craftText": "Blue pottery is made from ground quartz, glass and fuller’s earth rather than clay. It is painted by hand and fired once at low temperature.",
  "moq": 24,
  "exportReady": true,
  "active": true,
  "sort": 12
 },
 {
  "slug": "longpi-bowl",
  "name": "Longpi black bowl",
  "collectionSlug": "clay",
  "price": 4800,
  "stock": 15,
  "leadDays": 0,
  "tags": [
   "new"
  ],
  "images": [],
  "art": {
   "mat": "blackclay",
   "shape": "bowlDeep",
   "pat": "",
   "bg": "#D8D1C4"
  },
  "region": "Ukhrul, Manipur",
  "craft": "Longpi hand-shaped stoneware",
  "material": "Serpentine rock and clay",
  "dims": "H 12 × Ø 22 cm",
  "weight": 1.1,
  "finish": "Burnished with leaves",
  "care": "Food safe. Hand wash.",
  "desc": "Shaped by hand without a wheel and burnished with leaves to a soft black.",
  "craftText": "Longpi potters grind black serpentine rock with clay, shape each piece by hand, fire it, and rub it with local leaves while still hot.",
  "moq": 24,
  "exportReady": true,
  "active": true,
  "sort": 13
 },
 {
  "slug": "copper-kalash",
  "name": "Hammered copper kalash",
  "collectionSlug": "metal",
  "price": 5200,
  "stock": 20,
  "leadDays": 0,
  "tags": [
   "best"
  ],
  "images": [],
  "art": {
   "mat": "copper",
   "shape": "kalash",
   "pat": "hammer",
   "bg": "#E0D7C8"
  },
  "region": "Pune, Maharashtra",
  "craft": "Hand-hammered copper",
  "material": "Copper",
  "dims": "H 22 × Ø 18 cm",
  "weight": 1.3,
  "finish": "Hand-planished",
  "care": "Clean with lemon and salt.",
  "desc": "A water vessel raised from a copper sheet by the tambat smiths of Pune.",
  "craftText": "The Tambat Ali smiths raise each vessel from a flat sheet over steel stakes, annealing it in fire between rounds of hammering.",
  "moq": 24,
  "exportReady": true,
  "active": true,
  "sort": 14
 },
 {
  "slug": "bankura-horse",
  "name": "Bankura horse",
  "collectionSlug": "clay",
  "price": 8400,
  "stock": 0,
  "leadDays": 21,
  "tags": [],
  "images": [],
  "art": {
   "mat": "terra",
   "shape": "horse",
   "pat": "terra",
   "bg": "#DDD4C4"
  },
  "region": "Panchmura, West Bengal",
  "craft": "Bankura terracotta",
  "material": "Terracotta",
  "dims": "H 42 × W 30 × D 12 cm",
  "weight": 2.6,
  "finish": "Fired, natural",
  "care": "Indoor use. Dust gently.",
  "desc": "The long-necked horse of Bengal village shrines, made in parts on the wheel and joined by hand.",
  "craftText": "The body, neck and legs are thrown separately on the wheel, then assembled, burnished and fired in an open kiln.",
  "moq": 10,
  "exportReady": true,
  "active": true,
  "sort": 15
 }
];

export const coupons = [
 { code: 'WELCOME10', type: 'pct', value: 10, min: 5000, label: '10% off your first order' },
 { code: 'HEIRLOOM', type: 'flat', value: 2500, min: 40000, label: '₹2,500 off orders above ₹40,000' }
];
