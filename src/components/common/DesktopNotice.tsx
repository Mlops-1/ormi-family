export default function DesktopNotice() {
  return (
    <div className="desktop-notice">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl mb-8">📱</div>
        <h1 className="text-4xl font-bold mb-4">
          모바일/태블릿 환경에 최적화되어 있습니다
        </h1>
        <p className="text-xl text-purple-100 mb-8">
          최상의 경험을 위해 모바일 기기나 태블릿에서 접속해주세요.
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <p className="text-sm text-purple-200 mb-2">
            또는 브라우저 개발자 도구에서
          </p>
          <p className="font-semibold">모바일 뷰로 전환해보세요</p>
          <p className="text-xs text-purple-300 mt-2">
            (F12 → 디바이스 툴바 토글)
          </p>
        </div>
      </div>
    </div>
  );
}
