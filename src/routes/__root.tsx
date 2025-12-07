import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    /* Outer Layout: White on Mobile/Tablet, Dark on Desktop */
    <div className="min-h-screen w-full bg-white lg:bg-slate-900 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-4 transition-colors duration-300">
      {/* Desktop Helper Text */}
      <div className="hidden lg:block mb-8 text-center animate-fade-in">
        <h2 className="text-white/90 text-2xl font-bold mb-2">ORMI FAMILY</h2>
        <p className="text-white/50 text-sm font-light">
          모바일 앱에 최적화된 서비스입니다.
          <br />
          태블릿이나 모바일 기기에서 이용 권장드립니다.
        </p>
      </div>

      {/* App Container / Device Frame */}
      {/* Mobile/Tablet: Full width/min-height, No borders */}
      {/* Desktop: Fixed size (Phone Mockup), Borders, Rounded, Shadow */}
      <div
        className="
        relative w-full min-h-screen
        lg:min-h-0 lg:w-[400px] lg:h-[800px] lg:max-h-[90vh]
        lg:bg-white lg:rounded-[3rem] 
        lg:shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] 
        lg:border-[12px] lg:border-slate-800 
        lg:ring-4 lg:ring-slate-700/30
        lg:overflow-hidden
      "
      >
        {/* Notch - Visible Only on Desktop */}
        <div className="hidden lg:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-[1.2rem] z-50 pointer-events-none items-center justify-center">
          <div className="w-16 h-1.5 bg-slate-700/30 rounded-full mb-1"></div>
        </div>

        {/* Content Area */}
        {/* On Mobile: standard flow. On Desktop: scrollable within frame */}
        <div
          className="
          relative w-full h-full 
          lg:overflow-y-auto lg:bg-white lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:'none'] lg:[scrollbar-width:'none']
        "
        >
          <Outlet />
        </div>

        <TanStackRouterDevtools />
      </div>
    </div>
  ),
});
