// Products mock data for Siri Traders
// ~54 products across 10 categories

export const baseProducts = [
  // ===== FRUITS & VEGETABLES =====
  {
    id: 1,
    name: 'Fresh Bananas',
    category: 'fruits-vegetables',
    brand: 'Farm Fresh',
    weight: '1',
    unit: 'dozen',
    price: 45,
    mrp: 60,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
    description: 'Fresh and ripe bananas sourced from local farms. Rich in potassium and great for a healthy snack.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 2,
    name: 'Red Onions',
    category: 'fruits-vegetables',
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
    category: 'fruits-vegetables',
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
    id: 4,
    name: 'Green Capsicum',
    category: 'fruits-vegetables',
    brand: 'Farm Fresh',
    weight: '250',
    unit: 'g',
    price: 30,
    mrp: 40,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
    description: 'Fresh green bell peppers. Great for stir-fries and salads.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 5,
    name: 'Shimla Apples',
    category: 'fruits-vegetables',
    brand: 'Premium Select',
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
    id: 6,
    name: 'Fresh Potatoes',
    category: 'fruits-vegetables',
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
    category: 'fruits-vegetables',
    brand: 'Farm Fresh',
    weight: '500',
    unit: 'g',
    price: 35,
    mrp: 45,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=300&fit=crop',
    description: 'Fresh orange carrots. Rich in beta carotene and vitamin A.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 8,
    name: 'Pomegranate',
    category: 'fruits-vegetables',
    brand: 'Premium Select',
    weight: '2',
    unit: 'pcs',
    price: 90,
    mrp: 120,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&h=300&fit=crop',
    description: 'Juicy pomegranates packed with antioxidants.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== DAIRY & BREAKFAST =====
  {
    id: 9,
    name: 'Amul Milk 1L',
    category: 'dairy-breakfast',
    brand: 'Amul',
    weight: '1',
    unit: 'L',
    price: 60,
    mrp: 64,
    discount: 6,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    description: 'Amul Toned Milk with 3% fat. Pasteurized and homogenized.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 10,
    name: 'Amul Butter 500g',
    category: 'dairy-breakfast',
    brand: 'Amul',
    weight: '500',
    unit: 'g',
    price: 270,
    mrp: 290,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
    description: 'Amul Pasteurized Butter. India\'s favourite butter.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 11,
    name: 'Fresh Paneer',
    category: 'dairy-breakfast',
    brand: 'Mother Dairy',
    weight: '200',
    unit: 'g',
    price: 85,
    mrp: 100,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=300&fit=crop',
    description: 'Fresh and soft paneer made from cow milk.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 12,
    name: 'White Bread',
    category: 'dairy-breakfast',
    brand: 'Harvest Gold',
    weight: '400',
    unit: 'g',
    price: 40,
    mrp: 45,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=300&h=300&fit=crop',
    description: 'Soft and fresh white bread for sandwiches and toast.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 13,
    name: 'Eggs (Pack of 6)',
    category: 'dairy-breakfast',
    brand: 'Farm Fresh',
    weight: '6',
    unit: 'pcs',
    price: 48,
    mrp: 54,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop',
    description: 'Fresh protein-rich eggs. Essential for a healthy breakfast.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 14,
    name: 'Dahi (Curd)',
    category: 'dairy-breakfast',
    brand: 'Mother Dairy',
    weight: '400',
    unit: 'g',
    price: 35,
    mrp: 40,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop',
    description: 'Fresh and creamy curd made from toned milk.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 15,
    name: 'Cheese Slices',
    category: 'dairy-breakfast',
    brand: 'Amul',
    weight: '200',
    unit: 'g',
    price: 110,
    mrp: 130,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=300&h=300&fit=crop',
    description: 'Amul processed cheese slices. Perfect for sandwiches.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== SNACKS & MUNCHIES =====
  {
    id: 16,
    name: 'Lay\'s Chips',
    category: 'snacks-munchies',
    brand: 'Lay\'s',
    weight: '115',
    unit: 'g',
    price: 30,
    mrp: 30,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    description: 'Lay\'s Classic Salted Potato Chips. Crispy and delicious.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 17,
    name: 'Haldiram Namkeen',
    category: 'snacks-munchies',
    brand: 'Haldiram\'s',
    weight: '200',
    unit: 'g',
    price: 55,
    mrp: 65,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&h=300&fit=crop',
    description: 'Haldiram\'s Aloo Bhujia. Authentic Indian snack.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 18,
    name: 'Kurkure Masala',
    category: 'snacks-munchies',
    brand: 'Kurkure',
    weight: '95',
    unit: 'g',
    price: 20,
    mrp: 20,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300&h=300&fit=crop',
    description: 'Kurkure Masala Munch. Tedha hai par mera hai.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 19,
    name: 'Dark Fantasy',
    category: 'snacks-munchies',
    brand: 'Sunfeast',
    weight: '75',
    unit: 'g',
    price: 40,
    mrp: 40,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop',
    description: 'Sunfeast Dark Fantasy Choco Fills. Premium cookie experience.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 20,
    name: 'Maggi 2-Min Noodles',
    category: 'snacks-munchies',
    brand: 'Maggi',
    weight: '280',
    unit: 'g',
    price: 56,
    mrp: 60,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&h=300&fit=crop',
    description: 'Maggi Masala 2-Minute Noodles. Pack of 4.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },

  // ===== BEVERAGES =====
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
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop',
    description: 'Bisleri Mineral Water. Purest form of hydration.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== BAKERY & BISCUITS =====
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
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop',
    description: 'Britannia Good Day Cashew Cookies. Everyday happiness.',
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
    description: 'Parle-G Original Glucose Biscuits. G maane Genius.',
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
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1586444248879-bc604cbd555a?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=300&h=300&fit=crop',
    description: 'Cadbury Oreo Vanilla Creme Biscuits. Twist, Lick, Dunk.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== PERSONAL CARE =====
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
    image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1628359355624-855775b5c9c4?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9e?w=300&h=300&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&h=300&fit=crop',
    description: 'Vaseline Intensive Care Deep Moisture Body Lotion.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== CLEANING & HOUSEHOLD =====
  {
    id: 36,
    name: 'Vim Dishwash Gel',
    category: 'cleaning-household',
    brand: 'Vim',
    weight: '500',
    unit: 'ml',
    price: 99,
    mrp: 115,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&h=300&fit=crop',
    description: 'Vim Dishwash Gel Lemon. 2X faster grease removal.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 37,
    name: 'Harpic Toilet Cleaner',
    category: 'cleaning-household',
    brand: 'Harpic',
    weight: '500',
    unit: 'ml',
    price: 89,
    mrp: 99,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&h=300&fit=crop',
    description: 'Harpic Power Plus Toilet Cleaner. 10X better cleaning.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 38,
    name: 'Surf Excel Matic',
    category: 'cleaning-household',
    brand: 'Surf Excel',
    weight: '1',
    unit: 'kg',
    price: 299,
    mrp: 340,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300&h=300&fit=crop',
    description: 'Surf Excel Matic Top Load Detergent Powder.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 39,
    name: 'Lizol Floor Cleaner',
    category: 'cleaning-household',
    brand: 'Lizol',
    weight: '500',
    unit: 'ml',
    price: 109,
    mrp: 125,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=300&h=300&fit=crop',
    description: 'Lizol Disinfectant Surface Cleaner. Citrus fragrance.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 40,
    name: 'Scotch-Brite Scrub',
    category: 'cleaning-household',
    brand: 'Scotch-Brite',
    weight: '3',
    unit: 'pcs',
    price: 45,
    mrp: 55,
    discount: 18,
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&h=300&fit=crop',
    description: 'Scotch-Brite Scrub Pad Pack of 3. Heavy duty cleaning.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },

  // ===== RICE & ATTA =====
  {
    id: 41,
    name: 'India Gate Basmati',
    category: 'rice',
    brand: 'India Gate',
    weight: '5',
    unit: 'kg',
    price: 449,
    mrp: 520,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop',
    description: 'India Gate Classic Basmati Rice. Long grain, aromatic.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '1 kg', price: 96 },
      { label: '5 kg', price: 449 },
      { label: '10 kg', price: 860 }
    ]
  },
  {
    id: 42,
    name: 'Aashirvaad Atta 5kg',
    category: 'atta',
    brand: 'Aashirvaad',
    weight: '5',
    unit: 'kg',
    price: 279,
    mrp: 310,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Aashirvaad Select Sharbatti Atta. Softest rotis every time.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '1 kg', price: 60 },
      { label: '5 kg', price: 279 },
      { label: '10 kg', price: 535 }
    ]
  },
  {
    id: 43,
    name: 'Toor Dal',
    category: 'pulses',
    brand: 'Tata Sampann',
    weight: '1',
    unit: 'kg',
    price: 149,
    mrp: 175,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1585650860565-a38a82f72ce3?w=300&h=300&fit=crop',
    description: 'Tata Sampann Toor Dal. Unpolished, high protein.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 78 },
      { label: '1 kg', price: 149 },
      { label: '5 kg', price: 720 }
    ]
  },
  {
    id: 44,
    name: 'Moong Dal',
    category: 'pulses',
    brand: 'Tata Sampann',
    weight: '1',
    unit: 'kg',
    price: 159,
    mrp: 185,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1612257416648-ee7c97aea588?w=300&h=300&fit=crop',
    description: 'Tata Sampann Moong Dal. Rich in protein and fiber.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 82 },
      { label: '1 kg', price: 159 },
      { label: '5 kg', price: 760 }
    ]
  },

  // ===== MASALA & OILS =====
  {
    id: 45,
    name: 'MDH Garam Masala',
    category: 'masala',
    brand: 'MDH',
    weight: '100',
    unit: 'g',
    price: 72,
    mrp: 85,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop',
    description: 'MDH Garam Masala. Authentic blend of finest spices.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true,
    variants: [
      { label: '50 g', price: 38 },
      { label: '100 g', price: 72 },
      { label: '500 g', price: 330 }
    ]
  },
  {
    id: 46,
    name: 'Fortune Oil 1L',
    category: 'oils',
    brand: 'Fortune',
    weight: '1',
    unit: 'L',
    price: 139,
    mrp: 160,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Fortune Sunflower Refined Oil. Healthy heart, happy life.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: true,
    variants: [
      { label: '1 L', price: 139 },
      { label: '5 L', price: 670 },
      { label: '15 L', price: 1910 }
    ]
  },
  {
    id: 47,
    name: 'Everest Turmeric',
    category: 'masala',
    brand: 'Everest',
    weight: '200',
    unit: 'g',
    price: 55,
    mrp: 65,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&h=300&fit=crop',
    description: 'Everest Turmeric Powder. Pure and aromatic haldi.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '100 g', price: 30 },
      { label: '200 g', price: 55 },
      { label: '500 g', price: 128 }
    ]
  },
  {
    id: 48,
    name: 'Saffola Gold Oil',
    category: 'oils',
    brand: 'Saffola',
    weight: '1',
    unit: 'L',
    price: 189,
    mrp: 220,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Saffola Gold Blended Edible Oil. Heart healthy choice.',
    inStock: true,
    deliveryTime: '15 mins',
    isBestseller: false,
    variants: [
      { label: '1 L', price: 189 },
      { label: '5 L', price: 900 },
      { label: '15 L', price: 2600 }
    ]
  },
  {
    id: 49,
    name: 'Red Chilli Powder',
    category: 'masala',
    brand: 'MDH',
    weight: '100',
    unit: 'g',
    price: 50,
    mrp: 58,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop',
    description: 'MDH Deggi Mirch. Adds colour and mild flavour to food.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false,
    variants: [
      { label: '50 g', price: 28 },
      { label: '100 g', price: 50 },
      { label: '500 g', price: 235 }
    ]
  },

  // ===== INSTANT & FROZEN =====
  {
    id: 50,
    name: 'MTR Ready to Eat',
    category: 'instant-frozen',
    brand: 'MTR',
    weight: '300',
    unit: 'g',
    price: 85,
    mrp: 99,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop',
    description: 'MTR Alu Mutter Ready to Eat. Heat and serve in 3 minutes.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 51,
    name: 'McCain French Fries',
    category: 'instant-frozen',
    brand: 'McCain',
    weight: '420',
    unit: 'g',
    price: 140,
    mrp: 165,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=300&fit=crop',
    description: 'McCain Crazy Fries. Crispy and delicious frozen fries.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: true
  },
  {
    id: 52,
    name: 'Frozen Peas',
    category: 'instant-frozen',
    brand: 'Safal',
    weight: '500',
    unit: 'g',
    price: 75,
    mrp: 90,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1587735243615-c067d3cca08a?w=300&h=300&fit=crop',
    description: 'Safal Frozen Green Peas. Farm fresh frozen at peak.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 53,
    name: 'Cup Noodles',
    category: 'instant-frozen',
    brand: 'Nissin',
    weight: '70',
    unit: 'g',
    price: 45,
    mrp: 50,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&h=300&fit=crop',
    description: 'Nissin Cup Noodles Mazedaar Masala. Just add hot water.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  },
  {
    id: 54,
    name: 'Frozen Parathas',
    category: 'instant-frozen',
    brand: 'McCain',
    weight: '400',
    unit: 'g',
    price: 95,
    mrp: 110,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=300&fit=crop',
    description: 'McCain Aloo Tikki Paratha. Ready to cook in minutes.',
    inStock: true,
    deliveryTime: '10 mins',
    isBestseller: false
  }
];

