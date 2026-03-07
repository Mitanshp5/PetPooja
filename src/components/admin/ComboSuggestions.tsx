import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getComboRecommendations, promoteCombo } from "@/lib/api";
import { toast } from "sonner";

const ComboSuggestions = () => {
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCombos = () => {
    setLoading(true);
    getComboRecommendations()
      .then((data) => setCombos(data.recommendations || []))
      .catch(() => setCombos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const handlePromote = async (combo: any) => {
    try {
      const newStatus = !combo.is_promoted;
      await promoteCombo(combo.primary_item_id, combo.recommended_item_id, newStatus);
      toast.success(newStatus ? "Combo promoted!" : "Combo demoted");
      fetchCombos(); // Refresh list
    } catch (err) {
      toast.error("Failed to update combo status");
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-card border border-border animate-slide-in">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-card-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Combo Recommendations
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Association-based suggestions to boost AOV</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : combos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Need more order history to generate combos. Place more orders to train the engine!
          </div>
        ) : (
          combos.slice(0, 5).map((combo, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {combo.is_promoted && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 animate-pulse">
                      <Star className="w-3 h-3 fill-primary" /> PROMOTED
                    </Badge>
                  )}
                  <span className="font-medium text-card-foreground">{combo.primary_item_name}</span>
                  <span className="text-muted-foreground mx-1">+</span>
                  <span className="font-medium text-card-foreground">{combo.recommended_item_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-chart-green text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {((combo.confidence_score ?? 0) > 1
                      ? (combo.confidence_score).toFixed(0)
                      : ((combo.confidence_score ?? 0) * 100).toFixed(0)
                    )}% confidence
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {combo.is_promoted ? "Prioritized for AI Upselling" : "Popular pairing"}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handlePromote(combo)}
                className={`transition-all duration-300 ${combo.is_promoted
                  ? "bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground shadow-none"
                  : "gradient-warm text-primary-foreground border-0 shadow-glow hover:opacity-90"
                  }`}
              >
                {combo.is_promoted ? "Demote" : "Promote"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComboSuggestions;
