import React, { useCallback, useEffect, useState } from "react";

import { Outlet, useNavigate } from "react-router-dom";

import { authStore } from "@/api/store/authStore";
import { AUTHENTICATED_ROUTES, ROOT_ROUTE } from "@/constants/NavigationHandlerConstants";
import { useLocationPathname, useNavigationHandler } from "@/hooks/useNavigationHandler";
import { FullPageLoader } from "./components/FullPageLoader";

export const Root = () => {
  const [hydrationLoading, setHydrationLoading] = useState(false);

  const { isAuthenticated, isAuthenticatedRef, loadingRef, loading, setLoading } = useNavigationHandler();

  const storeHydrationHandler = useCallback(async () => {
    setHydrationLoading(true);
    await authStore.persist.rehydrate();
    setHydrationLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoading(loadingRef.current);
  });

  useEffect(() => {
    const authUnsub = authStore.subscribe((state, _) => (isAuthenticatedRef.current = state.isAuthenticated));
    return () => {
      authUnsub();
    };
  }, [isAuthenticatedRef]);

  useEffect(() => {
    document.addEventListener("visibilitychange", storeHydrationHandler);
    return () => {
      document.removeEventListener("visibilitychange", storeHydrationHandler);
    };
  }, [storeHydrationHandler]);

  const locationPathname = useLocationPathname();
  const navigate = useNavigate();

  useEffect(() => {
    const path = locationPathname;
    const needsAuth =
      AUTHENTICATED_ROUTES.some((route) => path === route || path.startsWith(route + "/")) || path === ROOT_ROUTE;

    if (!isAuthenticatedRef.current && needsAuth) {
      navigate("/login");
    }
  }, [isAuthenticatedRef, locationPathname, navigate, isAuthenticated]);

  useEffect(() => {
    loadingRef.current = true;
    setLoading(true);
    if (isAuthenticatedRef.current) {
      if (!hydrationLoading) {
        loadingRef.current = false;
        setLoading(false);
      }
    } else {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hydrationLoading, isAuthenticatedRef, loadingRef, setLoading]);

  return (
    <>
      {loading ? <FullPageLoader /> : <Outlet />}
    </>
  );
};
