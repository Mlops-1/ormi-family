import Notification from '@/components/common/Notification';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { authService } from '../../services/AuthService';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = Route.useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setProcessing(true);

        const urlParams = new URLSearchParams(window.location.search);

        // Handle OAuth callback
        const result = await authService.handleOAuthCallback();

        if (!result.success) {
          // Check if user cancelled the authentication
          const errorParam = urlParams.get('error');

          if (errorParam === 'access_denied') {
            // User cancelled, redirect to login silently
            navigate({ to: '/login' });
            return;
          }

          throw new Error(result.error || 'Authentication failed');
        }

        if (!result.ciValue) {
          throw new Error('No user identity received');
        }

        // Always redirect to home page after successful authentication
        // User can complete onboarding by clicking the onboarding icon in the header
        navigate({ to: '/' });
      } catch (err) {
        console.error('OAuth callback error:', err);

        // Check for network errors
        if (
          err instanceof Error &&
          (err.message.includes('network') || err.message.includes('fetch'))
        ) {
          setError(
            'Network error occurred. Please check your connection and try again.'
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to complete authentication'
          );
        }

        setProcessing(false);

        // Redirect to login after showing error
        setTimeout(() => {
          navigate({ to: '/login' });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-ormi-ember-50 to-ormi-ember-100 p-4">
      {error && (
        <Notification
          items={[
            {
              type: 'error',
              content: error,
              id: 'callback-error',
            },
          ]}
        />
      )}

      <div className="text-center">
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ormi-ember-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600">Please wait a moment</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}
