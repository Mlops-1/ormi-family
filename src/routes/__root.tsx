import ThemeToggle from '@/components/ThemeToggle';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    /* Outer Layout: Responsive container */
    <div className="min-h-screen w-full flex justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />

      {/* App Container - Simple max-width responsive layout */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl min-h-screen bg-white dark:bg-slate-800 shadow-xl overflow-hidden relative transition-colors duration-300">
        <Outlet />
      </div>

      <TanStackRouterDevtools />
    </div>
  ),
});
