# Google OAuth + AWS Cognito 연동 가이드

## 📋 개요

이 문서는 AWS Cognito(신 UI)와 Google OAuth를 연동하기 위해 **정확히 어떤 값들을 복사/붙여넣기** 해야 하는지 설명합니다.

---

## 🔑 핵심: 3개의 값 일치시키기

### 1️⃣ Cognito Domain (AWS에서 확인)

### 2️⃣ Google Redirect URI (Google에 입력)

### 3️⃣ Google Client ID & Secret (AWS에 입력)

---

## 📍 Step 1: AWS Cognito 도메인 확인

### AWS Console에서:

1. **Amazon Cognito** → **User pools** → **gavjrc** 선택
2. 왼쪽 메뉴: **Branding** 클릭
3. **Domain** 섹션에서 도메인 확인

**현재 도메인:**

```
ap-northeast-2ygo7nsg8n.auth.ap-northeast-2.amazoncognito.com
```

⚠️ **이 값을 정확히 복사하세요!** (메모장에 저장)

---

## 📍 Step 2: Google Cloud Console 설정

### A. OAuth Consent Screen (이미 있으면 건너뛰기)

1. https://console.cloud.google.com/ 접속
2. **APIs & Services** → **OAuth consent screen**
3. 이미 있으면 → **Step B로 이동**
4. 없으면:
   - User Type: **External**
   - App name: `ORMI Family`
   - User support email: 본인 이메일
   - Scopes: `email`, `profile`, `openid`
   - Test users: 본인 Gmail 추가

### B. OAuth Client ID 생성/수정

1. **APIs & Services** → **Credentials**
2. 기존 OAuth Client ID가 있으면 선택, 없으면 **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `ORMI Family Web Client`

#### ⭐ 중요: Authorized redirect URIs

**정확히 다음 형식으로 입력:**

```
https://[COGNITO_DOMAIN]/oauth2/idpresponse
```

**실제 값 (복사해서 사용):**

```
https://ap-northeast-2ygo7nsg8n.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
```

**체크리스트:**

- ✅ `https://`로 시작 (http 아님!)
- ✅ 도메인: `ap-northeast-2ygo7nsg8n.auth.ap-northeast-2.amazoncognito.com`
- ✅ 경로: `/oauth2/idpresponse`
- ✅ 끝에 슬래시 없음
- ✅ 대소문자 정확히 일치

5. **Create** 또는 **Save** 클릭

#### 📝 값 복사

팝업 또는 화면에서 다음 2개 값을 **메모장에 복사**:

- **Client ID** (예: `123456789-abc.apps.googleusercontent.com`)
- **Client secret** (예: `GOCSPX-abc123...`)

---

## 📍 Step 3: AWS Cognito에 Google Provider 추가

### AWS Console에서:

1. **Amazon Cognito** → **User pools** → **gavjrc**
2. 왼쪽 메뉴: **Authentication** 클릭
3. **Social and external providers** 클릭
4. **Add identity provider** 버튼 클릭
5. **Google** 선택

#### ⭐ 중요: 값 입력

**Client ID:**

```
[Google에서 복사한 Client ID 붙여넣기]
```

**Client secret:**

```
[Google에서 복사한 Client Secret 붙여넣기]
```

**Authorized scopes:**

```
openid email profile
```

6. **Add identity provider** 클릭

---

## 📍 Step 4: App Client에 Google 연결

### AWS Console에서:

1. **Amazon Cognito** → **User pools** → **gavjrc**
2. 왼쪽 메뉴: **Applications** 클릭
3. **App clients** 클릭
4. 기존 App client 선택 (Client ID: `14bve6fq14le9p5eavuh2ml80b`)
5. **Edit** 버튼 클릭

#### ⭐ 중요: 설정 확인/수정

**Allowed callback URLs:**

```
http://localhost:3000/auth/callback
```

**Allowed sign-out URLs:**

```
http://localhost:3000/login
```

**Identity providers:**

- ⬜ Cognito user pool (체크 해제)
- ✅ **Google** (체크)

