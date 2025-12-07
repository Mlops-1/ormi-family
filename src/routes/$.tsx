import { createFileRoute, Link } from '@tanstack/react-router';
import { Home } from 'lucide-react';

export const Route = createFileRoute('/$')({
  component: NotFound,
});

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-sm w-full transition-colors duration-300">
        <div className="text-6xl mb-4">🏝️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          요청하신 페이지가 존재하지 않거나
          <br />
          이동되었을 수 있습니다.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-ormi-pink-500 hover:bg-ormi-pink-600 text-white rounded-xl font-medium transition-colors w-full justify-center"
        >
          <Home size={20} />
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
