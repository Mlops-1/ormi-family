# API 명세서 (API Specification)

## 개요

이 문서는 유저 정보를 백엔드로 전송하기 위한 API 명세입니다. 현재는 브라우저 캐시(localStorage)를 사용하고 있지만, 향후 백엔드 연동 시 이 명세를 따릅니다.

## 기본 정보

- **Base URL**: `https://api.ormi-family.com/v1` (예시)
- **Data Format**: JSON
- **Authentication**: Bearer Token (Cognito ID Token)

---

## 1. 유저 프로필 생성 (회원가입 후 온보딩)

**Endpoint**: `POST /users/profile`

**설명**: 회원가입 직후, 추가 정보를 입력하여 유저 프로필을 생성합니다.

**Request Body**:

```json
{
  "nickname": "string (2-20자)",
  "preferredCategories": ["CAFE", "LANDMARK", "DINNER"],
  "accessibilityConditions": ["WHEELCHAIR", "WITH_CHILDREN"],
  "profileImage": "string (Base64 or URL, optional)"
}
```

**Response**:

- **201 Created**:
  ```json
  {
    "ciValue": "user-unique-id",
    "nickname": "오르미",
    "preferredCategories": ["CAFE"],
    "accessibilityConditions": [],
    "profileImage": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
  ```
- **400 Bad Request**: 입력값 유효성 검사 실패

---

## 2. 유저 프로필 조회

**Endpoint**: `GET /users/profile`

**설명**: 현재 로그인한 유저의 프로필 정보를 조회합니다.

**Response**:

- **200 OK**:
  ```json
  {
    "ciValue": "user-unique-id",
    "nickname": "오르미",
    "preferredCategories": ["CAFE", "LANDMARK"],
    "accessibilityConditions": ["WHEELCHAIR"],
    "profileImage": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
  ```
- **404 Not Found**: 프로필이 존재하지 않음 (온보딩 필요)

---

## 3. 유저 프로필 수정

**Endpoint**: `PATCH /users/profile`

**설명**: 유저의 프로필 정보를 일부 수정합니다. 닉네임, 선호 카테고리, 이동 약자 조건, 프로필 사진 등을 변경할 수 있습니다.

**Request Body** (수정할 필드만 포함):

```json
{
  "nickname": "새로운닉네임",
  "preferredCategories": ["DINNER"],
  "profileImage": null // null일 경우 이미지 삭제
}
```

**Response**:

- **200 OK**: 수정된 최신 프로필 정보 반환
- **400 Bad Request**: 입력값 오류

---

## 데이터 타입 정의

### SpotCategory (선호 장소 카테고리)

- `CAFE`: 카페
- `LANDMARK`: 관광명소
- `DINNER`: 식당

### AccessibilityCondition (이동 약자 조건)

- `WHEELCHAIR`: 휠체어 사용
- `WITH_CHILDREN`: 아이 동반
- `WITH_ELDERLY`: 노인 동반
