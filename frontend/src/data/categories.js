// Categories data for Siri Traders

export const categories = [
  {
    id: 'pulses',
    name: 'Pulses & Dals',
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=300&q=80',
    color: '#F2EADC',
    itemCount: 16
  },
  {
    id: 'rice',
    name: 'Rice & Basmati',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80',
    color: '#EFE3D1',
    itemCount: 3
  },
  {
    id: 'atta',
    name: 'Wheat, Atta & Flour',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80',
    color: '#F8F1DC',
    itemCount: 8
  },
  {
    id: 'ravva-poha',
    name: 'Ravva & Poha',
    image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b24e?w=300&q=80',
    color: '#FFF8E7',
    itemCount: 6
  },
  {
    id: 'masala',
    name: 'Spices & Masala',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80',
    color: '#F6E6D7',
    itemCount: 10
  },
  {
    id: 'oils',
    name: 'Oils',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80',
    color: '#FFF4C7',
    itemCount: 11
  },
  {
    id: 'nuts-dry-fruits',
    name: 'Nuts & Dry Fruits',
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300&q=80',
    color: '#FFF3E0',
    itemCount: 13
  },
  {
    id: 'millets',
    name: 'Millets & Grains',
    image: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=300&q=80',
    color: '#E8F5E9',
    itemCount: 7
  },
  {
    id: 'grocery-essentials',
    name: 'Grocery Essentials',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&q=80',
    color: '#E3F2FD',
    itemCount: 8
  },
  {
    id: 'snacks-munchies',
    name: 'Snacks & Munchies',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&q=80',
    color: '#FFF3E0',
    itemCount: 5
  },
  {
    id: 'cleaning-household',
    name: 'Home Care & Cleaning',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80',
    color: '#E0F7FA',
    itemCount: 6
  },
  {
    id: 'instant-frozen',
    name: 'Instant Food',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&q=80',
    color: '#E8EAF6',
    itemCount: 2
  },
  {
    id: 'dairy-breakfast',
    name: 'Dairy Products',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
    color: '#FFF8E7',
    itemCount: 2
  },
  {
    id: 'fruits',
    name: 'Fruits',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80',
    color: '#FFF0E5',
    itemCount: 4
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=80',
    color: '#E8F5E9',
    itemCount: 4
  },
  {
    id: 'beverages',
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=300&q=80',
    color: '#E3F2FD',
    itemCount: 5
  },
  {
    id: 'bakery-biscuits',
    name: 'Bakery & Biscuits',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80',
    color: '#EFEBE9',
    itemCount: 5
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&q=80',
    color: '#F3E5F5',
    itemCount: 5
  }
];

export const getCategoryById = (id) => categories.find(c => c.id === id);
export const getCategoryByName = (name) => categories.find(c => c.name === name);

// Admin-added categories — stored in localStorage, merged at runtime
const ADMIN_CATEGORIES_KEY = 'siri-admin-categories';

export const getAdminCategories = () => {
  try {
    const saved = localStorage.getItem(ADMIN_CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const saveAdminCategories = (cats) => {
  localStorage.setItem(ADMIN_CATEGORIES_KEY, JSON.stringify(cats));
};

export const getAllCategories = () => {
  return [...categories, ...getAdminCategories()];
};