const wholesaleProducts = [
  {
    id: 1001,
    name: 'Sona Masoori Rice',
    category: 'rice',
    brand: 'Siri Wholesale',
    weight: '25',
    unit: 'kg',
    price: 1180,
    mrp: 1320,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    description: 'Wholesale-grade Sona Masoori rice for hotels, caterers and family stock-up.',
    inStock: true,
    deliveryTime: 'Same day',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 26 },
      { label: '1 kg', price: 50 },
      { label: '10 kg', price: 480 },
      { label: '1 bag (25 kg)', price: 1150 }
    ],
    wholesalePrice: 1120
  },
  {
    id: 1002,
    name: 'Aashirvaad Atta',
    category: 'atta',
    brand: 'Aashirvaad',
    weight: '10',
    unit: 'kg',
    price: 455,
    mrp: 520,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    description: 'Fresh chakki atta available in retail and bulk packs.',
    inStock: true,
    deliveryTime: 'Same day',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 29 },
      { label: '1 kg', price: 55 },
      { label: '10 kg', price: 520 },
      { label: '1 bag (25 kg)', price: 1225 }
    ],
    wholesalePrice: 430
  },
  {
    id: 1003,
    name: 'Toor Dal Premium',
    category: 'pulses',
    brand: 'Siri Select',
    weight: '10',
    unit: 'kg',
    price: 1280,
    mrp: 1450,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80',
    description: 'Clean and sorted toor dal for daily commercial kitchens.',
    inStock: true,
    deliveryTime: 'Same day',
    isBestseller: true,
    variants: [
      { label: '500 g', price: 69 },
      { label: '1 kg', price: 135 },
      { label: '10 kg', price: 1280 },
      { label: '1 bag (25 kg)', price: 3075 }
    ],
    wholesalePrice: 1210
  },
  {
    id: 1004,
    name: 'Sunflower Oil Can',
    category: 'oils',
    brand: 'Gold Drop',
    weight: '15',
    unit: 'L',
    price: 1950,
    mrp: 2160,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    description: 'Bulk sunflower oil can for restaurants, tiffin centers and stores.',
    inStock: true,
    deliveryTime: 'Same day',
    isBestseller: true,
    variants: [
      { label: '500 ml', price: 74 },
      { label: '1 L', price: 145 },
      { label: '5 L', price: 680 },
      { label: '1 can (15 L)', price: 1950 }
    ],
    wholesalePrice: 1860
  },
  {
    id: 1005,
    name: 'Garam Masala',
    category: 'masala',
    brand: 'Siri Spices',
    weight: '1',
    unit: 'kg',
    price: 410,
    mrp: 480,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
    description: 'Aromatic masala blend packed for retail counters and bulk use.',
    inStock: true,
    deliveryTime: 'Same day',
    isBestseller: false,
    variants: [
      { label: '500 g', price: 220 },
      { label: '1 kg', price: 410 }
    ],
    wholesalePrice: 380
  }
];

