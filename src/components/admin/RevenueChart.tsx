import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { getRevenueTrends } from "@/lib/api";
import { Loader2 } from "lucide-react";

const RevenueChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueTrends()
      .then((res) => {
        const formatted = res.trends.map((item: any) => {
          const date = new Date(item.day);
          return {
            ...item,
            // Format to something clean like "Mon"
            day: date.toLocaleDateString('en-US', { weekday: 'short' })
          };
        });
        setData(formatted);
      })
      .catch((err) => console.error("Error fetching trends:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[340px]">
        <div className="bg-card rounded-lg border border-border flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <div className="bg-card rounded-lg border border-border flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-lg shadow-card border border-border p-5 animate-slide-in">
        <h3 className="font-display font-semibold text-card-foreground mb-1">Weekly Revenue</h3>
        <p className="text-sm text-muted-foreground mb-4">Daily revenue breakdown</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip
              contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 88%)", borderRadius: "8px", fontSize: "13px" }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="hsl(25 95% 53%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-lg shadow-card border border-border p-5 animate-slide-in">
        <h3 className="font-display font-semibold text-card-foreground mb-1">Order Trends</h3>
        <p className="text-sm text-muted-foreground mb-4">Daily order count</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 88%)", borderRadius: "8px", fontSize: "13px" }}
            />
            <Line type="monotone" dataKey="orders" stroke="hsl(160 60% 45%)" strokeWidth={2.5} dot={{ fill: "hsl(160 60% 45%)", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;

