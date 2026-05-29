"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface UseSortingStateOptions {
  defaultColumn?: string;
  defaultDirection?: SortDirection;
  paramPrefix?: string;
}

export function useSortingState({
  defaultColumn,
  defaultDirection = "asc",
  paramPrefix = "sort",
}: UseSortingStateOptions = {}): SortState & {
  setSortColumn: (column: string) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;
  clearSort: () => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortColumn = searchParams.get(`${paramPrefix}_by`) ?? defaultColumn ?? null;
  const sortDirection =
    (searchParams.get(`${paramPrefix}_dir`) as SortDirection) ?? defaultDirection;

  const updateUrlParams = useCallback(
    (newColumn: string | null, newDirection: SortDirection) => {
      const params = new URLSearchParams(searchParams);

      if (newColumn) {
        params.set(`${paramPrefix}_by`, newColumn);
        params.set(`${paramPrefix}_dir`, newDirection);
      } else {
        params.delete(`${paramPrefix}_by`);
        params.delete(`${paramPrefix}_dir`);
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, paramPrefix]
  );

  const setSortColumn = useCallback(
    (column: string) => {
      updateUrlParams(column, sortDirection);
    },
    [sortDirection, updateUrlParams]
  );

  const setSortDirection = useCallback(
    (direction: SortDirection) => {
      if (sortColumn) {
        updateUrlParams(sortColumn, direction);
      }
    },
    [sortColumn, updateUrlParams]
  );

  const toggleSortDirection = useCallback(() => {
    if (sortColumn) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      updateUrlParams(sortColumn, newDirection);
    }
  }, [sortColumn, sortDirection, updateUrlParams]);

  const clearSort = useCallback(() => {
    updateUrlParams(null, defaultDirection);
  }, [updateUrlParams, defaultDirection]);

  return useMemo(
    () => ({
      column: sortColumn,
      direction: sortDirection,
      setSortColumn,
      setSortDirection,
      toggleSortDirection,
      clearSort,
    }),
    [sortColumn, sortDirection, setSortColumn, setSortDirection, toggleSortDirection, clearSort]
  );
}
