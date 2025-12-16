# ORMI Family

모바일/태블릿 환경에 최적화된 React 웹 애플리케이션

## 🚀 시작하기

### 필수 요구사항

- **Node.js**: v20.0.0 이상 권장
- **npm**: v9.0.0 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd ormi-family

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 기타 명령어

```bash
# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 프리뷰 (빌드 후 미리보기)
npm run preview
```

### ⚠️ 백엔드 API 연동 시 주의사항 (Proxy/CORS)

현재 백엔드 서버가 로컬호스트가 아닌 AWS 등에 배포되어 있을 때, 로컬 개발 환경에서 CORS 오류가 발생할 수 있습니다.
이를 해결하기 위해 `vite.config.ts`에 Proxy 설정이 되어 있습니다.

**주의:** `.env` 파일에 `VITE_API_BASE_URL`이 설정되어 있으면 Proxy가 작동하지 않고 직접 요청을 보내게 되어 CORS 오류가 발생할 수 있습니다.
로컬 개발 시에는 해당 환경변수를 주석 처리하거나 제거해주세요.

```bash
# .env
# 이 부분이 있다면 주석 처리해주세요!
# VITE_API_BASE_URL=http://13.209.98.82:8000
```

### VS Code 터미널 설정 (Windows 사용자)

Windows CMD에서 `Ctrl+C` 종료 시 "일괄 작업을 끝내시겠습니까?" 메시지를 방지하려면 PowerShell을 기본 터미널로 설정하세요.

**방법 1: VS Code 설정에서 변경**

1. `Ctrl + ,` (설정 열기)
2. 검색: "default profile windows"
3. **Terminal > Integrated > Default Profile: Windows** → **PowerShell** 선택

**방법 2: settings.json 직접 수정**

`Ctrl + Shift + P` → "Preferences: Open User Settings (JSON)" 선택 후 추가:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

### 권장 VS Code 익스텐션

프로젝트에 다음 익스텐션 설치를 권장합니다:

1. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Tailwind 클래스 자동완성
   - 중복/충돌 클래스 경고
   - 호버 시 CSS 미리보기

2. **Prettier** (`esbenp.prettier-vscode`)
   - 코드 자동 포맷팅

3. **ESLint** (`dbaeumer.vscode-eslint`)
   - 코드 린팅

**저장 시 자동 포맷팅 설정**

코드 저장 시 자동으로 Prettier 포맷팅이 적용되도록 설정하세요.

**방법 1: VS Code 설정 UI**

1. `Ctrl + ,` (설정 열기)
2. 검색: **"format on save"**
3. **Editor: Format On Save** 체크박스 활성화
4. 검색: **"default formatter"**
5. **Editor: Default Formatter** → **Prettier - Code formatter** 선택

**방법 2: settings.json 직접 수정**

`Ctrl + Shift + P` → "Preferences: Open User Settings (JSON)" 선택 후 추가:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 🛠️ 기술 스택

### Core

- **React** v19.2.0 - UI 라이브러리
- **TypeScript** v5.9.3 - 타입 안전성
- **Vite** v7.2.4 - 빌드 도구

### Routing

- **TanStack Router** v1.139.14 - 타입 안전 라우팅
- **TanStack Router DevTools** v1.139.15 - 개발 도구

### Styling

- **Tailwind CSS** v4.1.17 - 유틸리티 CSS 프레임워크
- **@tailwindcss/vite** v4.1.17 - Vite 플러그인

### Data Management

- **TanStack Table** v8.21.3 - 테이블 라이브러리

### Code Quality

- **ESLint** v9.39.1 - 코드 린팅
- **Prettier** v3.7.4 - 코드 포맷팅
- **TypeScript ESLint** v8.46.4 - TypeScript 린팅

---

## 📝 코드 컨벤션

### 컴포넌트 작성 규칙

모든 React 컴포넌트는 **`export default function`** 형식으로 작성합니다.

```tsx
// ✅ Good
export default function MyComponent() {
  return <div>Hello</div>;
}

// ❌ Bad
export const MyComponent = () => {
  return <div>Hello</div>;
};

// ❌ Bad
const MyComponent = () => {
  return <div>Hello</div>;
};

...

export default MyComponent;

// ❌ Bad
function MyComponent = () => {
  return <div>Hello</div>;
};

...

export default MyComponent;
```

**예외: TanStack Router 라우트 파일**

`routes/` 폴더의 라우트 파일은 TanStack Router의 규칙을 따릅니다:

```tsx
// routes/example.tsx
import { createFileRoute } from '@tanstack/react-router';

// Route는 named export로 export
export const Route = createFileRoute('/example')({
  component: ExamplePage,
});

// 컴포넌트 함수는 일반 함수로 작성
function ExamplePage() {
  return <div>Example</div>;
}
```

### 타입 Export 규칙

타입 정의는 파일 내에서 선언하고, **파일 하단에서 한 번에 export** 합니다.

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
}

export type { User, Post };

