import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPage1,
});

function LandingPage1() {
  return (
    <div className="max-w-6xl mx-auto text-center">
      <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
        Welcome to Landing Page 1
      </h1>
      <p className="text-xl text-purple-100 mb-12">
        This is the first landing page built with TanStack Router & Tailwind CSS
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:bg-white/20">
          <div className="text-5xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-white mb-3">Fast</h3>
          <p className="text-purple-100">
            Lightning-fast routing with TanStack Router
          </p>
        </div>

        <div className="p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:bg-white/20">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-white mb-3">Type-Safe</h3>
          <p className="text-purple-100">
            100% TypeScript support with full type inference
          </p>
        </div>

        <div className="p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:bg-white/20">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="text-2xl font-bold text-white mb-3">Modern</h3>
          <p className="text-purple-100">
            Built with the latest React and Vite technologies
          </p>
        </div>
      </div>
    </div>
  );
}
