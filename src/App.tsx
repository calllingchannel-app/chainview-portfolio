import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProviders } from "./providers/WalletProviders";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import LivePrices from "./pages/LivePrices";
import Settings from "./pages/Settings";
import AIPredictor from "./pages/AIPredictor";
import AIAgent from "./pages/AIAgent";
import NotFound from "./pages/NotFound";

const App = () => (
  <WalletProviders>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prices" element={<LivePrices />} />
          <Route path="/predictor" element={<AIPredictor />} />
          <Route path="/agent" element={<AIAgent />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </WalletProviders>
);

export default App;
