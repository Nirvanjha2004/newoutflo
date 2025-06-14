import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/api/store/authStore"; // Update this path to your auth hook
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

type FullPageLoaderProps = {
  error?: boolean;
  routeError?: boolean;
};

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ error, routeError }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore() || {}; // Get user from your auth context

  if (error || routeError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center relative">
        {/* User info if logged in */}
        {user?.email && (
          <div className="absolute top-10 left-10 animate-fade-in">
            <p className="text-xs text-gray-500">Logged in as:</p>
            <p className="text-sm font-medium text-gray-700 mt-1">{user.email}</p>
          </div>
        )}

        {/* Back button */}
        <div className="absolute top-10 right-10 z-10 animate-fade-in">
          <Button
            variant="ghost"
            className="text-sm text-gray-600 hover:bg-gray-100"
            onClick={() => navigate("/")}
          >
            &larr; Back to Bloom
          </Button>
        </div>

        {/* Main error message */}
        <div className="flex flex-col items-center animate-fade-in">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
            <h1 className="text-4xl font-bold text-gray-800">
              {routeError ? "404" : "Error"}
            </h1>
          </div>
          <p className="text-gray-600 text-center max-w-md">
            {routeError
              ? "Sorry, the page you were looking for could not be found."
              : "Something went wrong. Please try again later."}
          </p>

          <Button
            className="mt-8 bg-primary hover:bg-primary/90"
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center">
      <div className="animate-fade-in flex flex-col items-center">
        <div className="w-20 h-20 mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
          <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse"></div>
          <Loader2 className="w-20 h-20 text-primary animate-spin absolute" />
        </div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5a41cd] to-[#7966e1] bg-clip-text text-transparent animate-pulse">
          bloom
        </h1>

        <p className="text-gray-500 mt-4">Loading your experience...</p>
      </div>
    </div>
  );
};

// Add this to your global css or in a style tag in this file
const styles = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
`;

// Add this to include the styles
const StyleTag = () => <style>{styles}</style>;

// Include this component somewhere in your app (like in _app.tsx)
export { StyleTag as FullPageLoaderStyles };
