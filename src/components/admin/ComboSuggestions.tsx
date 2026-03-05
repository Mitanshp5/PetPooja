import { comboSuggestions } from "@/data/mockData";
import { Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComboSuggestions = () => (
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
      {comboSuggestions.map((combo) => (
        <div key={combo.id} className="p-5 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {combo.items.map((item, i) => (
                <span key={i}>
                  <span className="font-medium text-card-foreground">{item}</span>
                  {i < combo.items.length - 1 && <span className="text-muted-foreground mx-1">+</span>}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground line-through">₹{combo.individualTotal}</span>
              <span className="font-bold text-primary text-base">₹{combo.comboPrice}</span>
              <span className="flex items-center gap-1 text-chart-green text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5" />+{combo.expectedLift}% AOV lift
              </span>
              <span className="text-xs text-muted-foreground">{combo.confidence}% confidence</span>
            </div>
          </div>
          <Button size="sm" className="gradient-warm text-primary-foreground border-0 shadow-glow hover:opacity-90">
            Activate
          </Button>
        </div>
      ))}
    </div>
  </div>
);

export default ComboSuggestions;
