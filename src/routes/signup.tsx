import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Logo from '@/components/Logo';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

interface SignupFormData {
  username: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToMarketing: boolean;
}

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.username.trim()) {
      alert('사용자 이름을 입력해주세요');
      return;
    }

    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      alert('필수 약관에 동의해주세요');
      return;
    }

    // Navigate to index page
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-linear-to-br from-ormi-blue-100 via-ormi-ember-100 to-ormi-pink-100">
      {/* Header with Logo */}
      <div className="text-center mb-8">
        <Logo size="medium" className="mb-2" />
        <p className="text-base text-gray-600">회원가입</p>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-6 mb-8">
          {/* Username Input */}
          <Input
            label="사용자 이름"
            type="text"
            placeholder="이름을 입력하세요"
            value={formData.username}
            onChange={({ detail }) =>
              setFormData({ ...formData, username: detail.value })
            }
          />

          {/* Checkboxes Section */}
          <div className="space-y-4 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              약관 동의
            </p>

            <Checkbox
              label="서비스 이용약관 동의 (필수)"
              checked={formData.agreeToTerms}
              onChange={({ detail }) =>
                setFormData({ ...formData, agreeToTerms: detail.checked })
              }
            />

            <Checkbox
              label="개인정보 처리방침 동의 (필수)"
              checked={formData.agreeToPrivacy}
              onChange={({ detail }) =>
                setFormData({ ...formData, agreeToPrivacy: detail.checked })
              }
            />

            <Checkbox
              label="마케팅 정보 수신 동의 (선택)"
              checked={formData.agreeToMarketing}
              onChange={({ detail }) =>
                setFormData({
                  ...formData,
                  agreeToMarketing: detail.checked,
                })
              }
            />
          </div>
        </div>

        {/* Submit Button - Pushed to bottom */}
        <div className="mt-auto">
          <Button
            variant="primary"
            fullWidth
            onClick={() =>
              handleSubmit({ preventDefault: () => {} } as FormEvent)
            }
          >
            가입하기
          </Button>
        </div>
      </form>
    </div>
  );
}
