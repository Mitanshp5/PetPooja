import { LayoutDashboard, UtensilsCrossed, BarChart3, Mic, Settings, ChevronRight } from "lucide-react";
import { Link, useLocation, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Menu", icon: UtensilsCrossed, to: "/admin/menu" },
  { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
  { label: "Voice Copilot", icon: Mic, to: "/admin/voice" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];

const AdminDashboard = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 gradient-dark border-r border-sidebar-border sticky top-0 h-screen overflow-y-auto">

        <div className="p-6">
          <h1 className="font-display font-bold text-xl text-primary-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center text-sm">🍽</span>
            RevCopilot
          </h1>
          <p className="text-xs text-sidebar-foreground mt-1">Restaurant Intelligence</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === "/admin" && location.pathname === "/admin");
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent border border-sidebar-border">
          <p className="text-xs text-sidebar-foreground">Quick links</p>
          <Link to="/menu" className="flex items-center gap-1 text-xs text-sidebar-primary mt-2 hover:underline">
            Customer Menu <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/kitchen" className="flex items-center gap-1 text-xs text-sidebar-primary mt-1 hover:underline">
            Kitchen Display <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-muted/20">
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-warm flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">A</div>
          </div>
        </header>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
