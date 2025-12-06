import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/landing2')({
  component: LandingPage2,
});

function LandingPage2() {
  return (
    <div className="max-w-6xl mx-auto text-center">
      <h1 className="text-6xl font-bold mb-4 bg-linear-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
        Welcome to Landing Page 2
      </h1>
      <p className="text-xl text-purple-100 mb-12">
        This is the second landing page with impressive statistics
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="p-10 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-6xl font-bold text-white mb-2 bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text">
            1000+
          </h2>
          <p className="text-xl text-purple-100 font-semibold">Happy Users</p>
        </div>

        <div className="p-10 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-6xl font-bold text-white mb-2 bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text">
            50+
          </h2>
          <p className="text-xl text-purple-100 font-semibold">Features</p>
        </div>

        <div className="p-10 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-6xl font-bold mb-2 bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            24/7
          </h2>
          <p className="text-xl text-purple-100 font-semibold">Support</p>
        </div>
      </div>
    </div>
  );
}