**OAuth 2.0 grant types:**

- ✅ Authorization code grant

**OpenID Connect scopes:**

- ✅ Email
- ✅ OpenID
- ✅ Profile

6. **Save changes** 클릭

---

## 📍 Step 5: 환경 변수 확인

### .env 파일 확인:

```env
VITE_COGNITO_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_Ygo7nsg8n
VITE_COGNITO_CLIENT_ID=14bve6fq14le9p5eavuh2ml80b
VITE_COGNITO_DOMAIN=ap-northeast-2ygo7nsg8n.auth.ap-northeast-2.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:3000/auth/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:3000/login
```

⚠️ **VITE_COGNITO_DOMAIN에 `https://` 없어야 함!**

---

## 🔍 값 일치 체크리스트

### ✅ 확인 사항

| 항목               | AWS Cognito                           | Google Cloud                                                 | 일치 여부 |
| ------------------ | ------------------------------------- | ------------------------------------------------------------ | --------- |
| **Cognito Domain** | `ap-northeast-2ygo7nsg8n.auth...`     | -                                                            | -         |
| **Redirect URI**   | -                                     | `https://ap-northeast-2ygo7nsg8n.auth.../oauth2/idpresponse` | ✅        |
| **Client ID**      | Google Provider에 입력                | Credentials에서 생성                                         | ✅        |
| **Client Secret**  | Google Provider에 입력                | Credentials에서 생성                                         | ✅        |
| **Callback URL**   | `http://localhost:3000/auth/callback` | -                                                            | -         |

---

## 🚀 테스트

### 1. 개발 서버 재시작

```bash
npm run dev
```

### 2. 시크릿 모드로 테스트

```
Ctrl + Shift + N (새 시크릿 창)
```

### 3. 로그인 시도

```
http://localhost:3000/login
```

### 4. 예상 동작

1. "Continue with Google" 버튼 클릭
2. Google 로그인 화면 표시
3. 로그인 후 권한 승인
4. 온보딩 페이지로 리다이렉트

---

## 🐛 문제 해결

### 오류: "redirect_uri_mismatch"

**원인:** Google의 Authorized redirect URIs가 정확하지 않음

**해결:**

1. Google Cloud Console → Credentials
2. OAuth Client ID 선택
3. Authorized redirect URIs 확인:
   ```
   https://ap-northeast-2ygo7nsg8n.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
   ```
4. 정확히 일치하는지 확인 (대소문자, 슬래시, https 등)
5. Save 후 **5-10분 대기** (전파 시간)

### 오류: "No tokens received"

**원인:** App Client에 Google이 연결되지 않음

**해결:**

1. AWS Cognito → Applications → App clients
2. App client 선택 → Edit
3. Identity providers에서 **Google 체크** 확인
4. Save changes

### 오류: "Access blocked"

**원인:** Google OAuth consent screen 설정 문제

**해결:**

1. Google Cloud Console → OAuth consent screen
2. Test users에 본인 Gmail 추가
3. Publishing status 확인

---

## 📝 요약: 복사/붙여넣기 해야 할 값

### AWS → Google:

1. **Cognito Domain** → Google Redirect URI에 사용
   ```
   ap-northeast-2ygo7nsg8n.auth.ap-northeast-2.amazoncognito.com
   ```

### Google → AWS:

2. **Google Client ID** → AWS Cognito Google Provider에 입력
3. **Google Client Secret** → AWS Cognito Google Provider에 입력

### 일치시켜야 할 값:

4. **Google Redirect URI** = `https://[Cognito Domain]/oauth2/idpresponse`
5. **AWS Callback URL** = `http://localhost:3000/auth/callback`

---

## ⏱️ 전파 시간

- Google OAuth 설정 변경: **5-10분**
- AWS Cognito 설정 변경: **즉시**

설정 변경 후 5-10분 대기 후 시크릿 모드에서 재시도하세요!

---

## 🎉 성공!

모든 설정이 완료되면 Google 로그인이 정상 작동하고, 온보딩 페이지로 이동합니다!
