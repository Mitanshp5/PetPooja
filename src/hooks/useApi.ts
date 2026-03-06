import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order } from "../data/mockData";
import { getMenuItems, MenuItem } from "../lib/api";

const API_BASE = "http://localhost:8000";

// Fetch active orders for the Kitchen Display
export const useActiveOrders = () => {
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/kitchen/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds for live kitchen display
  });
};

// Update order status from Kitchen Display
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
      const res = await fetch(`${API_BASE}/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch orders so the UI updates instantly
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// Place new order from Mobile App
export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderPayload: any) => {
      const res = await fetch(`${API_BASE}/mobile/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) throw new Error("Failed to place order");
      return res.json();
    },
    onSuccess: () => {
      // Refresh the kitchen display orders (even though they poll anyway)
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useMenu = () => {
  return useQuery<MenuItem[]>({
    queryKey: ["menu"],
    queryFn: getMenuItems,
  });
};
