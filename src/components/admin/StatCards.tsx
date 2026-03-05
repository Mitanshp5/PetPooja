import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, Percent } from "lucide-react";
import { revenueStats } from "@/data/mockData";

const stats = [
  { label: "Total Revenue", value: `₹${(revenueStats.totalRevenue / 1000).toFixed(0)}K`, change: revenueStats.revenueGrowth, icon: DollarSign, up: true },
  { label: "Avg Order Value", value: `₹${revenueStats.avgOrderValue}`, change: revenueStats.aovGrowth, icon: ShoppingCart, up: true },
  { label: "Total Orders", value: revenueStats.totalOrders.toLocaleString(), change: revenueStats.orderGrowth, icon: BarChart3, up: true },
  { label: "Avg Margin", value: `${revenueStats.avgMargin}%`, change: 2.1, icon: Percent, up: true },
];

const StatCards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((s) => (
      <div key={s.label} className="bg-card rounded-lg p-5 shadow-card animate-slide-in border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
          <div className="w-9 h-9 rounded-lg gradient-warm flex items-center justify-center">
            <s.icon className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        <p className="text-2xl font-bold font-display text-card-foreground">{s.value}</p>
        <div className="flex items-center gap-1 mt-1">
          {s.up ? <TrendingUp className="w-3.5 h-3.5 text-chart-green" /> : <TrendingDown className="w-3.5 h-3.5 text-chart-red" />}
          <span className={`text-xs font-medium ${s.up ? "text-chart-green" : "text-chart-red"}`}>+{s.change}%</span>
          <span className="text-xs text-muted-foreground ml-1">vs last week</span>
        </div>
      </div>
    ))}
  </div>
);

export default StatCards;
