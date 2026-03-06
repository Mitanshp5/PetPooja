import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Star, Puzzle, Zap, AlertTriangle, Loader2, Save } from "lucide-react";
import { getRevenueAnalysis, updateMenuItemPrice } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getRevenueAnalysis()
      .then((data) => {
        const sorted = [...(data.items || [])].sort((a: any, b: any) => b.total_revenue - a.total_revenue);
        setItems(sorted);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePriceUpdate = async () => {
    if (!selectedItem || !editPrice) return;
    try {
      setSaving(true);
      await updateMenuItemPrice(selectedItem.item_id, parseFloat(editPrice));
      toast.success(`${selectedItem.name} price updated successfully!`);
      setSelectedItem(null);
      fetchData(); // Refresh table
    } catch (err) {
      toast.error("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      setEditPrice(selectedItem.selling_price.toString());
    } else {
      setEditPrice("");
    }
  }, [selectedItem]);

  return (
    <>
      <div className="bg-card rounded-lg shadow-card border border-border animate-slide-in">
        <div className="p-5 border-b border-border">
          <h3 className="font-display font-semibold text-lg text-card-foreground">Menu Performance Matrix</h3>
          <p className="text-sm text-muted-foreground mt-0.5">BCG-style classification by margin & popularity. Click any row for details and price editing.</p>
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
                  <th className="text-right p-4 font-medium text-muted-foreground">Current Price</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-primary/80">Optimal Price</th>
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
                    <tr
                      key={idx}
                      onClick={() => setSelectedItem(item)}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <span className="font-medium text-card-foreground">{item.name}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{item.category}</td>
                      <td className="p-4 text-right text-card-foreground font-medium text-base">₹{item.selling_price}</td>
                      <td className="p-4 text-right text-primary font-bold text-base">₹{item.optimal_price || item.selling_price}</td>
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
                        <Badge variant="outline" className={`${profitColor[cls] || profitColor["Dog"]} gap-1 text-xs px-2.5 py-0.5`}>
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

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between pt-2">
                  <span className="text-xl">{selectedItem.name}</span>
                  <Badge variant="outline" className={`${profitColor[selectedItem.classification || "Dog"]} gap-1 text-xs ml-4`}>
                    {profitIcon[selectedItem.classification || "Dog"]}
                    {selectedItem.classification || "Dog"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Detailed revenue intelligence and pricing management.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1 p-3 rounded-md bg-muted/30 border border-border">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Current Price</span>
                    <span className="font-bold text-lg text-foreground">₹{selectedItem.selling_price}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-md bg-primary/10 border border-primary/20">
                    <span className="text-primary/70 text-xs uppercase tracking-wider font-semibold">AI Optimal Price</span>
                    <span className="font-bold text-lg text-primary">₹{selectedItem.optimal_price || selectedItem.selling_price}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-md bg-muted/30 border border-border">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Margin %</span>
                    <span className="font-medium text-foreground">{(selectedItem.margin_percentage ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-md bg-muted/30 border border-border">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Total Revenue</span>
                    <span className="font-medium text-foreground">₹{selectedItem.total_revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <Zap className="w-5 h-5" />
                    AI Price Intelligence
                  </h4>
                  <div className="text-sm text-foreground/80 leading-relaxed font-medium">
                    {selectedItem.price_optimization || "Analysis pending... wait for next engine cycle."}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Manual Price Override
                  </h4>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="pl-7 h-11 text-lg font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      onClick={handlePriceUpdate}
                      disabled={saving || !editPrice || editPrice === selectedItem.selling_price.toString()}
                      className="h-11 px-6 gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Price
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    * Updating the price here will immediately sync across all digital menus and the AI Voice Copilot.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MenuTable;
