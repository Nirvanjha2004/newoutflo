import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authStore, useAuthStore } from "@/api/store/authStore";
import { AUTHENTICATED_ROUTES, ROOT_ROUTE, UNAUTHENTICATED_ROUTES } from "@/constants/NavigationHandlerConstants";

export const useLocationPathname = () => {
  return location.pathname.replace(/\/+$/, "");
};

// Helper function to check if a path should be authenticated
const isAuthenticatedPath = (path: string) => {
  // Direct match
  if (AUTHENTICATED_ROUTES.includes(path)) return true;

  // Check for dynamic route patterns
  return AUTHENTICATED_ROUTES.some((route) => path.startsWith(route + "/"));
};

export const useNavigationHandler = () => {
  const locationPathname = useLocationPathname();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuthStore();
  const isAuthenticatedRef = useRef(authStore.getState().isAuthenticated);

  const loadingRef = useRef(true);
  const [loading, setLoading] = useState(loadingRef.current);

  useEffect(() => {
    // Check if current path needs authentication
    if (
      !isAuthenticatedRef.current &&
      (isAuthenticatedPath(locationPathname) || locationPathname === ROOT_ROUTE)
    ) {
      navigate("/login");
    }

    if (isAuthenticatedRef.current && !loading) {
      if (
        UNAUTHENTICATED_ROUTES.includes(locationPathname) ||
        locationPathname === ROOT_ROUTE
      ) {
        navigate("/inbox");
      }
    }
  }, [locationPathname, navigate, isAuthenticated, loading]);

  return { isAuthenticated, isAuthenticatedRef, loading, setLoading, loadingRef };
};
