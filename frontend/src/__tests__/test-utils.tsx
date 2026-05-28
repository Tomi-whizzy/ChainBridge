/**
 * Custom render utilities for React Testing Library
 *
 * Provides a custom render function that wraps components with all necessary providers
 * (Router, Theme, React Query, etc.) to simplify component testing.
 *
 * @example
 * ```typescript
 * import { render, screen } from '@/__tests__/test-utils';
 * import { MyComponent } from './MyComponent';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */

import { ReactElement, ReactNode } from "react";
import { render as rtlRender, RenderOptions, RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

/**
 * Custom render options extending RTL's RenderOptions
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Initial route for the router
   * @default '/'
   */
  initialRoute?: string;

  /**
   * Custom QueryClient instance
   * If not provided, a new QueryClient with test-friendly defaults will be created
   */
  queryClient?: QueryClient;

  /**
   * Initial theme
   * @default 'light'
   */
  theme?: "light" | "dark" | "system";

  /**
   * Additional wrapper components
   * Will be composed with the default providers
   */
  wrapper?: ({ children }: { children: ReactNode }) => ReactElement;
}

/**
 * Creates a QueryClient with test-friendly defaults
 * - Disables retries
 * - Disables cache time
 * - Suppresses error logging
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * All providers wrapper component
 */
function AllProviders({
  children,
  queryClient,
  theme = "light",
}: {
  children: ReactNode;
  queryClient: QueryClient;
  theme?: "light" | "dark" | "system";
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @param ui - The component to render
 * @param options - Custom render options
 * @returns RTL render result with additional utilities
 *
 * @example
 * ```typescript
 * const { rerender, unmount } = render(<MyComponent />, {
 *   theme: 'dark',
 *   queryClient: customQueryClient,
 * });
 * ```
 */
export function render(ui: ReactElement, options: CustomRenderOptions = {}): RenderResult {
  const {
    queryClient = createTestQueryClient(),
    theme = "light",
    wrapper: CustomWrapper,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const content = (
      <AllProviders queryClient={queryClient} theme={theme}>
        {children}
      </AllProviders>
    );

    if (CustomWrapper) {
      return <CustomWrapper>{content}</CustomWrapper>;
    }

    return content;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Renders a component with a custom QueryClient for testing React Query hooks
 *
 * @param ui - The component to render
 * @param queryClient - Custom QueryClient instance
 * @returns RTL render result
 *
 * @example
 * ```typescript
 * const queryClient = new QueryClient();
 * renderWithQueryClient(<MyComponent />, queryClient);
 * ```
 */
export function renderWithQueryClient(ui: ReactElement, queryClient?: QueryClient): RenderResult {
  return render(ui, { queryClient: queryClient ?? createTestQueryClient() });
}

/**
 * Renders a component with a specific theme
 *
 * @param ui - The component to render
 * @param theme - Theme to use ('light' | 'dark' | 'system')
 * @returns RTL render result
 *
 * @example
 * ```typescript
 * renderWithTheme(<MyComponent />, 'dark');
 * ```
 */
export function renderWithTheme(
  ui: ReactElement,
  theme: "light" | "dark" | "system" = "light"
): RenderResult {
  return render(ui, { theme });
}

/**
 * Creates a mock QueryClient for testing
 * Useful when you need to pre-populate the cache or configure specific behavior
 *
 * @returns A new QueryClient instance with test-friendly defaults
 *
 * @example
 * ```typescript
 * const queryClient = createMockQueryClient();
 * queryClient.setQueryData(['orders'], mockOrders);
 * render(<OrdersList />, { queryClient });
 * ```
 */
export function createMockQueryClient(): QueryClient {
  return createTestQueryClient();
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";

// Re-export userEvent for convenience
export { default as userEvent } from "@testing-library/user-event";
