import DesktopNotice from '@/components/DesktopNotice';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <div className="desktop-wrapper">
      {/* 모바일/태블릿 뷰 */}
      <div className="mobile-container">
        <div className="min-h-screen bg-purple-600">
          <nav className="bg-purple-800 shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex gap-4 justify-center">
                <Link
                  to="/"
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white font-semibold transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl"
                  activeProps={{
                    className:
                      'px-6 py-3 bg-white/30 backdrop-blur-sm rounded-lg text-white font-semibold shadow-xl',
                  }}
                >
                  Landing Page 1
                </Link>
                <Link
                  to="/landing2"
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white font-semibold transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl"
                  activeProps={{
                    className:
                      'px-6 py-3 bg-white/30 backdrop-blur-sm rounded-lg text-white font-semibold shadow-xl',
                  }}
                >
                  Landing Page 2
                </Link>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            <Outlet />
          </main>
          <TanStackRouterDevtools />
        </div>
      </div>

      {/* 데스크톱 안내 메시지 */}
      <DesktopNotice />
    </div>
  ),
});