const ADMIN_PRODUCTS_KEY = 'siri-admin-products';

const readAdminProducts = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const saved = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const mergeCatalog = (catalog, adminProducts = []) => {
  const catalogById = new Map(catalog.map(product => [String(product.id), product]));
  const adminIds = new Set(adminProducts.map(product => String(product.id)));
  const normalizedAdminProducts = adminProducts.map(product => ({
    ...catalogById.get(String(product.id)),
    ...product
  }));
  return [...normalizedAdminProducts, ...catalog.filter(product => !adminIds.has(String(product.id)))];
};

export const getProducts = (customerType = 'retail') => {
  if (customerType === 'wholesale') return wholesaleProducts;
  const adminProducts = readAdminProducts() || [];
  return mergeCatalog(baseProducts, adminProducts);
};

export const products = getProducts();

// Helper functions
export const getProductById = (id, customerType = 'retail') => getProducts(customerType).find(p => String(p.id) === String(id));

export const getProductsByCategory = (categoryId, customerType = 'retail') =>
  getProducts(customerType).filter(p => p.category === categoryId);

export const getBestsellers = (customerType = 'retail') => getProducts(customerType).filter(p => p.isBestseller);

export const getDeals = (customerType = 'retail') => getProducts(customerType).filter(p => p.discount >= 10);

export const searchProducts = (query, customerType = 'retail') => {
  const q = query.toLowerCase();
  return getProducts(customerType).filter(p =>
    p.name.toLowerCase().includes(q) || 
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
};
