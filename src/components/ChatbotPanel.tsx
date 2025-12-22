import { ChatbotAPI } from '@/api/chatbot';
import { DUMMY_DESTINATIONS } from '@/data/dummyDestinations';
import { useUserStore } from '@/store/userStore';
import type {
  PromptType,
  RecommendRequest,
  RecommendResponse,
} from '@/types/chatbot';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bot, ChevronRight, Loader2, MapPin, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  userLocation?: { lat: number; lon: number };
  onClose: () => void;
  onRecommendationReceived?: (result: RecommendResponse) => void;
}

interface ScenarioOption {
  type: PromptType;
  title: string;
  description: string;
  emoji: string;
  requiresEndSpot?: boolean;
  requiresFavorites?: boolean;
}

const SCENARIOS: ScenarioOption[] = [
  {
    type: 'location_time',
    title: '지금 여기서 뭐하지?',
    description: '현재 위치 주변 AI 추천',
    emoji: '🎯',
  },
  {
    type: 'destination_only',
    title: '특정 장소로 가고 싶어요',
    description: '도착지까지 경로 추천',
    emoji: '🗺️',
    requiresEndSpot: true,
  },
  {
    type: 'favorites_recommend',
    title: '내 취향 맞는 곳 찾아줘',
    description: '찜 목록 기반 유사 추천',
    emoji: '💡',
    requiresFavorites: true,
  },
  {
    type: 'favorites_route',
    title: '찜한 곳들 효율적으로 돌기',
    description: '찜 목록 최적 경로',
    emoji: '🚗',
    requiresFavorites: true,
  },
];

export default function ChatbotPanel({
  userLocation,
  onClose,
  onRecommendationReceived,
}: Props) {
  const { mode, userId } = useUserStore();
  const isPetMode = mode === 'pet';

  const [selectedScenario, setSelectedScenario] = useState<PromptType | null>(
    null
  );
  const [selectedDestination, setSelectedDestination] = useState<
    (typeof DUMMY_DESTINATIONS)[0] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mainColorClass = isPetMode ? 'bg-ormi-green-500' : 'bg-orange-500';
  const mainHoverClass = isPetMode
    ? 'hover:bg-ormi-green-600'
    : 'hover:bg-orange-600';
  const mainTextColorClass = isPetMode
    ? 'text-ormi-green-500'
    : 'text-orange-500';

  // 시나리오 선택 핸들러
  const handleScenarioSelect = async (scenario: PromptType) => {
    setSelectedScenario(scenario);
    setError(null);
    setLogs([]);

    // destination_only는 목적지 선택 UI를 먼저 보여줌
    const scenarioOption = SCENARIOS.find((s) => s.type === scenario);
    if (scenarioOption?.requiresEndSpot) {
      // 목적지 선택 화면으로 이동 (실제 API 호출은 목적지 선택 후)
      return;
    }

    // 나머지 시나리오는 바로 실행
    executeScenario(scenario);
  };

  // 목적지 선택 핸들러
  const handleDestinationSelect = (
    destination: (typeof DUMMY_DESTINATIONS)[0]
  ) => {
    setSelectedDestination(destination);
    executeScenario('destination_only', destination.content_id);
  };

  // 실제 시나리오 실행
  const executeScenario = async (scenario: PromptType, endSpotId?: string) => {
    setError(null);
    setLogs([]);

    // 현재 위치가 없으면 에러
    if (!userLocation) {
      setError('현재 위치를 가져올 수 없습니다.');
      return;
    }

    // 프론트엔드는 'toddler'를 사용하지만 API는 'baby'를 요구함
    const apiMode = mode === 'toddler' ? 'baby' : mode;

    // 기본 요청 데이터 생성
    const request: RecommendRequest = {
      mode: scenario,
      user_mode: apiMode,
      start_lat: userLocation.lat,
      start_lon: userLocation.lon,
      start_datetime: new Date().toISOString(),
      start_name: '현재 위치',
    };

    // 시나리오별 추가 데이터
    const scenarioOption = SCENARIOS.find((s) => s.type === scenario);

    if (scenarioOption?.requiresFavorites) {
      if (!userId) {
        setError('로그인이 필요한 기능입니다.');
        return;
      }
      request.user_id = String(userId);

      // favorites_route는 spot_ids도 필요 (임시로 빈 배열)
      if (scenario === 'favorites_route') {
        // TODO: 실제 찜 목록에서 가져오기
        request.spot_ids = [];
      }
    }

    if (scenarioOption?.requiresEndSpot && endSpotId) {
      request.end_spot_id = endSpotId;
    }

    // 요청 검증
    const validation = ChatbotAPI.validateRequest(request);
    if (!validation.valid) {
      setError(`필수 정보가 부족합니다: ${validation.missing.join(', ')}`);
      return;
    }

    // SSE 스트리밍 시작
    setIsLoading(true);
    try {
      ChatbotAPI.streamRecommend(request, {
        onLog: (message) => {
          setLogs((prev) => [...prev, message]);
        },
        onDone: (result) => {
          setIsLoading(false);
          if (result.success) {
            onRecommendationReceived?.(result);
            onClose();
          } else {
            setError(result.error || '추천에 실패했습니다.');
          }
        },
        onError: (err) => {
          setIsLoading(false);
          setError(err.message || '연결에 실패했습니다.');
        },
      });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  // 뒤로 가기
  const handleBack = () => {
    setSelectedScenario(null);
    setSelectedDestination(null);
    setError(null);
    setLogs([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center font-jeju"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {selectedScenario && !isLoading && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className={`${mainColorClass} p-2 rounded-xl`}>
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 여행 추천</h2>
              <p className="text-sm text-gray-500">
                {selectedScenario && !isLoading
                  ? SCENARIOS.find((s) => s.type === selectedScenario)
                      ?.description
                  : '원하는 여행 스타일을 선택하세요'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedScenario ? (
            // 시나리오 선택 화면
            <div className="space-y-3">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.type}
                  onClick={() => handleScenarioSelect(scenario.type)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-md group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{scenario.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {scenario.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {scenario.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 ${mainTextColorClass} opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : selectedScenario === 'destination_only' &&
            !isLoading &&
            !selectedDestination ? (
            // 목적지 선택 화면
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                가고 싶은 목적지를 선택하세요
              </p>
              {DUMMY_DESTINATIONS.map((dest) => (
                <button
                  key={dest.content_id}
                  onClick={() => handleDestinationSelect(dest)}
                  className="w-full text-left p-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={dest.first_image}
                      alt={dest.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {dest.title}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dest.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 ${mainTextColorClass} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // 로딩 화면
            <div className="flex flex-col items-center justify-center py-12">
              {isLoading ? (
                <>
                  <Loader2
                    className={`w-12 h-12 ${mainTextColorClass} animate-spin mb-4`}
                  />
                  <p className="text-gray-700 font-medium mb-6">
                    AI가 추천을 준비하고 있어요...
                  </p>

                  {/* 로그 표시 */}
                  <div className="w-full space-y-2">
                    <AnimatePresence>
                      {logs.map((log, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3"
                        >
                          {log}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-600 font-medium mb-4">{error}</p>
                  <button
                    onClick={handleBack}
                    className={`${mainColorClass} ${mainHoverClass} text-white px-6 py-2 rounded-full font-medium transition-colors`}
                  >
                    다시 선택하기
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {!userLocation && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-100">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <MapPin className="w-4 h-4" />
              <span>위치 정보를 가져오는 중...</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
