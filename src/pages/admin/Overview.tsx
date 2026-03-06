import StatCards from "@/components/admin/StatCards";
import RevenueChart from "@/components/admin/RevenueChart";

const Overview = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-display font-semibold text-card-foreground">Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">High-level revenue and performance stats.</p>
        </div>
        <StatCards />
        <RevenueChart />
    </div>
);

export default Overview;
