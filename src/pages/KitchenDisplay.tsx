import { useState } from "react";
import { orders as initialOrders, Order } from "@/data/mockData";
import { Clock, ChefHat, CheckCircle2, Truck, UtensilsCrossed, AlertCircle } from "lucide-react";

const statusConfig: Record<Order["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  new: { label: "NEW", color: "text-chart-red", bg: "bg-chart-red/10 border-chart-red/30", icon: <AlertCircle className="w-4 h-4" /> },
  preparing: { label: "PREPARING", color: "text-chart-amber", bg: "bg-chart-amber/10 border-chart-amber/30", icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: "READY", color: "text-chart-green", bg: "bg-chart-green/10 border-chart-green/30", icon: <CheckCircle2 className="w-4 h-4" /> },
  served: { label: "SERVED", color: "text-chart-blue", bg: "bg-chart-blue/10 border-chart-blue/30", icon: <UtensilsCrossed className="w-4 h-4" /> },
};

const typeIcon: Record<Order["type"], React.ReactNode> = {
  "dine-in": <UtensilsCrossed className="w-3.5 h-3.5" />,
  takeaway: <ChefHat className="w-3.5 h-3.5" />,
  delivery: <Truck className="w-3.5 h-3.5" />,
};

const KitchenDisplay = () => {
  const [orderList, setOrderList] = useState(initialOrders);

  const advance = (id: string) => {
    setOrderList((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next: Record<string, Order["status"]> = { new: "preparing", preparing: "ready", ready: "served" };
        return { ...o, status: next[o.status] || o.status };
      })
    );
  };

  const columns: { status: Order["status"]; title: string }[] = [
    { status: "new", title: "New Orders" },
    { status: "preparing", title: "In Progress" },
    { status: "ready", title: "Ready to Serve" },
  ];

  return (
    <div className="min-h-screen gradient-dark text-sidebar-foreground">
      <header className="border-b border-sidebar-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-warm flex items-center justify-center text-sm">🍽</div>
          <div>
            <h1 className="font-display font-bold text-lg text-primary-foreground">Kitchen Display</h1>
            <p className="text-xs text-sidebar-foreground">Live order queue</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-sidebar-foreground">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-chart-green animate-pulse-glow" />
            <span className="text-chart-green font-medium">{orderList.filter((o) => o.status !== "served").length} active</span>
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 lg:p-6">
        {columns.map((col) => {
          const colOrders = orderList.filter((o) => o.status === col.status);
          const config = statusConfig[col.status];
          return (
            <div key={col.status}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={config.color}>{config.icon}</span>
                <h2 className="font-display font-semibold text-primary-foreground">{col.title}</h2>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color} border`}>{colOrders.length}</span>
              </div>
              <div className="space-y-3">
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl border ${config.bg} p-4 animate-slide-in`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-display font-bold text-lg ${config.color}`}>{order.orderNumber}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-sidebar-foreground bg-sidebar-accent px-2 py-1 rounded-md">
                          {typeIcon[order.type]}
                          {order.type === "dine-in" ? order.table : order.type}
                        </span>
                        <span className={`text-xs font-medium ${order.elapsed > 15 ? "text-chart-red" : order.elapsed > 8 ? "text-chart-amber" : "text-sidebar-foreground"}`}>
                          {order.elapsed}m
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-primary-foreground min-w-[20px]">{item.qty}x</span>
                          <div>
                            <span className="text-primary-foreground">{item.name}</span>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <span className="ml-1.5 text-xs text-sidebar-foreground">({item.modifiers.join(", ")})</span>
                            )}
                            {item.notes && <p className="text-xs text-chart-amber mt-0.5">Note: {item.notes}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {col.status !== "served" && (
                      <button
                        onClick={() => advance(order.id)}
                        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          col.status === "new"
                            ? "gradient-warm text-primary-foreground shadow-glow hover:opacity-90"
                            : "bg-chart-green/20 text-chart-green border border-chart-green/30 hover:bg-chart-green/30"
                        }`}
                      >
                        {col.status === "new" ? "Start Preparing →" : "Mark Ready ✓"}
                      </button>
                    )}
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="text-center py-8 text-sidebar-foreground/50 text-sm">No orders</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KitchenDisplay;
