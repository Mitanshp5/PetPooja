import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Search, Leaf, ShoppingCart, Plus, Minus, QrCode, Loader2 } from "lucide-react";
import VoiceOrderingAssistant from "@/components/voice/VoiceOrderingAssistant";
import { toast } from "sonner";
import { usePlaceOrder, useMenu } from "@/hooks/useApi";

const MobileMenu = () => {
  const { tableId } = useParams();
  const { mutateAsync: placeOrder } = usePlaceOrder();
  const { data: menuItems = [], isLoading } = useMenu();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  // Dynamically derive categories from live menu items
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(menuItems.map(item => item.category))];
    return cats;
  }, [menuItems]);

  const handleVoiceCartUpdate = (data: any) => {
    if (data.function === 'process_order' && data.args.items) {
      setCart((prev) => {
        let newCart = { ...prev };
        data.args.items.forEach((item: any) => {
          // Attempt to find the item ID based on the name from the live data
          const menuItem = menuItems.find(m => m.name.toLowerCase() === item.item_name.toLowerCase());
          if (menuItem) {
            const id = menuItem.id || menuItem._id;
            if (id) {
              if (item.action === 'add') {
                newCart[id] = (newCart[id] || 0) + item.quantity;
              } else if (item.action === 'remove') {
                const current = newCart[id] || 0;
                if (current <= item.quantity) delete newCart[id];
                else newCart[id] = current - item.quantity;
              }
            }
          }
        });
        return newCart;
      });
    }
  };


  const filtered = menuItems.filter((item) => {
    const matchCategory = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = menuItems.find((m) => (m.id || m._id) === id);
    return total + (item ? item.selling_price * qty : 0);
  }, 0);

  const addToCart = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: string) => setCart((prev) => {
    const n = (prev[id] || 0) - 1;
    if (n <= 0) { const { [id]: _, ...rest } = prev; return rest; }
    return { ...prev, [id]: n };
  });

  const handleCheckout = async () => {
    if (cartCount === 0) return;

    // Map cart items
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find((m) => (m.id || m._id) === id);
      return {
        name: item?.name || "Unknown Item",
        qty: qty,
        modifiers: [],
        notes: ""
      };
    });

    const payload = {
      orderNumber: `KOT-${Math.floor(100 + Math.random() * 900)}`,
      items: orderItems,
      status: "new",
      type: "dine-in",
      table: tableId || "T-10",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      elapsed: 0
    };

    try {
      await placeOrder(payload);
      toast.success("Order placed successfully!");
      setCart({});
    } catch (error) {
      toast.error("Error placing order. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading Paratha Singh Menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Header */}
      <div className="gradient-warm px-5 pt-8 pb-6 rounded-b-3xl text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-xl">Menu</h1>
            <p className="text-sm opacity-90">

              {tableId ? `Table #${tableId}` : "Scan • Browse • Order"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
          <input
            className="w-full bg-white/20 text-white placeholder-white/50 rounded-xl py-2.5 pl-10 pr-4 text-sm border-0 outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Search parathas, sides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat
              ? "gradient-warm text-primary-foreground shadow-glow"
              : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="px-5 pb-28 space-y-3">
        {filtered.map((item) => {
          const id = (item.id || item._id) as string;
          return (
            <div key={id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center gap-4 animate-slide-in">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item.veg ? "border-chart-green" : "border-chart-red"}`}>
                    <span className={`w-2 h-2 rounded-full ${item.veg ? "bg-chart-green" : "bg-chart-red"}`} />
                  </span>
                  <h3 className="font-display font-semibold text-card-foreground truncate">{item.name}</h3>
                </div>
                {item.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.description}</p>}
                <span className="font-bold text-foreground">₹{item.selling_price}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                {cart[id] ? (
                  <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-1">
                    <button onClick={() => removeFromCart(id)} className="w-7 h-7 flex items-center justify-center text-primary">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-primary w-4 text-center">{cart[id]}</span>
                    <button onClick={() => addToCart(id)} className="w-7 h-7 flex items-center justify-center text-primary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(id)}
                    className="px-4 py-1.5 rounded-lg border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    ADD
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Voice Assistant */}
      <VoiceOrderingAssistant onCartUpdate={handleVoiceCartUpdate} />

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-5">
          <div className="gradient-warm rounded-2xl p-4 shadow-elevated flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
              <span className="text-primary-foreground/80">|</span>
              <span className="font-bold">₹{cartTotal}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="bg-primary-foreground/20 text-primary-foreground font-semibold px-5 py-2 rounded-xl text-sm hover:bg-primary-foreground/30 transition-colors"
            >
              Place Order →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;

