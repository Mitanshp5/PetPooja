export interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  foodCost: number;
  contributionMargin: number;
  marginPercent: number;
  unitsSold: number;
  revenue: number;
  popularity: "high" | "medium" | "low";
  profitability: "star" | "puzzle" | "workhorse" | "dog";
  image?: string;
  description?: string;
  modifiers?: string[];
  veg: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: { name: string; qty: number; modifiers?: string[]; notes?: string }[];
  status: "new" | "preparing" | "ready" | "served";
  type: "dine-in" | "takeaway" | "delivery";
  table?: string;
  time: string;
  elapsed: number; // minutes
}

export interface ComboSuggestion {
  id: string;
  items: string[];
  expectedLift: number;
  comboPrice: number;
  individualTotal: number;
  confidence: number;
}

export const menuItems: MenuItem[] = [
  { id: "1", name: "Butter Chicken", category: "Main Course", sellingPrice: 350, foodCost: 105, contributionMargin: 245, marginPercent: 70, unitsSold: 480, revenue: 168000, popularity: "high", profitability: "star", description: "Creamy tomato-based chicken curry", modifiers: ["Mild", "Medium", "Spicy"], veg: false },
  { id: "2", name: "Paneer Tikka", category: "Starters", sellingPrice: 280, foodCost: 78, contributionMargin: 202, marginPercent: 72, unitsSold: 320, revenue: 89600, popularity: "medium", profitability: "puzzle", description: "Grilled cottage cheese with spices", modifiers: ["Regular", "Extra Spicy"], veg: true },
  { id: "3", name: "Dal Makhani", category: "Main Course", sellingPrice: 220, foodCost: 44, contributionMargin: 176, marginPercent: 80, unitsSold: 560, revenue: 123200, popularity: "high", profitability: "star", description: "Slow-cooked black lentils in cream", veg: true },
  { id: "4", name: "Chicken Biryani", category: "Rice", sellingPrice: 320, foodCost: 128, contributionMargin: 192, marginPercent: 60, unitsSold: 420, revenue: 134400, popularity: "high", profitability: "workhorse", description: "Fragrant basmati rice with spiced chicken", modifiers: ["Half", "Full"], veg: false },
  { id: "5", name: "Tandoori Roti", category: "Breads", sellingPrice: 40, foodCost: 8, contributionMargin: 32, marginPercent: 80, unitsSold: 1200, revenue: 48000, popularity: "high", profitability: "workhorse", description: "Clay oven baked whole wheat bread", veg: true },
  { id: "6", name: "Fish Tikka", category: "Starters", sellingPrice: 380, foodCost: 190, contributionMargin: 190, marginPercent: 50, unitsSold: 85, revenue: 32300, popularity: "low", profitability: "dog", description: "Grilled fish marinated in spices", veg: false },
  { id: "7", name: "Veg Manchurian", category: "Starters", sellingPrice: 200, foodCost: 50, contributionMargin: 150, marginPercent: 75, unitsSold: 95, revenue: 19000, popularity: "low", profitability: "puzzle", description: "Indo-Chinese vegetable balls in sauce", veg: true },
  { id: "8", name: "Gulab Jamun", category: "Desserts", sellingPrice: 120, foodCost: 24, contributionMargin: 96, marginPercent: 80, unitsSold: 340, revenue: 40800, popularity: "medium", profitability: "star", description: "Deep-fried milk dumplings in syrup", veg: true },
  { id: "9", name: "Masala Chai", category: "Beverages", sellingPrice: 60, foodCost: 10, contributionMargin: 50, marginPercent: 83, unitsSold: 890, revenue: 53400, popularity: "high", profitability: "star", description: "Spiced Indian tea", veg: true },
  { id: "10", name: "Prawn Curry", category: "Main Course", sellingPrice: 450, foodCost: 225, contributionMargin: 225, marginPercent: 50, unitsSold: 65, revenue: 29250, popularity: "low", profitability: "dog", description: "Coastal-style prawn curry", veg: false },
  { id: "11", name: "Naan", category: "Breads", sellingPrice: 60, foodCost: 15, contributionMargin: 45, marginPercent: 75, unitsSold: 980, revenue: 58800, popularity: "high", profitability: "workhorse", veg: true },
  { id: "12", name: "Mango Lassi", category: "Beverages", sellingPrice: 100, foodCost: 30, contributionMargin: 70, marginPercent: 70, unitsSold: 280, revenue: 28000, popularity: "medium", profitability: "puzzle", description: "Sweet yogurt-based mango drink", veg: true },
];

