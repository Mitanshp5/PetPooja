import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import MobileMenu from "./pages/MobileMenu";
import KitchenDisplay from "./pages/KitchenDisplay";
import NotFound from "./pages/NotFound";

import Overview from "./pages/admin/Overview";
import MenuIntelligence from "./pages/admin/MenuIntelligence";
import Analytics from "./pages/admin/Analytics";
import VoiceCopilot from "./pages/admin/VoiceCopilot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Admin Nested Routes */}
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Overview />} />
            <Route path="menu" element={<MenuIntelligence />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="voice" element={<VoiceCopilot />} />
          </Route>

          {/* Customer Application Routes */}
          <Route path="/menu" element={<MobileMenu />} /> {/* Fallback without table */}
          <Route path="/m/:tableId" element={<MobileMenu />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
