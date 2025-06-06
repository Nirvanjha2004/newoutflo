import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignUpPage";
import Inbox from "./pages/Inbox";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignsList from "./pages/CampaignsList";
import ComingSoon from "./pages/ComingSoon";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes - no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Dashboard routes */}
          <Route path="/" element={<ComingSoon />} /> {/* Dashboard is coming soon */}
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/campaign" element={<CreateCampaign />} />
          <Route path="/allcampaigns" element={<CampaignsList />} />
          
          {/* Coming soon pages */}
          <Route path="/dashboard" element={<ComingSoon />} />
          <Route path="/calendar" element={<ComingSoon />} />
          <Route path="/analytics" element={<ComingSoon />} />
          <Route path="/settings" element={<ComingSoon />} />
          <Route path="/coming-soon/:feature" element={<ComingSoon />} /> {/* Dynamic route for any feature */}
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