export const orders: Order[] = [
  { id: "1", orderNumber: "KOT-001", items: [{ name: "Butter Chicken", qty: 2, modifiers: ["Spicy"] }, { name: "Naan", qty: 4 }, { name: "Dal Makhani", qty: 1 }], status: "new", type: "dine-in", table: "T-07", time: "12:34 PM", elapsed: 2 },
  { id: "2", orderNumber: "KOT-002", items: [{ name: "Chicken Biryani", qty: 1, modifiers: ["Full"] }, { name: "Masala Chai", qty: 2 }], status: "preparing", type: "dine-in", table: "T-03", time: "12:28 PM", elapsed: 8 },
  { id: "3", orderNumber: "KOT-003", items: [{ name: "Paneer Tikka", qty: 1 }, { name: "Veg Manchurian", qty: 1 }, { name: "Tandoori Roti", qty: 6 }], status: "preparing", type: "takeaway", time: "12:22 PM", elapsed: 14 },
  { id: "4", orderNumber: "KOT-004", items: [{ name: "Fish Tikka", qty: 2 }, { name: "Prawn Curry", qty: 1 }, { name: "Naan", qty: 3 }], status: "ready", type: "delivery", time: "12:15 PM", elapsed: 21 },
  { id: "5", orderNumber: "KOT-005", items: [{ name: "Gulab Jamun", qty: 4 }, { name: "Mango Lassi", qty: 2 }], status: "new", type: "dine-in", table: "T-12", time: "12:36 PM", elapsed: 0 },
  { id: "6", orderNumber: "KOT-006", items: [{ name: "Butter Chicken", qty: 1, modifiers: ["Medium"] }, { name: "Chicken Biryani", qty: 1, modifiers: ["Half"] }, { name: "Naan", qty: 2 }], status: "new", type: "dine-in", table: "T-01", time: "12:37 PM", elapsed: 0 },
];

export const comboSuggestions: ComboSuggestion[] = [
  { id: "1", items: ["Butter Chicken", "Naan", "Masala Chai"], expectedLift: 18, comboPrice: 399, individualTotal: 450, confidence: 92 },
  { id: "2", items: ["Paneer Tikka", "Dal Makhani", "Tandoori Roti"], expectedLift: 14, comboPrice: 479, individualTotal: 540, confidence: 87 },
  { id: "3", items: ["Chicken Biryani", "Mango Lassi", "Gulab Jamun"], expectedLift: 22, comboPrice: 469, individualTotal: 540, confidence: 85 },
];

export const revenueStats = {
  totalRevenue: 824750,
  avgOrderValue: 485,
  totalOrders: 1701,
  avgMargin: 71,
  topCategory: "Main Course",
  revenueGrowth: 12.5,
  aovGrowth: 8.2,
  orderGrowth: 4.1,
};

export const dailyRevenue = [
  { day: "Mon", revenue: 105000, orders: 220 },
  { day: "Tue", revenue: 98000, orders: 205 },
  { day: "Wed", revenue: 112000, orders: 235 },
  { day: "Thu", revenue: 125000, orders: 260 },
  { day: "Fri", revenue: 148000, orders: 310 },
  { day: "Sat", revenue: 156000, orders: 325 },
  { day: "Sun", revenue: 142000, orders: 295 },
];

export const categories = ["All", "Starters", "Main Course", "Rice", "Breads", "Desserts", "Beverages"];
