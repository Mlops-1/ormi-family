import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Logo from '@/components/Logo';
import Notification from '@/components/Notification';
import { useAuth } from '@/hooks/useAuth';
import { AccessibilityCondition, SpotCategory } from '@/types/auth';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Camera, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import defaultProfileImage from '../assets/images/default_profile.jpg';

export const Route = createFileRoute('/user')({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { isAuthenticated, isProfileComplete, profile, refreshProfile } =
    useAuth();
  const navigate = useNavigate();

  // Mode: 'onboarding' (create) vs 'edit' (update)
  const mode = isProfileComplete ? 'edit' : 'onboarding';

  // Form State
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<SpotCategory[]>(
    []
  );
  const [categoriesError, setCategoriesError] = useState('');

  const [selectedConditions, setSelectedConditions] = useState<
    AccessibilityCondition[]
  >([]);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize form with profile data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && profile) {
      setNickname(profile.nickname);
      setSelectedCategories(profile.preferredCategories);
      setSelectedConditions(profile.accessibilityConditions);
      setProfileImage(profile.profileImage || null);
    }
  }, [mode, profile]);

  // Authenticated check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  const validateNickname = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNicknameError('닉네임을 입력해주세요.');
      return false;
    }

    const trimmed = value.trim();
    // Regex: Hangul, English, Numbers, 2-6 chars
    const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,6}$/;

    if (!nicknameRegex.test(trimmed)) {
      setNicknameError('한글, 영문, 숫자 2~6자로 입력해주세요.');
      return false;
    }

    setNicknameError('');
    return true;
  };

  const validateCategories = (): boolean => {
    if (selectedCategories.length === 0) {
      setCategoriesError('최소 하나의 관심사를 선택해주세요.');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      // MOCK LOGIC for "No DB" requirement:
      // We enforce a single "demo-user" identity to ensure profile is always replaced/updated, not appended.
      const MOCK_CI_VALUE = 'demo-user-1';

      // 1. Ensure AuthData exists so AuthContext can pick it up
      const mockAuthData = {
        ciValue: MOCK_CI_VALUE,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
        expiresAt: Date.now() + 3600 * 1000 * 24 * 365, // 1 year
      };
      localStorage.setItem('auth_data', JSON.stringify(mockAuthData));

      // 2. Save/Overwrite Profile with consistent key
      const now = new Date().toISOString();
      const newProfile = {
        ciValue: MOCK_CI_VALUE,
        nickname: nickname.trim(),
        preferredCategories: selectedCategories,
        accessibilityConditions: selectedConditions,
        profileImage: profileImage || undefined,
        createdAt: profile?.createdAt || now,
        updatedAt: now,
      };

      // Key must watch StorageService's expectation: "user_profile_" + ciValue
      localStorage.setItem(
        `user_profile_${MOCK_CI_VALUE}`,
        JSON.stringify(newProfile)
      );

      // 3. Force Context Refresh
      refreshProfile(); // Trigger context update for immediate reflection

      // Dispatch storage event for other tabs if needed
      window.dispatchEvent(new Event('storage'));

      // Optimistic success
      setSuccessMsg('프로필이 성공적으로 수정되었습니다.');
      setIsEditingNickname(false);

      // Small delay then redirect
      setTimeout(() => {
        setSuccessMsg(null);
        if (mode === 'onboarding') {
          navigate({ to: '/' });
        }
      }, 1000);

      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setError('프로필 저장 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-ormi-ember-50 to-ormi-ember-100 p-4 animate-fade-in">
      {(error || successMsg) && (
        <Notification
          items={[
            ...(error
              ? [
                  {
                    type: 'error' as const,
                    content: error,
                    id: 'profile-error',
                    onDismiss: () => setError(null),
                  },
                ]
              : []),
            ...(successMsg
              ? [
                  {
                    type: 'success' as const,
                    content: successMsg,
                    id: 'profile-success',
                    onDismiss: () => setSuccessMsg(null),
                  },
                ]
              : []),
          ]}
        />
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 relative">
          {mode === 'edit' && (
            <button
              onClick={() => navigate({ to: '/' })}
              className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'onboarding' ? '프로필 설정' : '내 정보 수정'}
            </h1>
            <p className="text-gray-600">
              {mode === 'onboarding'
                ? '서비스 이용을 위해 기본 정보를 입력해주세요.'
                : '변경할 정보를 입력해주세요.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={defaultProfileImage}
                      alt="Default Profile"
                      className="w-full h-full object-cover opacity-80"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-ormi-green-500 hover:bg-ormi-green-600 text-white p-2.5 rounded-full shadow-md transition-colors"
                >
                  <Camera size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {profileImage && (
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="mt-2 text-sm text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
                >
                  <Trash2 size={14} />
                  사진 삭제
                </button>
              )}
            </div>

            {/* Nickname Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  닉네임
                </label>
                {mode === 'edit' && !isEditingNickname && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNickname(true)}
                    className="text-xs text-ormi-green-600 font-medium hover:underline"
                  >
                    변경하기
                  </button>
                )}
              </div>
              <Input
                value={nickname}
                onChange={(e) => {
                  setNickname(e.detail.value);
                  if (nicknameError) validateNickname(e.detail.value);
                }}
                onBlur={() => validateNickname(nickname)}
                error={nicknameError}
                placeholder="닉네임 (2-20자)"
                disabled={mode === 'edit' && !isEditingNickname}
              />
            </div>

            {/* Spot Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                선호하는 장소 (복수 선택 가능) *
              </label>
              <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Checkbox
                  label="☕ 카페"
                  checked={selectedCategories.includes(SpotCategory.CAFE)}
                  onChange={(e) =>
                    handleCategoryChange(SpotCategory.CAFE, e.detail.checked)
                  }
                />
                <Checkbox
                  label="🏛️ 관광명소"
                  checked={selectedCategories.includes(SpotCategory.LANDMARK)}
                  onChange={(e) =>
                    handleCategoryChange(
                      SpotCategory.LANDMARK,
                      e.detail.checked
                    )
                  }
                />
                <Checkbox
                  label="🍽️ 식당"
                  checked={selectedCategories.includes(SpotCategory.DINNER)}
                  onChange={(e) =>
                    handleCategoryChange(SpotCategory.DINNER, e.detail.checked)
                  }
                />
              </div>
              {categoriesError && (
                <p className="text-sm text-red-600 mt-2 ml-1">
                  {categoriesError}
                </p>
              )}
            </div>

            {/* Accessibility Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                이동 편의 고려사항 (선택)
              </label>
              <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Checkbox
                  label="♿ 휠체어/유모차 접근성 필요"
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
                  label="👶 아이와 함께해요"
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
                  label="👵 어르신과 함께해요"
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
              className="w-full py-4 px-4 bg-linear-to-r from-ormi-green-500 to-ormi-green-600 hover:from-ormi-green-600 hover:to-ormi-green-700 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl shadow-lg shadow-ormi-green-100 transition-all active:scale-98"
            >
              {submitting
                ? '저장 중...'
                : mode === 'onboarding'
                  ? '시작하기'
                  : '수정 완료'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
