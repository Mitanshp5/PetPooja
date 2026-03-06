import ComboSuggestions from "@/components/admin/ComboSuggestions";

const Analytics = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-display font-semibold text-card-foreground">Analytics & Upselling</h2>
            <p className="text-sm text-muted-foreground mt-1">Cross-selling opportunities and association rules.</p>
        </div>
        <ComboSuggestions />
    </div>
);

export default Analytics;
