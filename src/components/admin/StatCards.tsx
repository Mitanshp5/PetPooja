import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, Percent, Loader2 } from "lucide-react";
import { getRevenueAnalysis } from "@/lib/api";

const StatCards = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueAnalysis()
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const summary = stats?.summary ?? {};
  const totalItems = (summary.Star ?? 0) + (summary.Plowhorse ?? 0) + (summary.Puzzle ?? 0) + (summary.Dog ?? 0);
  const avgMargin = stats?.average_margin ?? 0;

  const cards = stats
    ? [
      { label: "Avg Contribution Margin", value: `${avgMargin.toFixed(1)}%`, icon: Percent, up: avgMargin > 60, change: "per item" },
      { label: "Total Items Analyzed", value: `${totalItems}`, icon: BarChart3, up: true, change: "on menu" },
      { label: "⭐ Star Items", value: `${summary.Star ?? 0}`, icon: ShoppingCart, up: true, change: "High margin + popular" },
      { label: "🐕 Dog Items", value: `${summary.Dog ?? 0}`, icon: DollarSign, up: false, change: "Low margin + low vol" },
    ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-lg p-5 shadow-card border border-border flex items-center justify-center h-28">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((s) => (
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
            <span className={`text-xs font-medium ${s.up ? "text-chart-green" : "text-chart-red"}`}>{s.up ? "Good" : "Needs attention"}</span>
            {s.change && <span className="text-xs text-muted-foreground ml-1">{s.change}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
