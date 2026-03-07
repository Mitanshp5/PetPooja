import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { usePlaceOrder } from "@/hooks/useApi";
import { useState } from "react";
import { CartItem } from "./MobileMenu";

const CartPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tableId: paramTableId } = useParams();
  const { mutateAsync: placeOrder } = usePlaceOrder();

  const [cart, setCart] = useState<CartItem[]>(location.state?.cart || []);
  const tableId = paramTableId || location.state?.tableId || null;

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  const addToCart = (id: string) => {
    setCart((prev) => prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const removeFromCart = (id: string) => setCart((prev) => {
    return prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: item.qty - 1 };
      }
      return item;
    }).filter(item => item.qty > 0);
  });

  const handlePlaceOrder = async () => {
    if (cartCount === 0) return;

    const orderItems = cart.map((item) => ({
      menu_item_id: item.menuItemId,
      name: item.name,
      qty: item.qty,
      modifiers: item.modifiers,
      notes: item.notes
    }));

    const payload = {
      orderNumber: "", // Backend will generate
      items: orderItems,
      status: "new",
      type: "dine-in",
      table: tableId || "Takeaway",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      elapsed: 0
    };

    try {
      await placeOrder(payload);
      toast.success("Order placed successfully!");
      navigate(tableId ? `/m/${tableId}` : "/menu");
    } catch (error) {
      toast.error("Error placing order. Please try again.");
    }
  };

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto relative flex flex-col items-center justify-center p-6 text-center">
        <Receipt className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => navigate(tableId ? `/m/${tableId}` : "/menu")}
          className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl w-full"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-28">
      {/* Header */}
      <div className="gradient-warm px-5 pt-8 pb-6 rounded-b-3xl flex items-center gap-4">
        <button
          onClick={() => navigate(tableId ? `/m/${tableId}` : "/menu", { state: { cart: cart } })}
          className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl text-primary-foreground">Your Cart</h1>
          <p className="text-sm text-primary-foreground/80">
            {tableId ? `Table #${tableId}` : "Takeaway Order"}
          </p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-5 py-6 space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Order Summary</h2>

        {cart.map((cartItem) => {
          return (
            <div key={cartItem.id} className="flex flex-col gap-2 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors p-2 rounded-xl -mx-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded border flex items-center justify-center border-chart-green">
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-green" />
                    </span>
                    <h3 className="font-display font-medium text-foreground truncate text-base">{cartItem.name}</h3>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground pl-5 mb-1.5">
                    ₹{cartItem.price}
                  </div>
                  {(cartItem.modifiers.length > 0 || cartItem.notes) && (
                    <div className="pl-5 space-y-1">
                      {cartItem.modifiers.length > 0 && (
                        <p className="text-xs text-muted-foreground italic flex flex-wrap gap-1">
                          {cartItem.modifiers.map(mod => (
                            <span key={mod} className="bg-primary/10 text-primary px-1.5 rounded-sm">{mod}</span>
                          ))}
                        </p>
                      )}
                      {cartItem.notes && (
                        <p className="text-xs text-sidebar-foreground border-l-2 border-primary/30 pl-2 py-0.5 mt-1 bg-muted/50 rounded-r-md">"{cartItem.notes}"</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 pt-1">
                  <div className="flex items-center gap-3 bg-primary/10 rounded-lg px-2 py-1 shadow-inner">
                    <button onClick={() => removeFromCart(cartItem.id)} className="w-6 h-6 flex items-center justify-center text-primary hover:bg-primary/20 rounded-md transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-primary w-4 text-center">{cartItem.qty}</span>
                    <button onClick={() => addToCart(cartItem.id)} className="w-6 h-6 flex items-center justify-center text-primary hover:bg-primary/20 rounded-md transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    ₹{cartItem.price * cartItem.qty}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5">
        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="flex justify-between items-center mb-2 text-muted-foreground text-sm">
            <span>Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-muted-foreground text-sm">
            <span>Taxes & Fees</span>
            <span>Included</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t font-bold text-lg">
            <span>Total</span>
            <span>₹{cartTotal}</span>
          </div>
        </div>
      </div>

      {/* Cart Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-5 mt-auto">
        <button
          onClick={handlePlaceOrder}
          className="w-full gradient-warm text-primary-foreground font-bold px-5 py-4 rounded-xl shadow-elevated hover:opacity-95 transition-all flex justify-between items-center"
        >
          <span>₹{cartTotal} • Place Order</span>
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default CartPage;
