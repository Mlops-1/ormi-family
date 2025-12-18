import { UserAPI, type UserUpdatePayload } from '@/api/user';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Logo from '@/components/Logo';
import Notification from '@/components/Notification';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAuth } from '@/hooks/useAuth';
import { SpotCategory } from '@/types/auth'; // Removed AccessibilityCondition
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Camera, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import defaultProfileImage from '../assets/images/default_profile.jpg';

export const Route = createFileRoute('/user')({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState(''); // Readonly or hidden?
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Flags
  const [isDisabled, setIsDisabled] = useState(false);
  const [withChild, setWithChild] = useState(false);
  const [withPet, setWithPet] = useState(false);
  const [hasStroller, setHasStroller] = useState(false);

  // Categories (Visual only if API doesn't support, or keep mock sync)
  const [selectedCategories, setSelectedCategories] = useState<SpotCategory[]>(
    []
  );

  const [nameError, setNameError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch User Data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['userInfo', TEMP_USER_ID],
    queryFn: async () => {
      const response = await UserAPI.getUserInfo(TEMP_USER_ID);
      // Backend returns an array, use the first item
      return Array.isArray(response.data) ? response.data[0] : response.data;
    },
  });

  // Populate Form
  useEffect(() => {
    if (userData) {
      setUserName(userData.user_name || '');
      setEmail(userData.email || '');
      setProfileImage(userData.profile || null);
      setIsDisabled(userData.is_disabled === 1);
      setWithChild(userData.with_child === 1);
      setWithPet(userData.with_pet === 1);
      setHasStroller(userData.has_stroller === 1);
      // Note: Categories not in API response, so defaults to empty or local storage if we wanted to mix.
    }
  }, [userData]);

  // Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UserUpdatePayload) =>
      UserAPI.updateUser(TEMP_USER_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userInfo', TEMP_USER_ID] });
      setSuccessMsg('프로필이 성공적으로 수정되었습니다.');
      // Optional: Refresh auth context if it depends on this
      refreshProfile();
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err) => {
      console.error(err);
      setError('프로필 저장 중 오류가 발생했습니다.');
    },
  });

  const validateName = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNameError('이름을 입력해주세요.');
      return false;
    }
    setNameError('');
    return true;
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

  // Keep category logic for UI feel
  const handleCategoryChange = (category: SpotCategory, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateName(userName)) return;

    const payload = {
      user_name: userName,
      email: email, // Send back existing email
      profile: profileImage || '', // Send image string/url
      is_disabled: isDisabled ? 1 : 0,
      with_child: withChild ? 1 : 0,
      with_pet: withPet ? 1 : 0,
      has_stroller: hasStroller ? 1 : 0,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jeju-light-background dark:bg-jeju-dark-background p-4 animate-fade-in relative pb-24">
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

      <div className="w-full">
        {/* Header / Nav */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate({ to: '/user-info' })} // Go back to info
            className="text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary hover:text-jeju-light-text-primary dark:hover:text-jeju-light-text-primary transition-colors p-2 -ml-2 rounded-full hover:bg-jeju-light-background dark:hover:bg-jeju-dark-background"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="bg-jeju-light-surface dark:bg-jeju-dark-surface rounded-2xl p-6 shadow-sm border border-jeju-light-divider dark:border-jeju-dark-divider relative">
          {/* Logo and Title */}
          <div className="text-center mb-8 pt-4">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-jeju-light-text-primary dark:text-jeju-dark-text-primary mb-2">
              내 정보 수정
            </h1>
            <p className="text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary">
              변경할 정보를 입력해주세요.
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
                  className="absolute bottom-1 right-1 bg-jeju-light-primary hover:bg-jeju-light-primary-variant text-white p-2.5 rounded-full shadow-md transition-colors"
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

            {/* Name Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-jeju-light-text-primary dark:text-jeju-dark-text-primary">
                  이름
                </label>
                {/* Always allow edit for now */}
              </div>
              <Input
                value={userName}
                onChange={(e) => {
                  setUserName(e.detail.value);
                  if (nameError) validateName(e.detail.value);
                }}
                onBlur={() => validateName(userName)}
                error={nameError}
                placeholder="이름을 입력해주세요"
              />
            </div>

            {/* Accessibility Conditions (New 4 Fields) */}
            <div>
              <label className="block text-sm font-medium text-jeju-light-text-primary dark:text-jeju-dark-text-primary mb-3">
                이동 편의 고려사항 (선택)
              </label>
              <div className="space-y-2 bg-jeju-light-background dark:bg-jeju-dark-background p-4 rounded-xl border border-jeju-light-divider dark:border-jeju-dark-divider">
                <Checkbox
                  label="♿ 휠체어 사용"
                  checked={isDisabled}
                  onChange={(e) => setIsDisabled(e.detail.checked)}
                />
                <Checkbox
                  label="👶 아이 동반"
                  checked={withChild}
                  onChange={(e) => setWithChild(e.detail.checked)}
                />
                <Checkbox
                  label="🐕 반려동물 동반"
                  checked={withPet}
                  onChange={(e) => setWithPet(e.detail.checked)}
                />
                <Checkbox
                  label="🛒 유모차 사용"
                  checked={hasStroller}
                  onChange={(e) => setHasStroller(e.detail.checked)}
                />
              </div>
            </div>

            {/* Categories (Keep UI but maybe separate header) */}
            <div>
              <label className="block text-sm font-medium text-jeju-light-text-primary dark:text-jeju-dark-text-primary mb-3">
                선호하는 장소 (참고용)
              </label>
              <div className="space-y-2 bg-jeju-light-background dark:bg-jeju-dark-background p-4 rounded-xl border border-jeju-light-divider dark:border-jeju-dark-divider">
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-4 px-4 bg-jeju-light-primary hover:bg-jeju-light-primary-variant dark:bg-jeju-dark-primary dark:hover:bg-jeju-dark-primary-variant disabled:bg-jeju-light-text-disabled disabled:dark:bg-jeju-dark-text-disabled text-white font-bold rounded-xl shadow-lg shadow-jeju-light-primary/30 transition-all active:scale-98"
            >
              {updateMutation.isPending ? '저장 중...' : '수정 완료'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
