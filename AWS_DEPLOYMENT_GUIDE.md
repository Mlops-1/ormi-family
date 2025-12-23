# 🚀 AWS S3 + CloudFront 배포 가이드

이 문서는 GitHub Actions를 통해 프로젝트를 AWS S3와 CloudFront에 배포하는 방법을 설명합니다.

---

## 📋 사전 준비 사항

### 1. AWS 계정 설정

#### 1.1 S3 버킷 생성

1. [AWS S3 콘솔](https://s3.console.aws.amazon.com/)에 접속
2. **"버킷 만들기"** 클릭
3. 설정:
   - **버킷 이름**: `ormi-family-frontend` (유니크한 이름 사용)
   - **리전**: `ap-northeast-2` (서울)
   - **퍼블릭 액세스 차단**: ✅ 모두 체크 (CloudFront를 통해서만 접근)
   - **버전 관리**: 선택사항 (롤백 필요시 활성화)
4. **"버킷 만들기"** 완료

#### 1.2 S3 버킷 정책 설정 (CloudFront 전용 접근)

버킷 → 권한 → 버킷 정책에 아래 JSON 추가:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

> ⚠️ `YOUR_BUCKET_NAME`, `YOUR_ACCOUNT_ID`, `YOUR_DISTRIBUTION_ID`를 실제 값으로 교체하세요.

---

### 2. CloudFront 배포 생성

1. [AWS CloudFront 콘솔](https://console.aws.amazon.com/cloudfront/)에 접속
2. **"배포 생성"** 클릭
3. 설정:

#### 오리진 설정

- **오리진 도메인**: S3 버킷 선택 (`ormi-family-frontend.s3.ap-northeast-2.amazonaws.com`)
- **오리진 액세스**: **Origin Access Control (OAC)** 선택
  - "새 OAC 생성" 클릭 → 기본값 유지 → 생성
- **S3 버킷 정책 업데이트** 경고 → "예, 정책을 업데이트합니다" 선택

#### 기본 캐시 동작

- **뷰어 프로토콜 정책**: Redirect HTTP to HTTPS
- **허용되는 HTTP 메서드**: GET, HEAD
- **캐싱 정책**: CachingOptimized (권장)

#### 설정

- **가격 클래스**: 모든 엣지 로케이션 사용 (또는 비용 절감을 위해 "북미, 유럽, 아시아만")
- **대체 도메인 이름(CNAME)**: 사용자 정의 도메인이 있다면 입력
- **기본 루트 객체**: `index.html`
- **사용자 정의 오류 응답** (SPA 라우팅을 위해 필수):
  - 오류 코드: `403` → 응답 페이지: `/index.html`, HTTP 응답 코드: `200`
  - 오류 코드: `404` → 응답 페이지: `/index.html`, HTTP 응답 코드: `200`

4. **"배포 생성"** 클릭

> 📝 배포가 완료되면 **Distribution ID**를 메모하세요!

---

### 3. IAM 사용자 생성 (GitHub Actions용)

1. [AWS IAM 콘솔](https://console.aws.amazon.com/iam/)에 접속
2. **사용자** → **"사용자 추가"**
3. 설정:
   - **사용자 이름**: `github-actions-deploy`
   - **AWS 자격 증명 유형**: 프로그래밍 방식 액세스 ✅
4. **권한 설정**: "기존 정책 직접 연결" 선택

   또는 인라인 정책 생성:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

5. **액세스 키** 생성 및 안전하게 저장

---

## 🔐 GitHub Secrets 설정

GitHub 레포지토리 → Settings → Secrets and variables → Actions에서 아래 시크릿을 추가하세요:

| Secret 이름                  | 설명                       | 예시                         |
| ---------------------------- | -------------------------- | ---------------------------- |
| `AWS_ACCESS_KEY_ID`          | IAM 사용자 액세스 키 ID    | `AKIAIOSFODNN7EXAMPLE`       |
| `AWS_SECRET_ACCESS_KEY`      | IAM 사용자 시크릿 키       | `wJalrXUtnFEMI/K7MDENG/...`  |
| `S3_BUCKET_NAME`             | S3 버킷 이름               | `ormi-family-frontend`       |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront 배포 ID         | `E1A2B3C4D5E6F7`             |
| `VITE_OPENWEATHER_API_KEY`   | OpenWeather API 키         | (현재 .env에 있는 값)        |
| `VITE_TMAP_APP_KEY`          | TMap API 키                | (현재 .env에 있는 값)        |
| `VITE_BACKEND_API_KEY`       | 백엔드 API 키              | (현재 .env에 있는 값)        |
| `VITE_API_BASE_URL`          | 프로덕션 백엔드 URL        | `https://api.yourdomain.com` |
| `VITE_AWS_ACCESS_KEY_ID`     | 프론트엔드용 AWS 액세스 키 | (현재 .env에 있는 값)        |
| `VITE_AWS_SECRET_ACCESS_KEY` | 프론트엔드용 AWS 시크릿 키 | (현재 .env에 있는 값)        |
| `VITE_AWS_S3_BUCKET_NAME`    | 로그용 S3 버킷             | `swipe-log-ormi`             |
| `VITE_KINESIS_STREAM_NAME`   | Kinesis 스트림 이름        | `swipe-action`               |

### Cognito 관련 (사용하는 경우):

| Secret 이름                      | 설명                       |
| -------------------------------- | -------------------------- |
| `VITE_COGNITO_USER_POOL_ID`      | Cognito User Pool ID       |
| `VITE_COGNITO_CLIENT_ID`         | Cognito 앱 클라이언트 ID   |
| `VITE_COGNITO_DOMAIN`            | Cognito 도메인             |
| `VITE_COGNITO_REDIRECT_SIGN_IN`  | 로그인 후 리다이렉트 URL   |
| `VITE_COGNITO_REDIRECT_SIGN_OUT` | 로그아웃 후 리다이렉트 URL |

---

## 🌐 프로덕션 환경 설정

### 백엔드 API 연결

현재 `vite.config.ts`의 프록시 설정은 개발 환경용입니다. 프로덕션에서는:

1. **옵션 A**: 백엔드 서버에 CORS 설정 추가
2. **옵션 B**: AWS API Gateway 사용
3. **옵션 C**: CloudFront에서 API 오리진 추가 (권장)

#### CloudFront 멀티 오리진 설정 (옵션 C)

CloudFront 배포에서 추가 오리진 생성:

- `/api/*` → 백엔드 서버 (`http://13.209.98.82:8000`)
- `/spot/*` → 백엔드 서버
- `/user/*` → 백엔드 서버
- 기타 API 경로들...

---

## 📁 프로젝트 구조

```
.github/
└── workflows/
    └── deploy.yml          # GitHub Actions 워크플로우
```

---

## 🔄 배포 트리거

배포는 다음 상황에서 자동으로 실행됩니다:

1. `main` 또는 `master` 브랜치에 **push**할 때
2. `main` 또는 `master` 브랜치로 **Pull Request**가 생성/업데이트될 때
3. GitHub Actions에서 **수동으로 실행**할 때 (workflow_dispatch)

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] AWS S3 버킷 생성 완료
- [ ] CloudFront 배포 생성 완료
- [ ] IAM 사용자 생성 및 정책 연결 완료
- [ ] GitHub Secrets 모두 설정 완료
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] main/master 브랜치에 코드 push

---

## 🐛 문제 해결

### 일반적인 오류

| 오류                     | 원인                    | 해결 방법                       |
| ------------------------ | ----------------------- | ------------------------------- |
| `AccessDenied`           | S3/CloudFront 권한 부족 | IAM 정책 확인                   |
| `InvalidIdentityToken`   | 잘못된 AWS 자격 증명    | Secrets 값 확인                 |
| `Build failed`           | 빌드 오류               | 로컬에서 `npm run build` 테스트 |
| `Distribution not ready` | CloudFront 아직 배포 중 | 15-20분 대기                    |

### 빌드 캐시 문제

GitHub Actions 캐시 문제시:

```yaml
- name: Clear npm cache
  run: npm cache clean --force
```

---

## 📞 추가 리소스

- [AWS S3 문서](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront 문서](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)

---

## 💰 예상 비용

| 서비스     | 프리티어             | 예상 비용         |
| ---------- | -------------------- | ----------------- |
| S3         | 5GB 저장, 20,000 GET | 소규모: ~$0.5/월  |
| CloudFront | 1TB 전송, 10M 요청   | 프리티어 내: 무료 |
| Route 53   | -                    | 도메인: ~$0.5/월  |

---

_마지막 업데이트: 2025-12-23_
