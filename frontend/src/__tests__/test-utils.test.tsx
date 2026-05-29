/**
 * Tests for custom test utilities
 * Demonstrates usage of custom render functions
 */

import { render, renderWithTheme, renderWithQueryClient, screen, waitFor } from "./test-utils";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";

// Test component that uses theme
function ThemedComponent() {
  const { theme } = useTheme();
  return <div data-testid="theme-display">Current theme: {theme}</div>;
}

// Test component that uses React Query
function QueryComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["test"],
    queryFn: async () => {
      return "test data";
    },
  });

  if (isLoading) return <div>Loading...</div>;
  return <div data-testid="query-result">{data}</div>;
}

describe("Test Utilities", () => {
  describe("render", () => {
    it("renders component with default providers", () => {
      render(<div>Hello World</div>);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("renders component with theme provider", () => {
      render(<ThemedComponent />);
      expect(screen.getByTestId("theme-display")).toBeInTheDocument();
    });
  });

  describe("renderWithTheme", () => {
    it("renders component with light theme", () => {
      renderWithTheme(<ThemedComponent />, "light");
      expect(screen.getByTestId("theme-display")).toHaveTextContent("light");
    });

    it("renders component with dark theme", () => {
      renderWithTheme(<ThemedComponent />, "dark");
      expect(screen.getByTestId("theme-display")).toHaveTextContent("dark");
    });
  });

  describe("renderWithQueryClient", () => {
    it("renders component with React Query provider", async () => {
      renderWithQueryClient(<QueryComponent />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("query-result")).toHaveTextContent("test data");
      });
    });
  });

  describe("custom wrapper", () => {
    it("renders with custom wrapper", () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="custom-wrapper">{children}</div>
      );

      render(<div>Content</div>, {
        wrapper: CustomWrapper,
      });

      expect(screen.getByTestId("custom-wrapper")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});
