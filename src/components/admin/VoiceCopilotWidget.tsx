import { Mic, Phone, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const VoiceCopilotWidget = () => {
    const [stats, setStats] = useState({
        status: "Active",
        calls_today: "-",
        orders_via_voice: 0,
        avg_upsell_per_call: 0,
        languages: "EN, HI, Hinglish"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("http://localhost:8000/voice/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch voice stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-card rounded-lg shadow-card border border-border animate-slide-in overflow-hidden">
            <div className="gradient-dark p-5">
                <h3 className="font-display font-semibold text-lg text-primary-foreground flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Voice Copilot Status
                </h3>
                <p className="text-sm text-sidebar-foreground mt-0.5">AI phone ordering assistant</p>
            </div>
            
            {loading ? (
                <div className="p-10 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="flex items-center gap-2 text-sm font-medium text-chart-green">
                            <span className="w-2 h-2 rounded-full bg-chart-green animate-pulse-glow" />
                            {stats.status}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Calls Today</span>
                        <span className="text-sm font-medium text-card-foreground">{stats.calls_today}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Records via Voice</span>
                        <span className="text-sm font-medium text-card-foreground">{stats.orders_via_voice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Voice AOV</span>
                        <span className="text-sm font-medium text-primary">₹{stats.avg_upsell_per_call.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Languages Active</span>
                        <span className="text-sm font-medium text-card-foreground">{stats.languages}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => toast.info("Call Logs Dashboard coming in Phase 6.")}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
        >
          <Phone className="w-4 h-4" /> Call Logs
        </button>
        <button
          onClick={() => window.open('/m/test-call', '_blank')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg gradient-warm text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Mic className="w-4 h-4" /> Test Call
        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceCopilotWidget;
