import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import Logo from '@/components/common/Logo';
import Notification from '@/components/common/Notification';
import SocialButton from '@/components/common/SocialButton';
import { useAuth } from '../hooks/useAuth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { loginWithGoogle, loginWithX, error, isAuthenticated } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = Route.useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      await loginWithGoogle();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Failed to login with Google'
      );
    }
  };

  const handleXLogin = async () => {
    try {
      setLocalError(null);
      await loginWithX();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Failed to login with X'
      );
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-jeju-light-background dark:bg-jeju-dark-background p-4">
      {displayError && (
        <Notification
          items={[
            {
              type: 'error',
              content: displayError,
              id: 'login-error',
              onDismiss: () => setLocalError(null),
            },
          ]}
        />
      )}

      <div className="w-full max-w-md">
        <div className="bg-jeju-light-surface dark:bg-jeju-dark-surface rounded-2xl shadow-xl p-8 border border-jeju-light-divider dark:border-jeju-dark-divider">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-jeju-light-text-primary dark:text-jeju-dark-text-primary mb-2">
              Welcome to ORMI Family
            </h1>
            <p className="text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary">
              Sign in to discover family-friendly spots
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <SocialButton provider="google" onClick={handleGoogleLogin}>
              Continue with Google
            </SocialButton>

            <SocialButton provider="x" onClick={handleXLogin}>
              Continue with X
            </SocialButton>
          </div>

          {/* Terms and Privacy */}
          <p className="text-xs text-jeju-light-text-disabled dark:text-jeju-dark-text-disabled text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
