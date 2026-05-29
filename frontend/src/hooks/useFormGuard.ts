"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export interface UseFormGuardOptions {
  enabled?: boolean;
  message?: string;
  onBeforeUnload?: () => boolean;
  onRouteChange?: () => boolean | Promise<boolean>;
}

/**
 * Hook to guard against unsaved form changes
 * Prevents navigation and page unload when form has unsaved changes
 */
export function useFormGuard(hasUnsavedChanges: boolean, options: UseFormGuardOptions = {}) {
  const {
    enabled = true,
    message = "You have unsaved changes. Are you sure you want to leave?",
    onBeforeUnload,
    onRouteChange,
  } = options;

  const router = useRouter();
  const isNavigatingRef = useRef(false);

  // Handle browser navigation (back/forward/refresh/close)
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Allow custom handler to override
      if (onBeforeUnload && !onBeforeUnload()) {
        return;
      }

      e.preventDefault();
      // Modern browsers ignore custom messages and show their own
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges, message, onBeforeUnload]);

  // Programmatic navigation guard
  const confirmNavigation = useCallback(async (): Promise<boolean> => {
    if (!enabled || !hasUnsavedChanges) return true;

    // Allow custom handler
    if (onRouteChange) {
      const result = await onRouteChange();
      return result;
    }

    // Default confirmation dialog
    return window.confirm(message);
  }, [enabled, hasUnsavedChanges, message, onRouteChange]);

  // Wrapper for router navigation methods
  const guardedRouter = {
    push: async (href: string) => {
      if (await confirmNavigation()) {
        isNavigatingRef.current = true;
        router.push(href);
      }
    },
    replace: async (href: string) => {
      if (await confirmNavigation()) {
        isNavigatingRef.current = true;
        router.replace(href);
      }
    },
    back: async () => {
      if (await confirmNavigation()) {
        isNavigatingRef.current = true;
        router.back();
      }
    },
    forward: async () => {
      if (await confirmNavigation()) {
        isNavigatingRef.current = true;
        router.forward();
      }
    },
  };

  return {
    confirmNavigation,
    guardedRouter,
    isNavigating: isNavigatingRef.current,
  };
}
