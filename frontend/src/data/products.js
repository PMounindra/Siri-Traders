// Products data for Siri Traders
// Based on SIRI TRADERS category-wise items list

export const baseProducts = [

  // ===== PULSES & DALS =====
  {
    id: 101,
    name: 'Shreya Gold Toor Dal',
    category: 'pulses',
    brand: 'Shreya Gold',
    weight: '1',
    unit: 'kg',
    price: 145,
    mrp: 165,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1585650860565-a38a82f72ce3?w=400&q=80',
    description: 'Shreya Gold Toor Dal. Premium quality split pigeon peas, rich in protein.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 75 },
      { label: '1 kg', price: 145 },
      { label: '5 kg', price: 700 }
    ]
  },
  {
    id: 102,
    name: '90 Gold Toor Dal',
    category: 'pulses',
    brand: '90 Gold',
    weight: '1',
    unit: 'kg',
    price: 142,
    mrp: 160,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1585650860565-a38a82f72ce3?w=400&q=80',
    description: '90 Gold Toor Dal. Clean and sorted split pigeon peas for daily cooking.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 73 },
      { label: '1 kg', price: 142 },
      { label: '5 kg', price: 690 }
    ]
  },
  {
    id: 103,
    name: 'Vijayalakshmi Urid Gota',
    category: 'pulses',
    brand: 'Vijayalakshmi',
    weight: '1',
    unit: 'kg',
    price: 175,
    mrp: 200,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Vijayalakshmi Urid Gota. Whole black gram, perfect for idli and dosa.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 90 },
      { label: '1 kg', price: 175 },
      { label: '5 kg', price: 840 }
    ]
  },
  {
    id: 104,
    name: 'Shreya Gold Urid Gota',
    category: 'pulses',
    brand: 'Shreya Gold',
    weight: '1',
    unit: 'kg',
    price: 178,
    mrp: 205,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Shreya Gold Urid Gota. Whole black gram for authentic South Indian dishes.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 92 },
      { label: '1 kg', price: 178 },
      { label: '5 kg', price: 855 }
    ]
  },
  {
    id: 105,
    name: 'Lobiya Dal',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 120,
    mrp: 140,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Lobiya Dal (Black Eyed Peas). Nutritious and versatile lentil for curries.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 62 },
      { label: '1 kg', price: 120 },
      { label: '5 kg', price: 575 }
    ]
  },
  {
    id: 106,
    name: 'Ruby Moong Dal',
    category: 'pulses',
    brand: 'Ruby',
    weight: '1',
    unit: 'kg',
    price: 155,
    mrp: 180,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Ruby Moong Dal. Split green gram, light and easy to digest.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 80 },
      { label: '1 kg', price: 155 },
      { label: '5 kg', price: 745 }
    ]
  },
  {
    id: 107,
    name: 'Masoor Dal',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 115,
    mrp: 135,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Masoor Dal (Red Lentils). Quick to cook, rich in iron and protein.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 60 },
      { label: '1 kg', price: 115 },
      { label: '5 kg', price: 545 }
    ]
  },
  {
    id: 108,
    name: 'Urad Dal',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 169,
    mrp: 195,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1585650860565-a38a82f72ce3?w=400&q=80',
    description: 'Urad Dal (Split Black Gram). Essential for dal makhani and idli batter.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 88 },
      { label: '1 kg', price: 169 },
      { label: '5 kg', price: 800 }
    ]
  },
  {
    id: 109,
    name: 'Black Chilaka',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 130,
    mrp: 150,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Black Chilaka. Split black gram used widely in South Indian cooking.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 67 },
      { label: '1 kg', price: 130 }
    ]
  },
  {
    id: 110,
    name: 'Minumulu (Green Moong)',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 140,
    mrp: 160,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Minumulu (Whole Green Moong). Sprout or cook for healthy meals.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 72 },
      { label: '1 kg', price: 140 }
    ]
  },
  {
    id: 111,
    name: 'Chenna (Bengal Gram)',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 125,
    mrp: 145,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Chenna (Roasted Bengal Gram). Used in chutneys, curries and snacks.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 65 },
      { label: '1 kg', price: 125 }
    ]
  },
  {
    id: 112,
    name: 'Moong (Whole)',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 138,
    mrp: 158,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Whole Moong. Ideal for sprouting, khichdi and soups.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 71 },
      { label: '1 kg', price: 138 }
    ]
  },
  {
    id: 113,
    name: 'Moong Chilaka',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 148,
    mrp: 170,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=400&q=80',
    description: 'Moong Chilaka (Split Green Gram with skin). High fibre and nutritious.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 76 },
      { label: '1 kg', price: 148 }
    ]
  },
  {
    id: 114,
    name: 'Putana',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '500',
    unit: 'g',
    price: 55,
    mrp: 65,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Putana (Roasted Chana). Light snack and used in chutneys.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 55 },
      { label: '1 kg', price: 105 }
    ]
  },
  {
    id: 115,
    name: 'Black Ulavalu',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 120,
    mrp: 140,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Black Ulavalu (Black Horse Gram). Rich in protein, used in Andhra cuisine.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 62 },
      { label: '1 kg', price: 120 }
    ]
  },
  {
    id: 116,
    name: 'Brown Ulavalu',
    category: 'pulses',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 118,
    mrp: 138,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Brown Ulavalu (Brown Horse Gram). Nutritious legume, great for rasam.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 61 },
      { label: '1 kg', price: 118 }
    ]
  },

  // ===== RICE & BASMATI =====
  {
    id: 201,
    name: 'Dawat Lovely Gold Biryani Rice',
    category: 'rice',
    brand: 'Daawat',
    weight: '5',
    unit: 'kg',
    price: 420,
    mrp: 490,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    description: 'Daawat Lovely Gold Biryani Rice. Long grain basmati, perfect for biryani.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '1 kg', price: 90 },
      { label: '5 kg', price: 420 },
      { label: '10 kg', price: 810 }
    ]
  },
  {
    id: 202,
    name: 'Gokul Roza Basmati Rice',
    category: 'rice',
    brand: 'Gokul',
    weight: '5',
    unit: 'kg',
    price: 399,
    mrp: 460,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b24e?w=400&q=80',
    description: 'Gokul Roza Basmati Rice. Aged long grain basmati with natural aroma.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 kg', price: 85 },
      { label: '5 kg', price: 399 },
      { label: '10 kg', price: 770 }
    ]
  },
  {
    id: 203,
    name: 'Mogul Basmati Rice',
    category: 'rice',
    brand: 'Mogul',
    weight: '5',
    unit: 'kg',
    price: 410,
    mrp: 475,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Mogul Basmati Rice. Premium aged basmati, fluffy and fragrant.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 kg', price: 88 },
      { label: '5 kg', price: 410 },
      { label: '10 kg', price: 790 }
    ]
  },

  // ===== WHEAT, ATTA & FLOUR =====
  {
    id: 301,
    name: 'Wheat',
    category: 'atta',
    brand: 'Siri Traders',
    weight: '5',
    unit: 'kg',
    price: 195,
    mrp: 225,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Premium quality whole wheat grain. Fresh and clean.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 kg', price: 42 },
      { label: '5 kg', price: 195 },
      { label: '10 kg', price: 375 }
    ]
  },
  {
    id: 302,
    name: 'Poori Pindi',
    category: 'atta',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 58,
    mrp: 68,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Poori Pindi (Wheat Flour for Puri). Soft and fluffy pooris every time.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 kg', price: 58 },
      { label: '5 kg', price: 270 }
    ]
  },
  {
    id: 303,
    name: 'Chakki Atta',
    category: 'atta',
    brand: 'Siri Traders',
    weight: '5',
    unit: 'kg',
    price: 240,
    mrp: 275,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Fresh Chakki Atta. Stone ground whole wheat flour for soft rotis.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '1 kg', price: 52 },
      { label: '5 kg', price: 240 },
      { label: '10 kg', price: 460 }
    ]
  },
  {
    id: 304,
    name: 'Aashirvaad Atta 1kg',
    category: 'atta',
    brand: 'Aashirvaad',
    weight: '1',
    unit: 'kg',
    price: 62,
    mrp: 72,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Aashirvaad Select Sharbatti Atta 1kg. Softest rotis every time.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 305,
    name: 'Aashirvaad Atta 5kg',
    category: 'atta',
    brand: 'Aashirvaad',
    weight: '5',
    unit: 'kg',
    price: 279,
    mrp: 310,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Aashirvaad Select Sharbatti Atta 5kg. The most trusted atta brand.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true
  },
  {
    id: 306,
    name: 'Shalimar Maida',
    category: 'atta',
    brand: 'Shalimar',
    weight: '1',
    unit: 'kg',
    price: 48,
    mrp: 56,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Shalimar Maida. Fine refined wheat flour for baking and frying.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 kg', price: 48 },
      { label: '5 kg', price: 220 }
    ]
  },
  {
    id: 307,
    name: 'Sivatara Maida',
    category: 'atta',
    brand: 'Sivatara',
    weight: '1',
    unit: 'kg',
    price: 46,
    mrp: 54,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Sivatara Maida. Smooth refined flour perfect for soft puris and halwa.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 kg', price: 46 },
      { label: '5 kg', price: 215 }
    ]
  },
  {
    id: 308,
    name: 'Cornflour',
    category: 'atta',
    brand: 'Siri Traders',
    weight: '500',
    unit: 'g',
    price: 65,
    mrp: 75,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Cornflour. Fine corn starch for gravies, soups and baking.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 30 },
      { label: '500 g', price: 65 }
    ]
  },

  // ===== RAVVA & POHA =====
  {
    id: 401,
    name: 'Lalitha Idly Ravva',
    category: 'ravva-poha',
    brand: 'Sri Lalitha',
    weight: '1',
    unit: 'kg',
    price: 68,
    mrp: 80,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b24e?w=400&q=80',
    description: 'Sri Lalitha Idly Ravva. Coarse semolina specially made for soft idlis.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 36 },
      { label: '1 kg', price: 68 },
      { label: '5 kg', price: 325 }
    ]
  },
  {
    id: 402,
    name: 'Kesari Goduma Ravva',
    category: 'ravva-poha',
    brand: 'Kesari',
    weight: '1',
    unit: 'kg',
    price: 62,
    mrp: 72,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b24e?w=400&q=80',
    description: 'Kesari Goduma Ravva (Wheat Semolina). Perfect for upma and halwa.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 33 },
      { label: '1 kg', price: 62 }
    ]
  },
  {
    id: 403,
    name: 'Upma Ravva White',
    category: 'ravva-poha',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 58,
    mrp: 68,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b24e?w=400&q=80',
    description: 'Upma Ravva White (Bombay Ravva). Fine semolina for fluffy upma.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 30 },
      { label: '1 kg', price: 58 }
    ]
  },
  {
    id: 404,
    name: 'Mota Poha',
    category: 'ravva-poha',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 65,
    mrp: 75,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Mota Poha (Thick Flattened Rice). Great for poha breakfast and chivda.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 34 },
      { label: '1 kg', price: 65 }
    ]
  },
  {
    id: 405,
    name: 'Paper Poha',
    category: 'ravva-poha',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 68,
    mrp: 78,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Paper Poha (Thin Flattened Rice). Light and crispy, ideal for snacks.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 35 },
      { label: '1 kg', price: 68 }
    ]
  },
  {
    id: 406,
    name: 'Sabudana',
    category: 'ravva-poha',
    brand: 'Siri Traders',
    weight: '500',
    unit: 'g',
    price: 72,
    mrp: 85,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Sabudana (Tapioca Pearls). Used for vrat recipes, khichdi and papad.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 32 },
      { label: '500 g', price: 72 },
      { label: '1 kg', price: 138 }
    ]
  },

  // ===== SPICES & MASALA =====
  {
    id: 501,
    name: 'Jeera (Cumin Seeds)',
    category: 'masala',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 85,
    mrp: 100,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Jeera (Cumin Seeds). Whole cumin seeds for tempering and flavouring.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '100 g', price: 45 },
      { label: '200 g', price: 85 },
      { label: '500 g', price: 200 }
    ]
  },
  {
    id: 502,
    name: 'Dhaniya (Coriander)',
    category: 'masala',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 48,
    mrp: 58,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Dhaniya (Coriander Seeds/Powder). Fresh and aromatic for every curry.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '100 g', price: 26 },
      { label: '200 g', price: 48 },
      { label: '500 g', price: 115 }
    ]
  },
  {
    id: 503,
    name: 'Dry Mirchi',
    category: 'masala',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 55,
    mrp: 65,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Dry Red Chillies. Whole dried red chillies for authentic spicy dishes.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '100 g', price: 30 },
      { label: '200 g', price: 55 },
      { label: '500 g', price: 130 }
    ]
  },
  {
    id: 504,
    name: 'Loose Karam No.1',
    category: 'masala',
    brand: 'Siri Traders',
    weight: '500',
    unit: 'g',
    price: 95,
    mrp: 110,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Loose Karam No.1 (Without Salt). Pure red chilli powder blend without salt.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '200 g', price: 42 },
      { label: '500 g', price: 95 },
      { label: '1 kg', price: 180 }
    ]
  },
  {
    id: 505,
    name: 'Ilachi (Cardamom)',
    category: 'masala',
    brand: 'Siri Traders',
    weight: '100',
    unit: 'g',
    price: 185,
    mrp: 220,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Ilachi (Green Cardamom). Premium quality whole cardamom pods.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '50 g', price: 98 },
      { label: '100 g', price: 185 }
    ]
  },
  {
    id: 506,
    name: 'Lavang (Cloves)',
    category: 'masala',
    brand: 'Siri Traders',
    weight: '100',
    unit: 'g',
    price: 155,
    mrp: 180,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Lavang (Cloves). Whole cloves with intense aroma for biryani and masala.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '50 g', price: 80 },
      { label: '100 g', price: 155 }
    ]
  },
  {
    id: 507,
    name: 'Garlic No.1',
    category: 'masala',
    brand: 'Farm Fresh',
    weight: '500',
    unit: 'g',
    price: 75,
    mrp: 90,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
    description: 'Garlic No.1. Fresh premium garlic, bold flavour for everyday cooking.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '250 g', price: 40 },
      { label: '500 g', price: 75 },
      { label: '1 kg', price: 145 }
    ]
  },
  {
    id: 508,
    name: 'Heera Allam Paste 1kg',
    category: 'masala',
    brand: 'Heera',
    weight: '1',
    unit: 'kg',
    price: 145,
    mrp: 170,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
    description: 'Heera Allam Paste 1kg. Ready to use ginger paste, saves time in cooking.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 509,
    name: 'Heera Allam Paste 500g',
    category: 'masala',
    brand: 'Heera',
    weight: '500',
    unit: 'g',
    price: 78,
    mrp: 92,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
    description: 'Heera Allam Paste 500g. Fresh ginger paste, convenient and flavourful.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 510,
    name: 'Heera Allam Paste 200g',
    category: 'masala',
    brand: 'Heera',
    weight: '200',
    unit: 'g',
    price: 35,
    mrp: 42,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
    description: 'Heera Allam Paste 200g. Small pack fresh ginger paste for daily use.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== OILS =====
  {
    id: 601,
    name: 'Tulasi Pooja Oil',
    category: 'oils',
    brand: 'Tulasi',
    weight: '1',
    unit: 'L',
    price: 125,
    mrp: 145,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Tulasi Pooja Oil. Pure oil for pooja lamps and religious rituals.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 602,
    name: 'Anurag Pooja Oil',
    category: 'oils',
    brand: 'Anurag',
    weight: '1',
    unit: 'L',
    price: 120,
    mrp: 140,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Anurag Pooja Oil. Pure oil for diyas and religious purposes.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 603,
    name: 'Gold Drop Oil 1 Litre',
    category: 'oils',
    brand: 'Gold Drop',
    weight: '1',
    unit: 'L',
    price: 145,
    mrp: 168,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Gold Drop Refined Oil 1L. Light and healthy cooking oil.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true
  },
  {
    id: 604,
    name: 'Gold Drop Oil 5 Litres',
    category: 'oils',
    brand: 'Gold Drop',
    weight: '5',
    unit: 'L',
    price: 695,
    mrp: 800,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Gold Drop Refined Oil 5L. Economy pack for regular family use.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true
  },
  {
    id: 605,
    name: 'Gold Drop Oil 15 Litres',
    category: 'oils',
    brand: 'Gold Drop',
    weight: '15',
    unit: 'L',
    price: 1980,
    mrp: 2280,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Gold Drop Refined Oil 15L. Bulk pack for restaurants and large families.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 606,
    name: 'Freedom Oil 1 Litre',
    category: 'oils',
    brand: 'Freedom',
    weight: '1',
    unit: 'L',
    price: 148,
    mrp: 170,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Freedom Refined Sunflower Oil 1L. Rich in Vitamin E, heart healthy.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 607,
    name: 'Freedom Oil 5 Litres',
    category: 'oils',
    brand: 'Freedom',
    weight: '5',
    unit: 'L',
    price: 710,
    mrp: 820,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Freedom Refined Sunflower Oil 5L. Family pack with great savings.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 608,
    name: 'Freedom Oil 15 Litres',
    category: 'oils',
    brand: 'Freedom',
    weight: '15',
    unit: 'L',
    price: 2050,
    mrp: 2350,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Freedom Refined Sunflower Oil 15L. Best value bulk pack.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 609,
    name: 'Freedom Rice Bran Oil 1L',
    category: 'oils',
    brand: 'Freedom',
    weight: '1',
    unit: 'L',
    price: 165,
    mrp: 190,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Freedom Rice Bran Oil 1L. High smoke point, ideal for frying.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false
  },
  {
    id: 610,
    name: 'Vijaya Palli Oil 1 Litre',
    category: 'oils',
    brand: 'Vijaya',
    weight: '1',
    unit: 'L',
    price: 195,
    mrp: 225,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Vijaya Palli Oil (Groundnut Oil) 1L. Cold pressed for authentic taste.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true
  },
  {
    id: 611,
    name: 'Alpha Palm Oil',
    category: 'oils',
    brand: 'Alpha',
    weight: '1',
    unit: 'L',
    price: 115,
    mrp: 135,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Alpha Palm Oil. Pure refined palm oil for cooking and frying.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 L', price: 115 },
      { label: '5 L', price: 550 }
    ]
  },

  // ===== NUTS, SEEDS & DRY FRUITS =====
  {
    id: 701,
    name: 'Badam (Almonds)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 220,
    mrp: 260,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Badam (Almonds). Premium quality almonds, rich in vitamin E and protein.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '200 g', price: 220 },
      { label: '500 g', price: 520 },
      { label: '1 kg', price: 980 }
    ]
  },
  {
    id: 702,
    name: 'Kaju 2 Piece (Cashews)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 255,
    mrp: 300,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Kaju 2 Piece (Cashew Halves). Creamy cashews perfect for sweets and curries.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '200 g', price: 255 },
      { label: '500 g', price: 600 },
      { label: '1 kg', price: 1150 }
    ]
  },
  {
    id: 703,
    name: 'Kaju Gundu (Whole Cashews)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 280,
    mrp: 330,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Kaju Gundu (Whole Cashews). Premium whole cashews for gifting and snacking.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 280 },
      { label: '500 g', price: 650 }
    ]
  },
  {
    id: 704,
    name: 'Green Kismiss (Raisins)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 95,
    mrp: 115,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Green Kismiss (Green Raisins). Sweet and tangy, great in desserts and snacks.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 95 },
      { label: '500 g', price: 225 }
    ]
  },
  {
    id: 705,
    name: 'Black Kismiss (Raisins)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 88,
    mrp: 105,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Black Kismiss (Black Raisins). Dark sweet raisins for kheer and pulao.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 88 },
      { label: '500 g', price: 210 }
    ]
  },
  {
    id: 706,
    name: 'Walnuts',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 185,
    mrp: 220,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Walnuts. Premium quality walnuts rich in omega-3 fatty acids.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 185 },
      { label: '500 g', price: 435 }
    ]
  },
  {
    id: 707,
    name: 'Anjeera (Dried Figs)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 145,
    mrp: 170,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Anjeera (Dried Figs). Naturally sweet and nutritious dry figs.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 145 },
      { label: '500 g', price: 340 }
    ]
  },
  {
    id: 708,
    name: 'Sunflower Seeds',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 75,
    mrp: 90,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Sunflower Seeds. Raw seeds, high in vitamin E and healthy fats.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 75 },
      { label: '500 g', price: 175 }
    ]
  },
  {
    id: 709,
    name: 'Pumpkin Seeds',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 85,
    mrp: 100,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Pumpkin Seeds. Rich in zinc and magnesium, great as a healthy snack.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 85 },
      { label: '500 g', price: 200 }
    ]
  },
  {
    id: 710,
    name: 'Sabja Seeds (Basil Seeds)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '100',
    unit: 'g',
    price: 55,
    mrp: 65,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Sabja Seeds (Basil Seeds). Used in falooda and cooling summer drinks.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '100 g', price: 55 },
      { label: '200 g', price: 105 }
    ]
  },
  {
    id: 711,
    name: 'Chiya Seeds (Chia Seeds)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 120,
    mrp: 145,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Chia Seeds. Superfood rich in fibre, omega-3 and antioxidants.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 120 },
      { label: '500 g', price: 280 }
    ]
  },
  {
    id: 712,
    name: 'Flax Seeds',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 65,
    mrp: 78,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Flax Seeds (Alsi). High in omega-3 fatty acids and lignans.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 65 },
      { label: '500 g', price: 155 }
    ]
  },
  {
    id: 713,
    name: 'Tarbuja Seeds (Watermelon Seeds)',
    category: 'nuts-dry-fruits',
    brand: 'Siri Traders',
    weight: '100',
    unit: 'g',
    price: 48,
    mrp: 58,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80',
    description: 'Tarbuja Seeds (Watermelon Seeds). Nutritious seeds, great roasted as a snack.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '100 g', price: 48 },
      { label: '200 g', price: 92 }
    ]
  },

  // ===== MILLETS & HEALTHY GRAINS =====
  {
    id: 801,
    name: 'Korralu (Foxtail Millet)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 95,
    mrp: 115,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Korralu (Foxtail Millet). Nutritious ancient grain, gluten-free and high in fibre.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 50 },
      { label: '1 kg', price: 95 }
    ]
  },
  {
    id: 802,
    name: 'Andu Korralu (Barnyard Millet)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 105,
    mrp: 125,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Andu Korralu (Barnyard Millet). Low glycaemic index, ideal for diabetics.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 55 },
      { label: '1 kg', price: 105 }
    ]
  },
  {
    id: 803,
    name: 'Sajjalu (Pearl Millet)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 78,
    mrp: 92,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Sajjalu (Pearl Millet / Bajra). High iron content, great for rotis.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 42 },
      { label: '1 kg', price: 78 }
    ]
  },
  {
    id: 804,
    name: 'Yellow Jawari (Sorghum)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 72,
    mrp: 85,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Yellow Jawari (Jowar). Gluten-free grain, good for bhakri and porridge.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 38 },
      { label: '1 kg', price: 72 }
    ]
  },
  {
    id: 805,
    name: 'White Javari (Sorghum)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 74,
    mrp: 87,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'White Javari (Jowar). Light coloured sorghum for rotis and khichdi.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 39 },
      { label: '1 kg', price: 74 }
    ]
  },
  {
    id: 806,
    name: 'Udalu (Black Gram Millet)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 88,
    mrp: 105,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Udalu. Traditional grain used in Andhra cooking and porridge.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 46 },
      { label: '1 kg', price: 88 }
    ]
  },
  {
    id: 807,
    name: 'Samelu (Little Millet)',
    category: 'millets',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 110,
    mrp: 130,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
    description: 'Samelu (Little Millet / Samai). Tiny nutritious millet for healthy meals.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 58 },
      { label: '1 kg', price: 110 }
    ]
  },

  // ===== GROCERY ESSENTIALS =====
  {
    id: 901,
    name: 'Sugar',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 48,
    mrp: 55,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Sugar. Fine white crystal sugar for everyday use.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '1 kg', price: 48 },
      { label: '5 kg', price: 228 }
    ]
  },
  {
    id: 902,
    name: 'White Till (Sesame Seeds)',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 62,
    mrp: 74,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'White Till (White Sesame Seeds). Used in chutneys, ladoos and cooking.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 62 },
      { label: '500 g', price: 145 }
    ]
  },
  {
    id: 903,
    name: 'Avalu Rai Small (Mustard Seeds)',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 38,
    mrp: 46,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Avalu Rai Small (Small Mustard Seeds). Essential for South Indian tempering.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 38 },
      { label: '500 g', price: 88 }
    ]
  },
  {
    id: 904,
    name: 'Avalu Rai Big (Mustard Seeds)',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 42,
    mrp: 50,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Avalu Rai Big (Large Mustard Seeds). Bold flavour for pickles and tempering.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 42 },
      { label: '500 g', price: 98 }
    ]
  },
  {
    id: 905,
    name: 'Soyabin (Soybean)',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '1',
    unit: 'kg',
    price: 85,
    mrp: 100,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Soyabin (Whole Soybean). High protein legume for curries and sprouts.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 45 },
      { label: '1 kg', price: 85 }
    ]
  },
  {
    id: 906,
    name: 'Misri (Rock Sugar)',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '200',
    unit: 'g',
    price: 45,
    mrp: 55,
    discount: 18,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Misri (Rock Sugar / Kalkandu). Used in puja and as a natural sweetener.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 45 },
      { label: '500 g', price: 105 }
    ]
  },
  {
    id: 907,
    name: 'Gottalu (Puffed Lotus Seeds)',
    category: 'grocery-essentials',
    brand: 'Siri Traders',
    weight: '100',
    unit: 'g',
    price: 65,
    mrp: 80,
    discount: 19,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Gottalu (Makhana / Fox Nuts). Light and nutritious, great for fasting snacks.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '100 g', price: 65 },
      { label: '200 g', price: 125 }
    ]
  },
  {
    id: 908,
    name: 'Kisan Zam (Tamarind)',
    category: 'grocery-essentials',
    brand: 'Kisan',
    weight: '200',
    unit: 'g',
    price: 35,
    mrp: 42,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    description: 'Kisan Zam (Tamarind Paste). Ready to use tamarind for chutneys and rasam.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 35 },
      { label: '500 g', price: 82 }
    ]
  },

  // ===== PALLI & SNACKS =====
  {
    id: 1001,
    name: 'Disco Palli No.1 (Groundnuts)',
    category: 'snacks-munchies',
    brand: 'Disco',
    weight: '500',
    unit: 'g',
    price: 65,
    mrp: 78,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
    description: 'Disco Palli No.1. Premium roasted groundnuts, crunchy and flavourful.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '200 g', price: 28 },
      { label: '500 g', price: 65 }
    ]
  },
  {
    id: 1002,
    name: 'Fry Palli (Chutney Palli)',
    category: 'snacks-munchies',
    brand: 'Siri Traders',
    weight: '500',
    unit: 'g',
    price: 72,
    mrp: 85,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
    description: 'Fry Palli (Chutney Groundnuts). Fried groundnuts perfect for chutneys.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 32 },
      { label: '500 g', price: 72 }
    ]
  },
  {
    id: 1003,
    name: 'Kannaya Brand Murmura',
    category: 'snacks-munchies',
    brand: 'Kannaya',
    weight: '500',
    unit: 'g',
    price: 38,
    mrp: 48,
    discount: 21,
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
    description: 'Kannaya Brand Murmura (Puffed Rice). Crispy puffed rice for bhel and chaat.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 18 },
      { label: '500 g', price: 38 }
    ]
  },
  {
    id: 1004,
    name: 'Salt Murmura',
    category: 'snacks-munchies',
    brand: 'Siri Traders',
    weight: '500',
    unit: 'g',
    price: 40,
    mrp: 50,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
    description: 'Salt Murmura. Salted puffed rice, a light and crispy snack.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 18 },
      { label: '500 g', price: 40 }
    ]
  },
  {
    id: 1005,
    name: 'Bread',
    category: 'snacks-munchies',
    brand: 'Local Bakery',
    weight: '400',
    unit: 'g',
    price: 40,
    mrp: 45,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=400&q=80',
    description: 'Fresh White Bread. Soft and fresh bread for sandwiches and toast.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== HOME CARE & CLEANING =====
  {
    id: 1101,
    name: 'Vim Bar ₹5',
    category: 'cleaning-household',
    brand: 'Vim',
    weight: '1',
    unit: 'pc',
    price: 5,
    mrp: 5,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    description: 'Vim Dishwash Bar ₹5. Small pack for quick dishwashing.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 1102,
    name: 'Vim Bar ₹10',
    category: 'cleaning-household',
    brand: 'Vim',
    weight: '1',
    unit: 'pc',
    price: 10,
    mrp: 10,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    description: 'Vim Dishwash Bar ₹10. Medium pack, fast grease removal.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 1103,
    name: 'Vim Liquid ₹15',
    category: 'cleaning-household',
    brand: 'Vim',
    weight: '1',
    unit: 'pc',
    price: 15,
    mrp: 15,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    description: 'Vim Dishwash Liquid ₹15. Lemon scented liquid for easy dishwashing.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 1104,
    name: 'Vim Liquid ₹25',
    category: 'cleaning-household',
    brand: 'Vim',
    weight: '1',
    unit: 'pc',
    price: 25,
    mrp: 25,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    description: 'Vim Dishwash Liquid ₹25. Value pack with 2x grease removal power.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 1105,
    name: 'Vim Liquid ₹55',
    category: 'cleaning-household',
    brand: 'Vim',
    weight: '1',
    unit: 'pc',
    price: 55,
    mrp: 55,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    description: 'Vim Dishwash Liquid ₹55. Large bottle for daily household use.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 1106,
    name: 'Comfort ₹4',
    category: 'cleaning-household',
    brand: 'Comfort',
    weight: '1',
    unit: 'pc',
    price: 4,
    mrp: 4,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    description: 'Comfort Fabric Softener ₹4. Keeps clothes soft and fresh smelling.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== INSTANT FOOD =====
  {
    id: 1201,
    name: 'Maggi Noodles',
    category: 'instant-frozen',
    brand: 'Maggi',
    weight: '280',
    unit: 'g',
    price: 56,
    mrp: 60,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80',
    description: 'Maggi Masala 2-Minute Noodles. Pack of 4, ready in 2 minutes.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '70 g (1 pack)', price: 14 },
      { label: '280 g (4 pack)', price: 56 }
    ]
  },
  {
    id: 1202,
    name: 'Yippee Noodles',
    category: 'instant-frozen',
    brand: 'Sunfeast',
    weight: '280',
    unit: 'g',
    price: 52,
    mrp: 56,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80',
    description: 'Sunfeast Yippee Magic Masala Noodles. Long slurpy noodles with rich masala.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '70 g (1 pack)', price: 13 },
      { label: '280 g (4 pack)', price: 52 }
    ]
  },

  // ===== DAIRY PRODUCTS =====
  {
    id: 1301,
    name: 'Aarogya Milk',
    category: 'dairy-breakfast',
    brand: 'Aarogya',
    weight: '1',
    unit: 'L',
    price: 58,
    mrp: 62,
    discount: 6,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    description: 'Aarogya Toned Milk. Fresh, pasteurized and nutritious for daily use.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '500 ml', price: 30 },
      { label: '1 L', price: 58 }
    ]
  },
  {
    id: 1302,
    name: 'Aarogya Curd',
    category: 'dairy-breakfast',
    brand: 'Aarogya',
    weight: '400',
    unit: 'g',
    price: 36,
    mrp: 42,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    description: 'Aarogya Fresh Curd. Creamy and thick curd made from fresh milk.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '200 g', price: 20 },
      { label: '400 g', price: 36 }
    ]
  },

  // ===== FRUITS (unchanged from notebook — no fruits listed, keep existing) =====
  {
    id: 1,
    name: 'Fresh Bananas',
    category: 'fruits',
    brand: 'Farm Fresh',
    weight: '1',
    unit: 'dozen',
    price: 45,
    mrp: 60,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
    description: 'Fresh and ripe bananas sourced from local farms.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 5,
    name: 'Shimla Apples',
    category: 'fruits',
    brand: 'Farm Fresh',
    weight: '4',
    unit: 'pcs',
    price: 120,
    mrp: 160,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
    description: 'Premium Shimla apples. Crisp, sweet and loaded with nutrients.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 8,
    name: 'Pomegranate',
    category: 'fruits',
    brand: 'Farm Fresh',
    weight: '2',
    unit: 'pcs',
    price: 90,
    mrp: 120,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
    description: 'Juicy pomegranates packed with antioxidants.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== VEGETABLES (unchanged — no vegetables listed in notebook) =====
  {
    id: 2,
    name: 'Red Onions',
    category: 'vegetables',
    brand: 'Farm Fresh',
    weight: '1',
    unit: 'kg',
    price: 35,
    mrp: 45,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80',
    description: 'Premium quality red onions. Essential for every Indian kitchen.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 3,
    name: 'Fresh Tomatoes',
    category: 'vegetables',
    brand: 'Farm Fresh',
    weight: '500',
    unit: 'g',
    price: 25,
    mrp: 35,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
    description: 'Juicy and fresh tomatoes perfect for curries, salads and chutneys.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 6,
    name: 'Fresh Potatoes',
    category: 'vegetables',
    brand: 'Farm Fresh',
    weight: '1',
    unit: 'kg',
    price: 30,
    mrp: 40,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    description: 'Fresh potatoes ideal for all types of cooking.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 7,
    name: 'Carrots',
    category: 'vegetables',
    brand: 'Farm Fresh',
    weight: '500',
    unit: 'g',
    price: 35,
    mrp: 45,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
    description: 'Fresh orange carrots. Rich in beta carotene and vitamin A.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== BEVERAGES (unchanged — not in notebook) =====
  {
    id: 21,
    name: 'Coca-Cola',
    category: 'beverages',
    brand: 'Coca-Cola',
    weight: '750',
    unit: 'ml',
    price: 38,
    mrp: 40,
    discount: 5,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80',
    description: 'Coca-Cola Original. Taste the feeling.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 22,
    name: 'Real Mixed Fruit Juice',
    category: 'beverages',
    brand: 'Real',
    weight: '1',
    unit: 'L',
    price: 99,
    mrp: 120,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
    description: 'Real Fruit Power Mixed Fruit Juice. No added sugar.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 23,
    name: 'Tata Tea Gold',
    category: 'beverages',
    brand: 'Tata',
    weight: '500',
    unit: 'g',
    price: 275,
    mrp: 310,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
    description: 'Tata Tea Gold. 15% long leaves for a richer taste.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 24,
    name: 'Nescafe Classic',
    category: 'beverages',
    brand: 'Nescafe',
    weight: '100',
    unit: 'g',
    price: 235,
    mrp: 260,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
    description: 'Nescafe Classic Instant Coffee. 100% pure coffee.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 25,
    name: 'Bisleri Water',
    category: 'beverages',
    brand: 'Bisleri',
    weight: '1',
    unit: 'L',
    price: 20,
    mrp: 20,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80',
    description: 'Bisleri Mineral Water. Purest form of hydration.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== BAKERY & BISCUITS (unchanged — not in notebook) =====
  {
    id: 26,
    name: 'Britannia Good Day',
    category: 'bakery-biscuits',
    brand: 'Britannia',
    weight: '800',
    unit: 'g',
    price: 45,
    mrp: 50,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
    description: 'Britannia Good Day Cashew Cookies.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 27,
    name: 'Parle-G 800g',
    category: 'bakery-biscuits',
    brand: 'Parle',
    weight: '800',
    unit: 'g',
    price: 22,
    mrp: 25,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    description: 'Parle-G Original Glucose Biscuits.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 28,
    name: 'Cake Rusk',
    category: 'bakery-biscuits',
    brand: 'Britannia',
    weight: '300',
    unit: 'g',
    price: 55,
    mrp: 60,
    discount: 8,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    description: 'Britannia Cake Rusk. Perfect with your evening chai.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 29,
    name: 'Pav Buns',
    category: 'bakery-biscuits',
    brand: 'Local Bakery',
    weight: '6',
    unit: 'pcs',
    price: 30,
    mrp: 35,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1586444248879-bc604cbd555a?w=400&q=80',
    description: 'Fresh and soft pav buns for pav bhaji and vada pav.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 30,
    name: 'Oreo Biscuits',
    category: 'bakery-biscuits',
    brand: 'Cadbury',
    weight: '120',
    unit: 'g',
    price: 30,
    mrp: 30,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&q=80',
    description: 'Cadbury Oreo Vanilla Creme Biscuits.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== PERSONAL CARE (unchanged — not in notebook) =====
  {
    id: 31,
    name: 'Dove Soap',
    category: 'personal-care',
    brand: 'Dove',
    weight: '100',
    unit: 'g',
    price: 52,
    mrp: 59,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80',
    description: 'Dove Beauty Bar. 1/4 moisturizing cream.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 32,
    name: 'Colgate MaxFresh',
    category: 'personal-care',
    brand: 'Colgate',
    weight: '150',
    unit: 'g',
    price: 98,
    mrp: 115,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1628359355624-855775b5c9c4?w=400&q=80',
    description: 'Colgate MaxFresh Toothpaste with cooling crystals.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 33,
    name: 'Head & Shoulders',
    category: 'personal-care',
    brand: 'Head & Shoulders',
    weight: '340',
    unit: 'ml',
    price: 299,
    mrp: 350,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80',
    description: 'Head & Shoulders Anti-Dandruff Shampoo.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 34,
    name: 'Dettol Handwash',
    category: 'personal-care',
    brand: 'Dettol',
    weight: '200',
    unit: 'ml',
    price: 45,
    mrp: 52,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9e?w=400&q=80',
    description: 'Dettol Original Liquid Handwash. Trusted protection.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 35,
    name: 'Vaseline Body Lotion',
    category: 'personal-care',
    brand: 'Vaseline',
    weight: '200',
    unit: 'ml',
    price: 175,
    mrp: 210,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80',
    description: 'Vaseline Intensive Care Deep Moisture Body Lotion.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  }
];

export const ADMIN_PRODUCTS_KEY = 'siri-admin-products';

const readAdminRetailProducts = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(ADMIN_PRODUCTS_RETAIL_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const readAdminWholesaleProducts = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(ADMIN_PRODUCTS_WHOLESALE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const mergeCatalog = (catalog, adminProducts = []) => {
  const catalogById = new Map(catalog.map(p => [String(p.id), p]));
  const adminIds = new Set(adminProducts.map(p => String(p.id)));
  const normalizedAdmin = adminProducts.map(p => ({
    ...catalogById.get(String(p.id)),
    ...p
  }));
  return [...normalizedAdmin, ...catalog.filter(p => !adminIds.has(String(p.id)))];
};

/* ── Helper: build bulk variants for wholesale ── */
const buildBulkVariants = (product) => {
  const baseVariant = { label: `${product.weight} ${product.unit}`, price: product.price };
  const match = product.weight.match(/^([\d.]+)\s*$/);
  if (!match) {
    // If complex label, return defaults
    return [
      baseVariant,
      { label: 'Bulk pack', price: Math.max(1, Math.round(product.price * 8 * 0.92)) },
      { label: 'Wholesale case', price: Math.max(1, Math.round(product.price * 16 * 0.88)) }
    ];
  }
  const amount = Number(match[1]);
  const unit = product.unit.toLowerCase();
  const perUnit = baseVariant.price / amount;
  const fiveLabel = unit === 'kg' ? '5 kg bulk' : '5 L bulk';
  const tenLabel = unit === 'kg' ? '10 kg bulk' : '10 L bulk';
  return [
    baseVariant,
    { label: fiveLabel, price: Math.max(1, Math.round(perUnit * 5 * 0.94)) },
    { label: tenLabel, price: Math.max(1, Math.round(perUnit * 10 * 0.9)) }
  ];
};

export const toWholesaleProduct = (product) => {
  const variants = buildBulkVariants(product);
  const bulkPrice = variants[variants.length - 1]?.price || product.price;
  return {
    ...product,
    deliveryTime: product.deliveryTime === '10 mins' ? 'Same day' : product.deliveryTime,
    name: product.name.includes('Bulk') ? product.name : `${product.name} Bulk`,
    variants,
    wholesalePrice: product.wholesalePrice || bulkPrice,
    isBestseller: product.isBestseller || product.discount >= 10
  };
};

export const getProducts = (customerType = 'retail') => {
  if (customerType === 'wholesale') {
    const adminWholesale = readAdminWholesaleProducts();
    const wholesaleCatalog = baseProducts.map(toWholesaleProduct);
    return mergeCatalog(wholesaleCatalog, adminWholesale);
  }
  const adminRetail = readAdminRetailProducts();
  return mergeCatalog(baseProducts, adminRetail);
};

export const products = getProducts();

export const getProductById = (id, customerType = 'retail') =>
  getProducts(customerType).find(p => String(p.id) === String(id));

export const getProductsByCategory = (categoryId, customerType = 'retail') =>
  getProducts(customerType).filter(p => p.category === categoryId);

export const getBestsellers = (customerType = 'retail') =>
  getProducts(customerType).filter(p => p.isBestseller);

export const getDeals = (customerType = 'retail') =>
  getProducts(customerType).filter(p => p.discount >= 10);

export const searchProducts = (query, customerType = 'retail') => {
  const q = query.toLowerCase();
  return getProducts(customerType).filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
};
