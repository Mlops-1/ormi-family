import FavoriteMapModal from '@/components/FavoriteMapModal';
import useTmapScript from '@/hooks/useTmapScript';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Map } from 'lucide-react';
import { useState } from 'react';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [showFavoriteMap, setShowFavoriteMap] = useState(false);

  // Ensure Tmap script is loaded globally
  useTmapScript();

  return (
    /* Outer Layout: Responsive container */
    <div className="min-h-screen w-full flex justify-center bg-gray-900 transition-colors duration-300">
      {/* <ThemeToggle /> */}

      {/* App Container - Simple max-width responsive layout */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl min-h-screen bg-white dark:bg-slate-800 shadow-xl overflow-hidden relative transition-colors duration-300">
        <Outlet />
      </div>

      <TanStackRouterDevtools />

      {/* Global Floating Favorite Map Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setShowFavoriteMap(true)}
          className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-jeju-light-primary hover:bg-orange-50 border-2 border-jeju-light-primary transition-transform hover:scale-105 active:scale-95"
        >
          <Map size={28} />
        </button>
      </div>

      {/* Global Favorite Map Modal */}
      {showFavoriteMap && (
        <FavoriteMapModal onClose={() => setShowFavoriteMap(false)} />
      )}
    </div>
  );
}
