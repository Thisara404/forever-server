require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Product');

// Product data with R2 URLs
const productsData = [
  {
    legacyId: "aaaaa",
    name: "Women Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 100,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img1.jpg"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["S", "M", "L"],
    date: 1716634345448,
    bestseller: true
  },
  {
    legacyId: "aaaab",
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 200,
    image: [
      "https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img2_1.jpg",
      "https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img2_2.jpg",
      "https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img2_3.jpg",
      "https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img2_4.jpg"
    ],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    date: 1716621345448,
    bestseller: true
  },
  {
    legacyId: "aaaac",
    name: "Girls Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 220,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img3.jpg"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    date: 1716234545448,
    bestseller: true
  },
  {
    legacyId: "aaaad",
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 180,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img4.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  },
  {
    legacyId: "aaaae",
    name: "Women Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 160,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img5.jpg"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    date: 1716634345448,
    bestseller: false
  },
  {
    legacyId: "aaaaf",
    name: "Girls Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 170,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img6.jpg"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    date: 1716234545448,
    bestseller: false
  },
  {
    legacyId: "aaaag",
    name: "Men Tapered Fit Flat-Front Trousers",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 190,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img7.jpg"],
    category: "Men",
    subCategory: "Bottomwear",
    sizes: ["S", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  },
  {
    legacyId: "aaaah",
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 140,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img8.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  },
  {
    legacyId: "aaaai",
    name: "Girls Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 100,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img9.jpg"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    date: 1716234545448,
    bestseller: false
  },
  {
    legacyId: "aaaaj",
    name: "Men Tagged Slim Fit Casual Shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 110,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img10.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  }
];

// Generate additional products from remaining images

// Additional products from uploaded images
const additionalProducts = [
  {
    legacyId: "product11",
    name: "Women Bottomwear Product 11",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 101,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img11.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754142140846,
    bestseller: true
  },
  {
    legacyId: "product12",
    name: "Kids Winterwear Product 12",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 142,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img12.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754142040846,
    bestseller: true
  },
  {
    legacyId: "product13",
    name: "Men Topwear Product 13",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 147,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img13.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141940846,
    bestseller: true
  },
  {
    legacyId: "product14",
    name: "Women Bottomwear Product 14",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 216,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img14.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141840846,
    bestseller: true
  },
  {
    legacyId: "product15",
    name: "Kids Winterwear Product 15",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 217,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img15.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141740846,
    bestseller: true
  },
  {
    legacyId: "product16",
    name: "Men Topwear Product 16",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 165,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img16.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141640846,
    bestseller: false
  },
  {
    legacyId: "product17",
    name: "Women Bottomwear Product 17",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 280,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img17.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141540846,
    bestseller: false
  },
  {
    legacyId: "product18",
    name: "Kids Winterwear Product 18",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 226,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img18.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141440846,
    bestseller: false
  },
  {
    legacyId: "product19",
    name: "Men Topwear Product 19",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 205,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img19.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141340847,
    bestseller: false
  },
  {
    legacyId: "product20",
    name: "Women Bottomwear Product 20",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 183,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img20.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141240847,
    bestseller: false
  },
  {
    legacyId: "product21",
    name: "Kids Winterwear Product 21",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 178,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img21.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141140847,
    bestseller: false
  },
  {
    legacyId: "product22",
    name: "Men Topwear Product 22",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 112,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img22.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754141040847,
    bestseller: false
  },
  {
    legacyId: "product23",
    name: "Women Bottomwear Product 23",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 210,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img23.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140940847,
    bestseller: false
  },
  {
    legacyId: "product24",
    name: "Kids Winterwear Product 24",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 275,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img24.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140840847,
    bestseller: false
  },
  {
    legacyId: "product25",
    name: "Men Topwear Product 25",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 101,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img25.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140740847,
    bestseller: false
  },
  {
    legacyId: "product26",
    name: "Women Bottomwear Product 26",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 207,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img26.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140640847,
    bestseller: false
  },
  {
    legacyId: "product27",
    name: "Kids Winterwear Product 27",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 140,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img27.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140540847,
    bestseller: false
  },
  {
    legacyId: "product28",
    name: "Men Topwear Product 28",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 241,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img28.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140440847,
    bestseller: false
  },
  {
    legacyId: "product29",
    name: "Women Bottomwear Product 29",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 251,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img29.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140340847,
    bestseller: false
  },
  {
    legacyId: "product30",
    name: "Kids Winterwear Product 30",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 163,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img30.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140240847,
    bestseller: false
  },
  {
    legacyId: "product31",
    name: "Men Topwear Product 31",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 197,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img31.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140140847,
    bestseller: false
  },
  {
    legacyId: "product32",
    name: "Women Bottomwear Product 32",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 169,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img32.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754140040847,
    bestseller: false
  },
  {
    legacyId: "product33",
    name: "Kids Winterwear Product 33",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 170,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img33.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139940847,
    bestseller: false
  },
  {
    legacyId: "product34",
    name: "Men Topwear Product 34",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 192,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img34.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139840847,
    bestseller: false
  },
  {
    legacyId: "product35",
    name: "Women Bottomwear Product 35",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 297,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img35.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139740847,
    bestseller: false
  },
  {
    legacyId: "product36",
    name: "Kids Winterwear Product 36",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 219,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img36.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139640847,
    bestseller: false
  },
  {
    legacyId: "product37",
    name: "Men Topwear Product 37",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 191,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img37.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139540847,
    bestseller: false
  },
  {
    legacyId: "product38",
    name: "Women Bottomwear Product 38",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 105,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img38.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139440847,
    bestseller: false
  },
  {
    legacyId: "product39",
    name: "Kids Winterwear Product 39",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 217,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img39.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139340847,
    bestseller: false
  },
  {
    legacyId: "product40",
    name: "Men Topwear Product 40",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 109,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img40.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139240847,
    bestseller: false
  },
  {
    legacyId: "product41",
    name: "Women Bottomwear Product 41",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 278,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img41.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139140847,
    bestseller: false
  },
  {
    legacyId: "product42",
    name: "Kids Winterwear Product 42",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 270,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img42.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754139040847,
    bestseller: false
  },
  {
    legacyId: "product43",
    name: "Men Topwear Product 43",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 191,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img43.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138940847,
    bestseller: false
  },
  {
    legacyId: "product44",
    name: "Women Bottomwear Product 44",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 291,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img44.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138840847,
    bestseller: false
  },
  {
    legacyId: "product45",
    name: "Kids Winterwear Product 45",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 185,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img45.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138740847,
    bestseller: false
  },
  {
    legacyId: "product46",
    name: "Men Topwear Product 46",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 103,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img46.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138640847,
    bestseller: false
  },
  {
    legacyId: "product47",
    name: "Women Bottomwear Product 47",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 158,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img47.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138540847,
    bestseller: false
  },
  {
    legacyId: "product48",
    name: "Kids Winterwear Product 48",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 138,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img48.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138440847,
    bestseller: false
  },
  {
    legacyId: "product49",
    name: "Men Topwear Product 49",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 254,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img49.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138340847,
    bestseller: false
  },
  {
    legacyId: "product50",
    name: "Women Bottomwear Product 50",
    description: "A high-quality women bottomwear with excellent features and comfortable design.",
    price: 117,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img50.jpg"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138240847,
    bestseller: false
  },
  {
    legacyId: "product51",
    name: "Kids Winterwear Product 51",
    description: "A high-quality kids winterwear with excellent features and comfortable design.",
    price: 247,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img51.jpg"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138140847,
    bestseller: false
  },
  {
    legacyId: "product52",
    name: "Men Topwear Product 52",
    description: "A high-quality men topwear with excellent features and comfortable design.",
    price: 117,
    image: ["https://pub-326eb66678484b22b0b533f7876b4e55.r2.dev/products/p_img52.jpg"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1754138040847,
    bestseller: false
  }
];

productsData.push(...additionalProducts);


class DatabaseSeeder {
  constructor() {
    this.totalProducts = 0;
    this.successCount = 0;
    this.failedProducts = [];
  }

  async connectDB() {
    try {
      const conn = await mongoose.connect(process.env.MongoDB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error(`❌ Database connection failed: ${error.message}`);
      return false;
    }
  }

  async clearExistingData() {
    try {
      const deletedCount = await Product.deleteMany({});
      console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing products`);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear existing data:', error.message);
      return false;
    }
  }

  async seedProducts(clearFirst = true) {
    try {
      console.log('🌱 Starting database seeding with R2 images...');
      
      if (clearFirst) {
        const cleared = await this.clearExistingData();
        if (!cleared) return false;
      }

      this.totalProducts = productsData.length;
      console.log(`📦 Processing ${this.totalProducts} products...`);

      const batchSize = 20;
      
      for (let i = 0; i < productsData.length; i += batchSize) {
        const batch = productsData.slice(i, i + batchSize);
        const transformedBatch = [];

        for (const product of batch) {
          try {
            const enhancedProduct = this.generateEnhancedProductData(product);
            transformedBatch.push(enhancedProduct);
          } catch (error) {
            console.error(`⚠️  Failed to transform product ${product.name}:`, error);
            this.failedProducts.push(product.name);
          }
        }

        if (transformedBatch.length > 0) {
          await Product.insertMany(transformedBatch);
          this.successCount += transformedBatch.length;
          
          const progress = ((i + batchSize) / productsData.length * 100).toFixed(1);
          console.log(`📈 Progress: ${this.successCount}/${this.totalProducts} products (${progress}%)`);
        }
      }

      console.log(`✅ Successfully seeded ${this.successCount} products with R2 images!`);
      return true;
    } catch (error) {
      console.error('❌ Seeding process failed:', error);
      return false;
    }
  }

  generateEnhancedProductData(product) {
    const generateStock = (category, bestseller) => {
      const baseStock = bestseller ? 50 : 30;
      const variance = Math.floor(Math.random() * 20) - 10;
      return Math.max(baseStock + variance, 10);
    };

    const enhancePrice = (basePrice, category, subCategory, bestseller) => {
      let multiplier = 1;
      
      if (category === 'Women') multiplier += 0.1;
      if (subCategory === 'Winterwear') multiplier += 0.2;
      if (bestseller) multiplier += 0.15;
      
      return Math.round(basePrice * multiplier);
    };

    const generateTags = (name, category, subCategory) => {
      const baseTags = [name.toLowerCase(), category.toLowerCase(), subCategory.toLowerCase()];
      const additionalTags = ['fashion', 'clothing', 'style'];
      return [...baseTags, ...additionalTags];
    };

    const generateRatingData = (bestseller) => {
      if (bestseller) {
        return {
          rating: 4.0 + Math.random() * 1,
          reviewCount: Math.floor(Math.random() * 50) + 20
        };
      } else {
        return {
          rating: 3.0 + Math.random() * 2,
          reviewCount: Math.floor(Math.random() * 20) + 5
        };
      }
    };

    const { rating, reviewCount } = generateRatingData(product.bestseller);

    return {
      ...product,
      price: enhancePrice(product.price, product.category, product.subCategory, product.bestseller),
      stockQuantity: generateStock(product.category, product.bestseller),
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      tags: generateTags(product.name, product.category, product.subCategory),
      sku: `SKU-${product.legacyId}-${Date.now()}`,
      discount: product.bestseller ? Math.floor(Math.random() * 20) + 5 : 0
    };
  }

  async run() {
    try {
      console.log('🚀 Starting database seeding with R2 images...');
      const connected = await this.connectDB();
      if (!connected) return;
      
      await this.seedProducts();
      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message);
    } finally {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
}

// Export for programmatic use
module.exports = DatabaseSeeder;

// Run if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run();
}
