import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import Checkbox from '../components/Checkbox';
import Input from '../components/Input';
import Logo from '../components/Logo';
import Notification from '../components/Notification';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { AccessibilityCondition, SpotCategory } from '../types/auth';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { isAuthenticated, isProfileComplete } = useAuth();
  const { createProfile } = useProfile();
  const navigate = Route.useNavigate();

  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  const [selectedCategories, setSelectedCategories] = useState<SpotCategory[]>(
    []
  );
  const [categoriesError, setCategoriesError] = useState('');

  const [selectedConditions, setSelectedConditions] = useState<
    AccessibilityCondition[]
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  // Redirect if profile is already complete
  useEffect(() => {
    if (isProfileComplete) {
      navigate({ to: '/' });
    }
  }, [isProfileComplete, navigate]);

  const validateNickname = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNicknameError('Nickname is required');
      return false;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setNicknameError('Nickname must be at least 2 characters');
      return false;
    }

    if (trimmed.length > 20) {
      setNicknameError('Nickname must be at most 20 characters');
      return false;
    }

    setNicknameError('');
    return true;
  };

  const validateCategories = (): boolean => {
    if (selectedCategories.length === 0) {
      setCategoriesError('Please select at least one spot category');
      return false;
    }

    setCategoriesError('');
    return true;
  };

  const handleCategoryChange = (category: SpotCategory, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    }
    setCategoriesError('');
  };

  const handleConditionChange = (
    condition: AccessibilityCondition,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedConditions([...selectedConditions, condition]);
    } else {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNicknameValid = validateNickname(nickname);
    const areCategoriesValid = validateCategories();

    if (!isNicknameValid || !areCategoriesValid) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createProfile({
        nickname: nickname.trim(),
        preferredCategories: selectedCategories,
        accessibilityConditions: selectedConditions,
      });

      // Navigate to home after successful profile creation
      navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ormi-ember-50 to-ormi-ember-100 p-4">
      {error && (
        <Notification
          items={[
            {
              type: 'error',
              content: error,
              id: 'onboarding-error',
              onDismiss: () => setError(null),
            },
          ]}
        />
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Tell us a bit about yourself to get started
            </p>
          </div>

          {/* Onboarding Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname Input */}
            <Input
              label="Nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.detail.value);
                if (nicknameError) {
                  validateNickname(e.detail.value);
                }
              }}
              onBlur={() => validateNickname(nickname)}
              error={nicknameError}
              placeholder="Enter your nickname (2-20 characters)"
            />

            {/* Spot Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Spot Categories *
              </label>
              <div className="space-y-2">
                <Checkbox
                  label="Cafe"
                  checked={selectedCategories.includes(SpotCategory.CAFE)}
                  onChange={(e) =>
                    handleCategoryChange(SpotCategory.CAFE, e.detail.checked)
                  }
                />
                <Checkbox
                  label="Landmark"
                  checked={selectedCategories.includes(SpotCategory.LANDMARK)}
                  onChange={(e) =>
                    handleCategoryChange(
                      SpotCategory.LANDMARK,
                      e.detail.checked
                    )
                  }
                />
                <Checkbox
                  label="Restaurant"
                  checked={selectedCategories.includes(SpotCategory.DINNER)}
                  onChange={(e) =>
                    handleCategoryChange(SpotCategory.DINNER, e.detail.checked)
                  }
                />
              </div>
              {categoriesError && (
                <p className="text-sm text-red-600 mt-2">{categoriesError}</p>
              )}
            </div>

            {/* Accessibility Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Accessibility Conditions (Optional)
              </label>
              <div className="space-y-2">
                <Checkbox
                  label="Wheelchair accessible"
                  checked={selectedConditions.includes(
                    AccessibilityCondition.WHEELCHAIR
                  )}
                  onChange={(e) =>
                    handleConditionChange(
                      AccessibilityCondition.WHEELCHAIR,
                      e.detail.checked
                    )
                  }
                />
                <Checkbox
                  label="With children"
                  checked={selectedConditions.includes(
                    AccessibilityCondition.WITH_CHILDREN
                  )}
                  onChange={(e) =>
                    handleConditionChange(
                      AccessibilityCondition.WITH_CHILDREN,
                      e.detail.checked
                    )
                  }
                />
                <Checkbox
                  label="With elderly"
                  checked={selectedConditions.includes(
                    AccessibilityCondition.WITH_ELDERLY
                  )}
                  onChange={(e) =>
                    handleConditionChange(
                      AccessibilityCondition.WITH_ELDERLY,
                      e.detail.checked
                    )
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-ormi-ember-500 hover:bg-ormi-ember-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
            >
              {submitting ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
