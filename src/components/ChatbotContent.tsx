import { ChatbotAPI } from '@/api/chatbot';
import { FavoritesAPI } from '@/api/favorites';
import LocationPicker from '@/components/LocationPicker';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useMapStore, type SavedLocation } from '@/store/mapStore';
import { useUserStore } from '@/store/userStore';
import type {
  PromptType,
  RecommendRequest,
  RecommendResponse,
  Spot,
} from '@/types/chatbot';
import type { Coordinates } from '@/types/geo';
import type { FavoriteSpot } from '@/types/spot';
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  themeColor: string;
  userLocation?: { lat: number; lon: number };
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
  {
    type: 'start_end',
    title: '동선 최적화 추천',
    description: '출발지와 도착지 사이 경유지',
    emoji: '🛣️',
    requiresEndSpot: true,
  },
];

interface Destination {
  name: string;
  lat: number;
  lon: number;
  address?: string;
}

export default function ChatbotContent({
  themeColor: _themeColor,
  userLocation,
  onRecommendationReceived,
}: Props) {
  const { mode, userId } = useUserStore();
  const { savedLocations, manualLocation } = useMapStore();
  const isPetMode = mode === 'pet';

  // Use manualLocation (Reference Location) if available, otherwise fallback to userLocation (Current Location)
  const effectiveUserLocation = manualLocation || userLocation;

  const [selectedScenario, setSelectedScenario] = useState<PromptType | null>(
    null
  );
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [isDestinationPickerOpen, setIsDestinationPickerOpen] = useState(false);

  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (isLoading && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLoading]);

  // Results
  const [recommendationResult, setRecommendationResult] =
    useState<RecommendResponse | null>(null);
  const [likedSpotIds, setLikedSpotIds] = useState<Set<string>>(new Set());
  const [favoriteSpots, setFavoriteSpots] = useState<FavoriteSpot[]>([]);
  const [isFavoritePickerOpen, setIsFavoritePickerOpen] = useState(false);

  // 전역 찜 목록 동기화
  const fetchFavorites = useCallback(async () => {
    const effectiveUserId = userId || TEMP_USER_ID;
    try {
      const resp = await FavoritesAPI.getFavorites({
        user_id: effectiveUserId,
      });
      if (resp.data) {
        const ids = new Set(resp.data.map((fav) => String(fav.content_id)));
        setLikedSpotIds(ids);
        setFavoriteSpots(resp.data);
        console.log('[FAVORITE] Chatbot synced items:', ids.size);
      }
    } catch (err) {
      console.error('[FAVORITE] Sync failed:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();

    const handleRefresh = () => {
      console.log('[FAVORITE] Refresh event received in Chatbot');
      fetchFavorites();
    };

    window.addEventListener('refreshFavorites', handleRefresh);
    return () => window.removeEventListener('refreshFavorites', handleRefresh);
  }, [fetchFavorites]);

  const mainHoverClass = isPetMode
    ? 'hover:bg-ormi-green-600'
    : 'hover:bg-orange-600';
  const mainTextColorClass = isPetMode
    ? 'text-ormi-green-500'
    : 'text-orange-500';
  const mainBgColorClass = isPetMode ? 'bg-ormi-green-500' : 'bg-orange-500';

  // 시나리오 선택 핸들러
  const handleScenarioSelect = async (scenario: PromptType) => {
    setSelectedScenario(scenario);
    setError(null);
    setLogs([]);
    setRecommendationResult(null);
    setRecommendationResult(null);
    setSelectedDestination(null); // Reset destination when selecting new scenario
    setIsFavoritePickerOpen(false);

    // location_time: 위치 선택 화면으로 이동
    // start_end: 위치 선택 화면으로 이동 (출발지 선택 후 목적지 선택)
    if (scenario === 'location_time' || scenario === 'start_end') {
      setIsSelectingLocation(true);
      return;
    }

    // destination_only는 목적지 선택 모달 오픈 -> 인라인 피커 오픈
    const scenarioOption = SCENARIOS.find((s) => s.type === scenario);
    if (scenarioOption?.requiresEndSpot) {
      // 바로 피커를 열지 않고, 사용자가 검색 버튼을 누르도록 유도 (기존 유지)
      // 또는 바로 열 수도 있지만, UX상 버튼을 누르는게 자연스러움
      return;
    }

    // 나머지 시나리오 - effectiveUserLocation 사용
    if (effectiveUserLocation) {
      executeScenario(scenario, undefined, {
        lat: effectiveUserLocation.lat,
        lon: effectiveUserLocation.lon,
        name: manualLocation ? '기준위치' : '현재위치',
      });
    } else {
      setError('위치 정보를 가져올 수 없습니다.');
    }
  };

  // 찜한 장소를 목적지로 선택했을 때
  const handleFavoriteDestinationSelect = (spot: FavoriteSpot) => {
    setIsFavoritePickerOpen(false);
    if (effectiveUserLocation) {
      executeScenario(
        'start_end',
        String(spot.content_id), // endSpotId 전달
        {
          lat: effectiveUserLocation.lat,
          lon: effectiveUserLocation.lon,
          name: manualLocation ? '기준위치' : '현재위치',
        }
      );
    } else {
      setError('출발지 정보를 가져올 수 없습니다.');
    }
  };

  // 위치 선택 핸들러 (location_time 시나리오용)
  const handleLocationSelect = (loc: {
    lat: number;
    lon: number;
    name: string;
  }) => {
    setIsSelectingLocation(false);
    // 선택한 위치로 시나리오 실행
    // start_end인 경우 목적지 선택 화면으로 이동
    if (selectedScenario === 'start_end') {
      setIsDestinationPickerOpen(true);
      // 여기서 handleDestinationConfirm까지 상태를 유지해야 함.
      // -> 목적지를 찜 목록에서 선택하도록 변경됨 (2024.12.23)
      if (favoriteSpots.length === 0) {
        setError('찜한 장소가 없습니다. 먼저 장소를 찜해주세요!');
        setIsSelectingLocation(false);
        setSelectedScenario(null);
        return;
      }
      setIsFavoritePickerOpen(true);
      return;
    }

    executeScenario('location_time', undefined, loc);
  };

  // 목적지 선택 완료 핸들러
  const handleDestinationConfirm = (coords: Coordinates, address: string) => {
    const destName = address.split(' ').pop() || address;
    const dest: Destination = {
      name: destName,
      lat: coords.lat,
      lon: coords.lon,
      address: address,
    };
    setSelectedDestination(dest);
    setIsDestinationPickerOpen(false);

    // 목적지는 현재/기준 위치에서 출발한다고 가정
    if (effectiveUserLocation) {
      // start_end 모드일 경우
      if (selectedScenario === 'start_end') {
        executeScenario(
          'start_end',
          undefined,
          {
            lat: effectiveUserLocation.lat,
            lon: effectiveUserLocation.lon,
            name: manualLocation ? '기준위치' : '현재위치',
          },
          dest
        );
      } else {
        // destination_only 모드일 경우
        executeScenario(
          'destination_only',
          undefined, // endSpotId 없음
          {
            lat: effectiveUserLocation.lat,
            lon: effectiveUserLocation.lon,
            name: manualLocation ? '기준위치' : '현재위치',
          },
          dest
        );
      }
    } else {
      setError('현재 위치를 가져올 수 없습니다.');
    }
  };

  // 찜하기 핸들러
  const handleToggleFavorite = async (spot: Spot) => {
    console.log(
      '[FAVORITE] Toggle favorite clicked for spot:',
      spot.content_id,
      spot.title
    );

    // userId가 없으면 임시 ID 사용
    const effectiveUserId = userId || TEMP_USER_ID;
    console.log('[FAVORITE] Using userId:', effectiveUserId);

    // content_id가 숫자형인지 확인하고 안전하게 처리
    const spotIdNum = Number(spot.content_id);
    const spotIdStr = String(spotIdNum);

    if (isNaN(spotIdNum)) {
      console.error('[FAVORITE] Invalid content_id:', spot.content_id);
      return;
    }

    const isLiked = likedSpotIds.has(spotIdStr);
    console.log(
      `[FAVORITE] Current state - isLiked: ${isLiked}, spotId: ${spotIdStr}`
    );

    // Optimistic Update
    console.log('[FAVORITE] Applying optimistic update...');
    setLikedSpotIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(spotIdStr);
        console.log('[FAVORITE] Optimistically removed from favorites');
      } else {
        next.add(spotIdStr);
        console.log('[FAVORITE] Optimistically added to favorites');
      }
      return next;
    });

    try {
      if (isLiked) {
        console.log('[FAVORITE] API: Removing favorite...');
        await FavoritesAPI.removeFavorite(spotIdNum, effectiveUserId);
      } else {
        console.log('[FAVORITE] API: Adding favorite...');
        await FavoritesAPI.addFavorite({
          user_id: effectiveUserId,
          content_id: spotIdNum,
        });
      }

      console.log('[FAVORITE] API success. Dispatching refreshFavorites.');
      window.dispatchEvent(new Event('refreshFavorites'));
    } catch (err) {
      console.error('[FAVORITE] API failure:', err);
      // Revert on error
      setLikedSpotIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(spotIdStr);
        } else {
          next.delete(spotIdStr);
        }
        return next;
      });
      alert('찜하기 동작 중 오류가 발생했습니다.');
    }
  };

  // 실제 시나리오 실행
  const executeScenario = async (
    scenario: PromptType,
    endSpotId?: string,
    startLocation?: { lat: number; lon: number; name: string },
    endLocation?: Destination
  ) => {
    setError(null);
    setLogs([]);
    setRecommendationResult(null);

    const activeStart = startLocation;

    // 시작 위치 필수
    if (!activeStart) {
      setError('위치 정보를 가져올 수 없습니다.');
      return;
    }

    const apiMode = mode === 'toddler' ? 'baby' : mode;

    const request: RecommendRequest = {
      mode: scenario,
      user_mode: apiMode,
      start_lat: activeStart.lat,
      start_lon: activeStart.lon,
      start_datetime: new Date().toISOString(),
      start_name: activeStart.name,
    };

    const scenarioOption = SCENARIOS.find((s) => s.type === scenario);

    if (scenarioOption?.requiresFavorites) {
      // User ID is required, fallback to TEMP_USER_ID if not logged in (though logic suggests it's required)
      request.user_id = String(userId || TEMP_USER_ID);

      if (scenario === 'favorites_route') {
        const spotIds = Array.from(likedSpotIds);
        if (spotIds.length === 0) {
          setError('아직 찜한 장소가 없습니다. 먼저 장소를 찜해주세요!');
          return;
        }
        request.spot_ids = spotIds;
      }
    }

    if (scenarioOption?.requiresEndSpot) {
      if (endSpotId) {
        request.end_spot_id = endSpotId;
      } else if (endLocation) {
        request.end_lat = endLocation.lat;
        request.end_lon = endLocation.lon;
        request.end_name = endLocation.name;
      } else {
        setError('목적지가 선택되지 않았습니다.');
        return;
      }
    }

    const validation = ChatbotAPI.validateRequest(request);
    if (!validation.valid) {
      setError(`필수 정보가 부족합니다: ${validation.missing.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setLogs(['AI 에이전트 연결 시도 중...']);

    try {
      ChatbotAPI.streamRecommend(request, {
        onLog: (message) => {
          console.log('Stream Log:', message);
          setLogs((prev) => [...prev, message]);
        },
        onDone: (result) => {
          setIsLoading(false);
          if (result.success) {
            setRecommendationResult(result);
            onRecommendationReceived?.(result);
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
    if (isSelectingLocation) {
      setSelectedScenario(null);
      setIsSelectingLocation(false);
      return;
    }
    if (isDestinationPickerOpen) {
      setIsDestinationPickerOpen(false);
      return;
    }
    if (isFavoritePickerOpen) {
      setIsFavoritePickerOpen(false);
      return;
    }
    if (recommendationResult) {
      setRecommendationResult(null);
      setLogs([]);
      // 선택된 시나리오는 유지 (원할 경우)
      return;
    }
    setSelectedScenario(null);
    setSelectedDestination(null);
    setIsFavoritePickerOpen(false);
    setError(null);
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          {selectedScenario && !isLoading && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <div className={`${mainBgColorClass} p-2 rounded-xl`}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI 여행 추천</h2>
            <p className="text-xs text-gray-500">
              {recommendationResult
                ? '추천 결과입니다'
                : selectedScenario &&
                    !isLoading &&
                    !isSelectingLocation &&
                    !isDestinationPickerOpen
                  ? SCENARIOS.find((s) => s.type === selectedScenario)
                      ?.description
                  : (selectedScenario === 'location_time' ||
                        selectedScenario === 'start_end') &&
                      isSelectingLocation
                    ? '어디서 출발하시나요?'
                    : selectedScenario === 'destination_only' &&
                        !isLoading &&
                        !selectedDestination &&
                        !isDestinationPickerOpen
                      ? '가고 싶은 목적지를 선택하세요'
                      : isFavoritePickerOpen
                        ? '도착지로 설정할 찜 장소를 선택해주세요'
                        : isLoading
                          ? 'AI가 실시간으로 분석 중입니다...'
                          : '원하는 여행 스타일을 선택하세요'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        {!selectedScenario ? (
          // 1. 시나리오 선택 화면
          <div className="space-y-3">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.type}
                onClick={() => handleScenarioSelect(scenario.type)}
                className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all hover:shadow-sm group bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{scenario.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-0.5 truncate">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {scenario.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 ${mainTextColorClass} opacity-50 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
              </button>
            ))}
          </div>
        ) : (selectedScenario === 'location_time' ||
            selectedScenario === 'start_end') &&
          isSelectingLocation ? (
          // 2. 위치 선택 화면 (Chat Bubble Style Options)
          <div className="flex flex-col gap-4">
            {/* Bot Message */}
            <div className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full ${mainBgColorClass} flex items-center justify-center shrink-0`}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-800">
                {selectedScenario === 'start_end'
                  ? '어디서 출발하시나요?'
                  : '어떤 위치를 기준으로 추천해드릴까요?'}
              </div>
            </div>

            {/* Options Area */}
            <div className="flex flex-wrap gap-2 justify-start">
              {/* My Location Button */}
              <button
                onClick={() => {
                  if (effectiveUserLocation) {
                    handleLocationSelect({
                      ...effectiveUserLocation,
                      name: manualLocation ? '기준위치' : '현재위치',
                    });
                  } else {
                    setError('위치 정보를 가져올 수 없습니다.');
                  }
                }}
                className={`px-4 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-sm active:scale-95 ${mainBgColorClass} ${mainHoverClass} flex items-center gap-2`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {manualLocation ? '기준위치' : '현재위치'}
              </button>

              {/* Saved Locations */}
              {savedLocations.map((loc: SavedLocation) => (
                <button
                  key={loc.id}
                  onClick={() =>
                    handleLocationSelect({
                      lat: loc.coordinates.lat,
                      lon: loc.coordinates.lon,
                      name: loc.name,
                    })
                  }
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-full text-sm hover:border-orange-300 hover:bg-orange-50 transition-colors active:scale-95 shadow-sm"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        ) : isFavoritePickerOpen ? (
          // 2.5 찜 목록 선택 (start_end 목적지용)
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full ${mainBgColorClass} flex items-center justify-center shrink-0`}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-800">
                도착지로 설정할 장소를 선택해주세요.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {favoriteSpots.map((spot) => (
                <button
                  key={spot.content_id}
                  onClick={() => handleFavoriteDestinationSelect(spot)}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-orange-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {spot.first_image ? (
                      <img
                        src={spot.first_image}
                        alt={spot.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">
                      {spot.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {spot.addr_1}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500" />
                </button>
              ))}
            </div>
          </div>
        ) : selectedScenario === 'destination_only' &&
          !isLoading &&
          !selectedDestination &&
          !recommendationResult &&
          isDestinationPickerOpen ? (
          // 3. 목적지 선택 화면 (인라인 피커) - destination_only 전용
          <div className="h-full flex flex-col">
            <LocationPicker
              initialCoordinates={
                effectiveUserLocation || { lat: 33.4996, lon: 126.5312 }
              }
              onConfirm={handleDestinationConfirm}
              confirmLabel="이 목적지로 출발"
              height="350px"
            />
          </div>
        ) : selectedScenario === 'destination_only' &&
          !isLoading &&
          !selectedDestination &&
          !recommendationResult ? (
          // 3-0. 목적지 검색 진입 화면 (검색 버튼)
          <div className="flex flex-col gap-4">
            {/* Bot Message */}
            <div className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full ${mainBgColorClass} flex items-center justify-center shrink-0`}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-800">
                가고 싶은 목적지를 검색해보세요!
                <br />
                지도에서 직접 위치를 선택할 수도 있습니다.
              </div>
            </div>

            <button
              onClick={() => setIsDestinationPickerOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-900">
                <Search className="w-5 h-5" />
                <span className="font-medium">목적지 검색하기...</span>
              </div>
              <div
                className={`p-2 rounded-full bg-gray-50 group-hover:${mainBgColorClass} group-hover:text-white transition-colors`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        ) : isLoading ? (
          // 4. 로딩 (로그 스트림) 화면 - Terminal Style
          <div className="flex flex-col min-h-[300px] bg-slate-900 rounded-xl p-4 overflow-hidden relative font-mono text-xs shadow-inner">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2 shrink-0">
              <Terminal className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold">AI Agent Stream</span>
              <span className="animate-pulse ml-auto text-green-400 text-[10px]">
                ● LIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide text-green-300 font-medium">
              {logs.length === 0 && (
                <div className="text-slate-500 italic">대기 중...</div>
              )}
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="break-all leading-relaxed flex gap-2"
                >
                  <span className="text-green-500 opacity-70 shrink-0">$</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Decor */}
            <div
              className={`absolute bottom-0 left-0 w-full h-1 ${mainBgColorClass} opacity-50`}
            />
          </div>
        ) : recommendationResult ? (
          // 5. 결과 화면 (추천 장소 카드 리스트)
          <div className="space-y-4">
            {recommendationResult.description && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800 leading-relaxed font-medium">
                {recommendationResult.description}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {recommendationResult.spots?.map((spot) => (
                <div
                  key={spot.content_id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative"
                >
                  <div className="flex">
                    {/* 이미지 */}
                    <div className="w-24 h-24 shrink-0 bg-gray-100 relative">
                      {spot.first_image ? (
                        <img
                          src={spot.first_image}
                          alt={spot.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <MapPin className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-gray-900 line-clamp-1">
                            {spot.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {spot.cat2 || spot.cat1}
                        </p>

                        {spot.estimated_stay_minutes && (
                          <div className="text-xs text-gray-400 mt-1">
                            ⏳ 약 {spot.estimated_stay_minutes}분 소요
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          onClick={() => handleToggleFavorite(spot)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            likedSpotIds.has(String(spot.content_id))
                              ? 'bg-red-50 text-red-500'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              likedSpotIds.has(String(spot.content_id))
                                ? 'fill-current'
                                : ''
                            }`}
                          />
                          {likedSpotIds.has(String(spot.content_id))
                            ? '찜 취소'
                            : '찜하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {recommendationResult.spots?.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                추천 결과가 없습니다.
              </div>
            )}
          </div>
        ) : error ? (
          // 에러 화면
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-600 font-medium text-sm mb-4">{error}</p>
            <button
              onClick={handleBack}
              className={`${mainBgColorClass} ${mainHoverClass} text-white px-5 py-2 rounded-full text-sm font-medium transition-colors`}
            >
              다시 선택하기
            </button>
          </div>
        ) : null}
      </div>

      {!effectiveUserLocation && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-100">
          <div className="flex items-center gap-2 text-yellow-800 text-xs justify-center">
            <MapPin className="w-3.5 h-3.5" />
            <span>위치 정보를 가져오는 중입니다...</span>
          </div>
        </div>
      )}
    </div>
  );
}
