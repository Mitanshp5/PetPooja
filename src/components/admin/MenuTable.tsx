import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Star, Puzzle, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { getRevenueAnalysis } from "@/lib/api";

const profitIcon: Record<string, React.ReactNode> = {
  Star: <Star className="w-3.5 h-3.5" />,
  Puzzle: <Puzzle className="w-3.5 h-3.5" />,
  Plowhorse: <Zap className="w-3.5 h-3.5" />,
  Dog: <AlertTriangle className="w-3.5 h-3.5" />,
};

const profitColor: Record<string, string> = {
  Star: "bg-chart-green/10 text-chart-green border-chart-green/20",
  Puzzle: "bg-chart-amber/10 text-chart-amber border-chart-amber/20",
  Plowhorse: "bg-chart-blue/10 text-chart-blue border-chart-blue/20",
  Dog: "bg-chart-red/10 text-chart-red border-chart-red/20",
};

const MenuTable = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueAnalysis()
      .then((data) => {
        const sorted = [...(data.items || [])].sort((a: any, b: any) => b.total_revenue - a.total_revenue);
        setItems(sorted);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card rounded-lg shadow-card border border-border animate-slide-in">
      <div className="p-5 border-b border-border">
        <h3 className="font-display font-semibold text-lg text-card-foreground">Menu Performance Matrix</h3>
        <p className="text-sm text-muted-foreground mt-0.5">BCG-style classification by margin & popularity</p>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Margin %</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Units Sold</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Revenue</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Classification</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const cls = item.classification || "Dog";
                const avgVelocity = items.reduce((s: number, i: any) => s + (i.sales_velocity ?? 0), 0) / (items.length || 1);
                const isHighVelocity = (item.sales_velocity ?? 0) > avgVelocity;
                return (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-card-foreground">{item.name}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">{item.category}</td>
                    <td className="p-4 text-right text-card-foreground">₹{item.selling_price}</td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${(item.margin_percentage ?? 0) >= 70 ? "text-chart-green" : (item.margin_percentage ?? 0) >= 55 ? "text-chart-amber" : "text-chart-red"}`}>
                        {(item.margin_percentage ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-card-foreground">{item.sales_velocity}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-card-foreground font-medium">₹{(item.total_revenue / 1000).toFixed(1)}K</span>
                        {isHighVelocity
                          ? <ArrowUpRight className="w-3.5 h-3.5 text-chart-green" />
                          : <ArrowDownRight className="w-3.5 h-3.5 text-chart-red" />}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className={`${profitColor[cls] || profitColor["Dog"]} gap-1 text-xs`}>
                        {profitIcon[cls] || profitIcon["Dog"]}
                        {cls}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MenuTable;
