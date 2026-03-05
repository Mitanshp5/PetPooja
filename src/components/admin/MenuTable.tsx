import { menuItems } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Star, Puzzle, Zap, AlertTriangle } from "lucide-react";

const profitIcon: Record<string, React.ReactNode> = {
  star: <Star className="w-3.5 h-3.5" />,
  puzzle: <Puzzle className="w-3.5 h-3.5" />,
  workhorse: <Zap className="w-3.5 h-3.5" />,
  dog: <AlertTriangle className="w-3.5 h-3.5" />,
};

const profitColor: Record<string, string> = {
  star: "bg-chart-green/10 text-chart-green border-chart-green/20",
  puzzle: "bg-chart-amber/10 text-chart-amber border-chart-amber/20",
  workhorse: "bg-chart-blue/10 text-chart-blue border-chart-blue/20",
  dog: "bg-chart-red/10 text-chart-red border-chart-red/20",
};

const profitLabel: Record<string, string> = {
  star: "Star",
  puzzle: "Puzzle",
  workhorse: "Workhorse",
  dog: "Dog",
};

const MenuTable = () => {
  const sorted = [...menuItems].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-card rounded-lg shadow-card border border-border animate-slide-in">
      <div className="p-5 border-b border-border">
        <h3 className="font-display font-semibold text-lg text-card-foreground">Menu Performance Matrix</h3>
        <p className="text-sm text-muted-foreground mt-0.5">BCG-style classification by margin & popularity</p>
      </div>
      <div className="overflow-x-auto">
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
            {sorted.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.veg ? "bg-chart-green" : "bg-chart-red"}`} />
                    <span className="font-medium text-card-foreground">{item.name}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{item.category}</td>
                <td className="p-4 text-right text-card-foreground">₹{item.sellingPrice}</td>
                <td className="p-4 text-right">
                  <span className={`font-medium ${item.marginPercent >= 70 ? "text-chart-green" : item.marginPercent >= 55 ? "text-chart-amber" : "text-chart-red"}`}>
                    {item.marginPercent}%
                  </span>
                </td>
                <td className="p-4 text-right text-card-foreground">{item.unitsSold}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-card-foreground font-medium">₹{(item.revenue / 1000).toFixed(1)}K</span>
                    {item.popularity === "high" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-chart-green" />
                    ) : item.popularity === "low" ? (
                      <ArrowDownRight className="w-3.5 h-3.5 text-chart-red" />
                    ) : null}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <Badge variant="outline" className={`${profitColor[item.profitability]} gap-1 text-xs`}>
                    {profitIcon[item.profitability]}
                    {profitLabel[item.profitability]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuTable;
