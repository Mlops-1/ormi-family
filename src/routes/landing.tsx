import Logo from '@/components/Logo';
import SocialButton from '@/components/SocialButton';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/landing')({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  const handleSocialLogin = (_provider: 'google' | 'x') => {
    // Navigate to signup page
    navigate({ to: '/signup' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-linear-to-br from-ormi-blue-100 via-ormi-ember-100 to-ormi-pink-100">
      {/* Logo Section */}
      <div className="mb-16 text-center">
        <Logo size="large" className="mb-4" />
        <p className="text-lg text-gray-600 font-medium">
          함께 성장하는 개발자 커뮤니티
        </p>
      </div>

      {/* Social Login Buttons */}
      <div className="w-full max-w-sm space-y-4">
        <SocialButton
          provider="google"
          onClick={() => handleSocialLogin('google')}
        >
          Google로 시작하기
        </SocialButton>

        <SocialButton provider="x" onClick={() => handleSocialLogin('x')}>
          X로 시작하기
        </SocialButton>
      </div>

      {/* Footer Text */}
      <p className="mt-12 text-sm text-gray-500 text-center">
        계속 진행하면 서비스 약관 및 개인정보 보호정책에 동의하게 됩니다
      </p>
    </div>
  );
}
