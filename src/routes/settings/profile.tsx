import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Checkbox from '../../components/Checkbox';
import Input from '../../components/Input';
import Notification from '../../components/Notification';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { AccessibilityCondition, SpotCategory } from '../../types/auth';

export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
});

function ProfileSettingsPage() {
  const { isAuthenticated, profile: currentProfile, logout } = useAuth();
  const { updateProfile, updating } = useProfile();
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

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  // Load current profile data
  useEffect(() => {
    if (currentProfile) {
      setNickname(currentProfile.nickname);
      setSelectedCategories(currentProfile.preferredCategories);
      setSelectedConditions(currentProfile.accessibilityConditions);
    }
  }, [currentProfile]);

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
      setError(null);
      setSuccess(false);

      await updateProfile({
        nickname: nickname.trim(),
        preferredCategories: selectedCategories,
        accessibilityConditions: selectedConditions,
      });

      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: '/login' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {error && (
        <Notification
          items={[
            {
              type: 'error',
              content: error,
              id: 'profile-error',
              onDismiss: () => setError(null),
            },
          ]}
        />
      )}

      {success && (
        <Notification
          items={[
            {
              type: 'success',
              content: 'Profile updated successfully!',
              id: 'profile-success',
              onDismiss: () => setSuccess(false),
            },
          ]}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600">
              Update your profile information and preferences
            </p>
          </div>

          {/* Profile Form */}
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 px-4 bg-ormi-ember-500 hover:bg-ormi-ember-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={() => navigate({ to: '/' })}
                className="w-full py-3 px-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Logout Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Actions
            </h2>
            <Button variant="outlined" color="ember" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
