import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignUpPage";
import Inbox from "./pages/Inbox";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignsList from "./pages/CampaignsList";
import ComingSoon from "./pages/ComingSoon";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import ViewCampaignPage from "./pages/ViewCampaignPage";
import { Root } from "./root";
import { FullPageLoaderStyles } from "./components/FullPageLoader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FullPageLoaderStyles />
        <Routes>
          {/* Auth routes - no layout, public access */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes - wrapped with Root component for auth check */}
          <Route element={<Root />}>
            {/* Dashboard routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ComingSoon />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/campaign" element={<CreateCampaign />} />
            
            {/* Campaign routes */}
            <Route path="/campaign/view/:id" element={<ViewCampaignPage />} />
            <Route path="/campaign/edit/:id" element={<CreateCampaign />} />
            <Route path="/campaign/analytics/:id" element={<CampaignAnalytics />} />
            <Route path="/allcampaigns" element={<CampaignsList />} />
            
            {/* Other protected routes */}
            <Route path="/calendar" element={<ComingSoon />} />
            <Route path="/analytics" element={<ComingSoon />} />
            <Route path="/settings" element={<ComingSoon />} />
            <Route path="/coming-soon/:feature" element={<ComingSoon />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
