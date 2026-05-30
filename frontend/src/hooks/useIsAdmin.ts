"use client";

import { useState, useEffect } from "react";
import { getAdminApiKey } from "@/lib/adminApi";

/** Returns true when a verified admin key is stored in localStorage. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(getAdminApiKey() !== null);
  }, []);

  return isAdmin;
}
