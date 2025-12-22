import type {
  RecommendRequest,
  RecommendResponse,
  StreamEvent,
} from '@/types/chatbot';

export class ChatbotAPI {
  private static readonly BASE_URL = '/bot/agent';

  /**
   * 일반 POST 요청 (스트리밍 없음)
   */
  static async recommend(
    request: RecommendRequest
  ): Promise<RecommendResponse> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('ChatbotAPI.recommend error:', error);
      throw error;
    }
  }

  /**
   * SSE 스트리밍 요청
   * @param request 추천 요청 데이터
   * @param onLog 로그 메시지 콜백
   * @param onDone 완료 콜백
   * @param onError 에러 콜백
   * @returns EventSource 객체 (취소 가능)
   */
  static streamRecommend(
    request: RecommendRequest,
    callbacks: {
      onLog?: (message: string) => void;
      onDone?: (result: RecommendResponse) => void;
      onError?: (error: Error) => void;
    }
  ): EventSource {
    // URL 파라미터 생성
    const params = new URLSearchParams();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // spot_ids 같은 배열은 JSON 문자열로 변환
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const url = `${this.BASE_URL}/stream?${params.toString()}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        if (data.type === 'log') {
          callbacks.onLog?.(data.msg);
        } else if (data.type === 'done') {
          callbacks.onDone?.(data.result);
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
        callbacks.onError?.(
          error instanceof Error ? error : new Error('Parse error')
        );
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      callbacks.onError?.(new Error('SSE connection failed'));
      eventSource.close();
    };

    return eventSource;
  }

  /**
   * 시나리오별 필수 필드 검증
   */
  static validateRequest(request: RecommendRequest): {
    valid: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    // 공통 필수 필드
    const commonRequired = [
      'mode',
      'user_mode',
      'start_lat',
      'start_lon',
      'start_datetime',
    ];
    commonRequired.forEach((field) => {
      if (
        !(field in request) ||
        request[field as keyof RecommendRequest] === undefined
      ) {
        missing.push(field);
      }
    });

    // 시나리오별 필수 필드
    switch (request.mode) {
      case 'destination_only':
      case 'start_end':
        if (!request.end_spot_id) missing.push('end_spot_id');
        break;

      case 'favorites_route':
        if (!request.user_id) missing.push('user_id');
        if (!request.spot_ids || request.spot_ids.length === 0) {
          missing.push('spot_ids');
        }
        break;

      case 'favorites_recommend':
        if (!request.user_id) missing.push('user_id');
        break;

      case 'location_time':
        // 공통 필수 필드만 있으면 됨
        break;
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}
