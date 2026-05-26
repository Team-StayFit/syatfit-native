// AI API 전용 클라이언트 (다른 베이스 URL 사용)
export const AI_API_BASE_URL = 'https://stayfit-api.ngelsh.com';

// Server-Sent Events (SSE) 스트리밍 처리 - React Native용
export async function streamRecommendation(
  data: {
    annual_income_man_won: number; // 만원 단위
    assets_man_won: number;
    existing_annual_repayment_man_won?: number;
    existing_debt_man_won?: number;
    is_home_owner: boolean;
    lifestyle_keywords: string;
    loan_rate_pct?: number;
    loan_term_years?: number;
    occupation?: string;
    preferences?: {
      floor_type_preference?: string;
      max_area_m2?: number;
      min_area_m2?: number;
      parking_required?: boolean;
      property_type?: string;
      transaction_type?: string;
    };
    preferred_area: string;
    top_k?: number;
  },
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${AI_API_BASE_URL}/recommend/stream`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    let previousLength = 0;

    let buffer = '';

    xhr.onprogress = () => {
      // 새로 들어온 데이터만 파싱
      const currentText = xhr.responseText;
      const newText = currentText.substring(previousLength);
      previousLength = currentText.length;

      if (newText) {
        buffer += newText;

        // SSE 형식 파싱: "data: ..." 형태
        const lines = newText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const text = line.substring(6); // "data: " 제거
            console.log('[SSE] Raw chunk:', JSON.stringify(text));
            if (text.trim() && text.trim() !== '[DONE]') {
              onChunk(text);
            }
          } else if (line.trim()) {
            console.log('[SSE] Non-data line:', JSON.stringify(line));
          }
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // 전체 응답이 완료되면 JSON 파싱 시도
        try {
          console.log('[Recommend] Full response:', xhr.responseText.substring(0, 200));
          const jsonResponse = JSON.parse(xhr.responseText);

          // JSON 형식이면 recommendation 필드 추출
          if (jsonResponse.recommendation) {
            console.log('[Recommend] Parsed JSON, using recommendation field');
            // 기존 스트림 텍스트를 모두 지우고 추천 텍스트로 교체
            onChunk('\x00' + jsonResponse.recommendation); // \x00는 특수 마커로 사용
          }
        } catch (e) {
          // JSON이 아니면 SSE 스트리밍으로 처리된 것
          console.log('[Recommend] Not JSON, using streamed content');
        }

        onComplete();
        resolve();
      } else {
        const error = new Error(`HTTP error! status: ${xhr.status}`);
        onError(error);
        reject(error);
      }
    };

    xhr.onerror = () => {
      const error = new Error('Network error occurred');
      onError(error);
      reject(error);
    };

    xhr.ontimeout = () => {
      const error = new Error('Request timeout');
      onError(error);
      reject(error);
    };

    xhr.send(JSON.stringify(data));
  });
}

// 일반 채팅 API (스트리밍)
export async function streamChatMessage(
  message: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${AI_API_BASE_URL}/chat`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    let previousLength = 0;

    xhr.onprogress = () => {
      const currentText = xhr.responseText;
      const newText = currentText.substring(previousLength);
      previousLength = currentText.length;

      if (newText) {
        // SSE 형식 파싱
        const lines = newText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const text = line.substring(6);
            console.log('[Chat SSE] Raw chunk:', JSON.stringify(text));
            if (text.trim() && text.trim() !== '[DONE]') {
              onChunk(text);
            }
          } else if (line.trim() && !line.startsWith('data:')) {
            console.log('[Chat SSE] Non-data line:', JSON.stringify(line));
            // SSE 형식이 아닌 경우 (일반 JSON 응답)
            try {
              const data = JSON.parse(line);
              if (data.reply) {
                onChunk(data.reply);
              }
            } catch {
              // JSON 파싱 실패 시 그냥 텍스트로 처리
              if (line.trim()) {
                onChunk(line);
              }
            }
          }
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        onComplete();
        resolve();
      } else {
        const error = new Error(`HTTP error! status: ${xhr.status}`);
        onError(error);
        reject(error);
      }
    };

    xhr.onerror = () => {
      const error = new Error('Network error occurred');
      onError(error);
      reject(error);
    };

    xhr.send(JSON.stringify({ message }));
  });
}
