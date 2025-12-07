import ProtectedRoute from '@/components/ProtectedRoute';
import RadioGroup from '@/components/RadioGroup';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CircleUser, Edit2 } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/user')({
  component: UserPage,
});

function UserPage() {
  return (
    <ProtectedRoute requireProfile={true}>
      <UserPageContent />
    </ProtectedRoute>
  );
}

function UserPageContent() {
  const navigate = useNavigate();
  const [name, setName] = useState('오르미');
  const [isEditingName, setIsEditingName] = useState(false);
  const [travelStyle, setTravelStyle] = useState('RELAX');

  const handleSave = async () => {
    // Mock API Call
    // await api.updateUser(...)
    await new Promise((r) => setTimeout(r, 500));
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-12 px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-gray-600 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">내 정보 수정</h1>
      </div>

      {/* Profile Image */}
      <div className="flex justify-center mb-8">
        <div className="w-28 h-28 rounded-full bg-linear-to-br from-ormi-green-100 to-ormi-green-200 flex items-center justify-center text-ormi-green-600 shadow-inner border-4 border-white">
          <CircleUser size={64} />
        </div>
      </div>

      {/* Name Input */}
      <div className="mb-8">
        <label className="block text-gray-700 font-bold mb-2 ml-1">
          닉네임
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditingName}
            className={`flex-1 p-4 rounded-xl border bg-white transition-all text-lg outline-none ${
              isEditingName
                ? 'border-ormi-green-500 ring-4 ring-ormi-green-100 text-gray-900'
                : 'border-gray-200 text-gray-500'
            }`}
          />
          <button
            onClick={() => setIsEditingName(!isEditingName)}
            className={`px-4 rounded-xl border transition-all active:scale-95 ${
              isEditingName
                ? 'bg-ormi-green-500 text-white border-ormi-green-500 shadow-lg shadow-ormi-green-200'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
          >
            <Edit2 size={20} />
          </button>
        </div>
      </div>

      {/* Radio Buttons */}
      <div className="mb-12">
        <RadioGroup
          label="선호하는 여행 스타일"
          value={travelStyle}
          onChange={setTravelStyle}
          options={[
            { id: 'RELAX', label: '🏖️ 힐링 호캉스' },
            { id: 'ADVENTURE', label: '🏃‍♂️ 활동적인 액티비티' },
            { id: 'CULTURE', label: '☕ 감성 카페 & 맛집 투어' },
          ]}
        />
      </div>

      {/* Footer Buttons */}
      <div className="mt-auto flex gap-3">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex-1 py-4 rounded-2xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors active:scale-95"
        >
          돌아가기
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-4 rounded-2xl bg-linear-to-r from-ormi-green-400 to-ormi-green-500 hover:from-ormi-green-500 hover:to-ormi-green-600 text-white font-bold shadow-lg shadow-ormi-green-200 transition-all active:scale-95"
        >
          수정하기
        </button>
      </div>
    </div>
  );
}
