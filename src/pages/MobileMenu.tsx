import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { menuItems, categories } from "@/data/mockData";
import { Search, Leaf, ShoppingCart, Plus, Minus, QrCode, X } from "lucide-react";
import VoiceOrderingAssistant from "@/components/voice/VoiceOrderingAssistant";

export interface CartItem {
  id: string; // Unique ID for this cart instance
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  modifiers: string[];
  notes: string;
}

const MobileMenu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const handleVoiceCartUpdate = (data: any) => {
    if (data.function === 'process_order' && data.args.items) {
      setCart((prev) => {
        let newCart = [...prev];
        data.args.items.forEach((item: any) => {
          const menuItem = menuItems.find(m => m.name.toLowerCase() === item.item_name.toLowerCase());
          if (menuItem) {
            if (item.action === 'add') {
              const existingIndex = newCart.findIndex(c => c.menuItemId === menuItem.id && c.modifiers.length === 0 && !c.notes);
              if (existingIndex >= 0) {
                newCart[existingIndex].qty += item.quantity;
              } else {
                newCart.push({
                  id: Date.now().toString() + Math.random().toString(),
                  menuItemId: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.sellingPrice,
                  qty: item.quantity,
                  modifiers: [],
                  notes: ""
                });
              }
            } else if (item.action === 'remove') {
              let qtyToRemove = item.quantity;
              for (let i = newCart.length - 1; i >= 0 && qtyToRemove > 0; i--) {
                if (newCart[i].menuItemId === menuItem.id) {
                  if (newCart[i].qty > qtyToRemove) {
                    newCart[i].qty -= qtyToRemove;
                    qtyToRemove = 0;
                  } else {
                    qtyToRemove -= newCart[i].qty;
                    newCart.splice(i, 1);
                  }
                }
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

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  
  const getQty = (menuItemId: string) => cart.filter(c => c.menuItemId === menuItemId).reduce((sum, c) => sum + c.qty, 0);

  const handleOpenCustomization = (item: any) => {
    setSelectedItem(item);
    setModifiers([]);
    setNotes("");
  };

  const confirmAddToCart = () => {
    if (!selectedItem) return;
    setCart(prev => {
      const existing = prev.findIndex(c => c.menuItemId === selectedItem.id && c.modifiers.join(',') === modifiers.join(',') && c.notes === notes);
      if (existing >= 0) {
        const next = [...prev];
        next[existing].qty += 1;
        return next;
      }
      return [...prev, {
        id: Date.now().toString() + Math.random().toString(),
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.sellingPrice,
        qty: 1,
        modifiers,
        notes
      }];
    });
    setSelectedItem(null);
  };

  const removeOneFromCart = (menuItemId: string) => {
    setCart(prev => {
      // Find the last added variant of this item
      const index = prev.map(c => c.menuItemId).lastIndexOf(menuItemId);
      if (index === -1) return prev;
      
      const next = [...prev];
      if (next[index].qty > 1) {
        next[index].qty -= 1;
      } else {
        next.splice(index, 1);
      }
      return next;
    });
  };

  const handleCheckout = () => {
    if (cartCount === 0) return;
    navigate("/cart", { state: { cart, tableId } });
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Header */}
      <div className="gradient-warm px-5 pt-8 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-xl text-primary-foreground">RevCopilot Café</h1>
            <p className="text-sm text-primary-foreground/80">
              {tableId ? `Table #${tableId}` : "Scan • Browse • Order"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/60" />
          <input
            className="w-full bg-primary-foreground/20 text-primary-foreground placeholder-primary-foreground/50 rounded-xl py-2.5 pl-10 pr-4 text-sm border-0 outline-none focus:ring-2 focus:ring-primary-foreground/30"
            placeholder="Search menu..."
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
        {filtered.map((item) => (
          <div key={item.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center gap-4 animate-slide-in">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item.veg ? "border-chart-green" : "border-chart-red"}`}>
                  <span className={`w-2 h-2 rounded-full ${item.veg ? "bg-chart-green" : "bg-chart-red"}`} />
                </span>
                <h3 className="font-display font-semibold text-card-foreground truncate">{item.name}</h3>
              </div>
              {item.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.description}</p>}
              <span className="font-bold text-foreground">₹{item.sellingPrice}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              {getQty(item.id) > 0 ? (
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-1">
                  <button onClick={() => removeOneFromCart(item.id)} className="w-7 h-7 flex items-center justify-center text-primary">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-primary w-4 text-center">{getQty(item.id)}</span>
                  <button onClick={() => handleOpenCustomization(item)} className="w-7 h-7 flex items-center justify-center text-primary">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCustomization(item)}
                  className="px-4 py-1.5 rounded-lg border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  ADD
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-elevated p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Customize {selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold mb-2 block">Modifiers (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {["Spicy", "Mild", "Jain"].map(mod => (
                    <button
                      key={mod}
                      onClick={() => setModifiers(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod])}
                      className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${modifiers.includes(mod) ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Customer Note</label>
                <textarea 
                  className="w-full bg-muted text-foreground placeholder-muted-foreground rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3}
                  placeholder="E.g. Extra onions, less oil..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              onClick={confirmAddToCart}
              className="w-full gradient-warm text-primary-foreground font-bold px-5 py-4 rounded-xl shadow-glow transition-all"
            >
              Confirm \u2013 Add to Cart
            </button>
          </div>
        </div>
      )}

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
              Review Order →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