// ❌ Bad
export interface User {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  title: string;
}
```

### 커밋 전 체크리스트

1. **수동 저장**: 모든 파일을 저장했는지 확인

2. **Tailwind CSS 검사**: Tailwind CSS IntelliSense가 표시하는 경고 확인
   - 중복 클래스 제거 (예: `text-white text-transparent`)
   - 충돌 클래스 수정 (예: `flex block`)
   - 구버전 클래스 업데이트 (예: `bg-gradient-to-r` → `bg-linear-to-r`)

3. **Prettier 포맷팅**: 아래 명령어로 코드 포맷팅 실행

```bash
npx prettier --write "src/**/*.{ts,tsx,css}"
```

4. **린트 검사**: 에러가 없는지 확인

```bash
npm run lint
```

---

## 📱 반응형 디자인

이 프로젝트는 모바일/태블릿 환경에 최적화되어 있습니다.

- **모바일/태블릿**: 전체 화면 사용
- **데스크톱**: 왼쪽에 모바일 뷰 (최대 768px), 오른쪽에 안내 메시지

---

## 📂 프로젝트 구조

```
ormi-family/
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── routes/          # TanStack Router 라우트
│   ├── styles/          # 전역 CSS 스타일
│   ├── types/           # TypeScript 타입 정의
│   ├── main.tsx         # 애플리케이션 진입점
│   └── router.tsx       # 라우터 설정
├── public/              # 정적 파일
└── index.html           # HTML 템플릿
```

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

## 🔐 AWS Cognito 설정

이 애플리케이션은 AWS Cognito를 사용하여 Google 및 X(Twitter) 소셜 로그인을 지원합니다.

**📖 자세한 설정 가이드**: [docs/COGNITO_SETUP_GUIDE.md](docs/COGNITO_SETUP_GUIDE.md)

### 빠른 시작

1. `.env.example` 파일을 `.env`로 복사
2. [상세 가이드](docs/COGNITO_SETUP_GUIDE.md)를 따라 Cognito 설정
3. `.env` 파일에 실제 값 입력
4. `npm run dev`로 테스트

### Cognito User Pool 생성

1. **AWS Console에서 Cognito User Pool 생성**
   - AWS Console → Amazon Cognito → User Pools → Create user pool
   - Sign-in options: Email 선택
   - Password policy: 기본값 사용 (소셜 로그인만 사용하는 경우 적용되지 않음)
   - MFA: Optional (선택사항)
   - User account recovery: Email 선택

2. **App Client 설정**
   - App client name: 원하는 이름 입력
   - Authentication flows:
     - ✅ Authorization code grant
     - ✅ Implicit grant (SPA용)
   - Token expiration:
     - Access token: 1 hour
     - Refresh token: 30 days
     - ID token: 1 hour

3. **Hosted UI 설정**
   - Cognito domain: 고유한 도메인 이름 입력
   - Callback URLs:
     - Development: `http://localhost:5173/auth/callback`
     - Production: `https://yourdomain.com/auth/callback`
   - Sign-out URLs:
     - Development: `http://localhost:5173/login`
     - Production: `https://yourdomain.com/login`
   - OAuth 2.0 scopes: `openid`, `email`, `profile` 선택

### Identity Provider 설정

#### Google OAuth 설정

1. **Google Cloud Console에서 OAuth 2.0 클라이언트 생성**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://your-cognito-domain.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse`

2. **Cognito에 Google Provider 추가**
   - Cognito User Pool → Sign-in experience → Federated identity provider sign-in
   - Add identity provider → Google
   - Client ID: Google에서 생성한 Client ID
   - Client secret: Google에서 생성한 Client Secret
   - Authorize scope: `openid email profile`
   - Attribute mapping:
     - `email` → `email`
     - `name` → `name`
     - `picture` → `picture`

#### X (Twitter) OAuth 설정

1. **X Developer Portal에서 앱 생성**
   - [X Developer Portal](https://developer.twitter.com/) 접속
   - Projects & Apps → Create App
   - App settings → User authentication settings
   - Type of App: Web App
   - Callback URLs:
     - `https://your-cognito-domain.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse`

2. **Cognito에 X Provider 추가**
   - Cognito User Pool → Sign-in experience → Federated identity provider sign-in
   - Add identity provider → Twitter
   - API key: X에서 생성한 API Key
   - API secret key: X에서 생성한 API Secret Key
   - Authorize scope: `openid email profile`
   - Attribute mapping:
     - `email` → `email`
     - `name` → `name`
     - `profile_image_url` → `picture`

### 환경 변수 설정

`.env` 파일에 다음 값들을 설정하세요:

```env
# AWS Cognito Configuration
VITE_COGNITO_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_DOMAIN=your-domain.auth.ap-northeast-2.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:5173/auth/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:5173/login
```

### 설정 확인

1. 모든 환경 변수가 올바르게 설정되었는지 확인
2. Cognito User Pool의 App client이 활성화되어 있는지 확인
3. Identity Provider (Google, X)가 올바르게 연결되어 있는지 확인
4. Callback URL과 Sign-out URL이 정확한지 확인
