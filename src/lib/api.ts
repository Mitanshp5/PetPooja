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

export const getMenuItems = async () => {
    // In a real app, this would come from the database
    const response = await fetch(`${API_BASE_URL}/revenue/analysis`);
    const data = await response.json();
    return data.items;
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
