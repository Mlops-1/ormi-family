import { JejuPalettePreview } from '@/components/view/JejuPalettePreview';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/ormi-team')({
  component: OrmiTeamPage,
});

function OrmiTeamPage() {
  return (
    <main className="min-h-screen bg-jeju-light-background p-8 text-jeju-light-text-primary dark:bg-jeju-dark-background dark:text-jeju-dark-text-primary animate-fade-in">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">제주 감귤 컬러 팔레트</h1>
        <p className="mb-8 text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary">
          이 페이지는 개발팀 공유용 디자인 시스템 가이드입니다.
        </p>
        <JejuPalettePreview />
      </div>
    </main>
  );
}
