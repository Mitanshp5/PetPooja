import { Link } from "react-router-dom";
import { LayoutDashboard, Smartphone, ChefHat, ArrowRight } from "lucide-react";

const panels = [
  { to: "/admin", icon: LayoutDashboard, title: "Admin Dashboard", desc: "Revenue intelligence, menu analytics & voice copilot", gradient: "gradient-warm" },
  { to: "/menu", icon: Smartphone, title: "Mobile Menu", desc: "Customer-facing QR menu with ordering", gradient: "gradient-cool" },
  { to: "/kitchen", icon: ChefHat, title: "Kitchen Display", desc: "Live KOT queue & order management", gradient: "gradient-dark" },
];

const Index = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-6">
    <div className="text-center max-w-3xl w-full">
      <div className="w-14 h-14 rounded-2xl gradient-warm flex items-center justify-center mx-auto mb-6 shadow-glow text-2xl">🍽</div>
      <h1 className="font-display font-bold text-4xl text-foreground mb-2">RevCopilot</h1>
      <p className="text-muted-foreground mb-10">AI-Powered Revenue & Voice Copilot for Restaurants</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panels.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="group bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-all text-left"
          >
            <div className={`w-11 h-11 rounded-xl ${p.gradient} flex items-center justify-center mb-4`}>
              <p.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-display font-semibold text-card-foreground mb-1 flex items-center gap-2">
              {p.title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default Index;
