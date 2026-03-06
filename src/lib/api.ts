const API_BASE_URL = "http://localhost:8000";

export const getRevenueAnalysis = async () => {
    const response = await fetch(`${API_BASE_URL}/revenue/analysis`);
    if (!response.ok) throw new Error("Failed to fetch revenue analysis");
    return response.json();
};

export const getComboRecommendations = async () => {
    const response = await fetch(`${API_BASE_URL}/revenue/combos`);
    if (!response.ok) throw new Error("Failed to fetch combo recommendations");
    return response.json();
};

export interface MenuItem {
    id: string;
    _id?: string;
    name: string;
    description: string;
    selling_price: number;
    category: string;
    veg: boolean;
}

export const getMenuItems = async (): Promise<MenuItem[]> => {
    const response = await fetch(`${API_BASE_URL}/menu-items/`);
    if (!response.ok) throw new Error("Failed to fetch menu items");
    return response.json();
};


export const updateMenuItemPrice = async (itemId: string, newPrice: number) => {
    const response = await fetch(`${API_BASE_URL}/menu-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selling_price: newPrice }),
    });
    if (!response.ok) throw new Error("Failed to update price");
    return response.json();
};

export const getRevenueTrends = async () => {
    const response = await fetch(`${API_BASE_URL}/revenue/trends`);
    if (!response.ok) throw new Error("Failed to fetch revenue trends");
    return response.json();
};

