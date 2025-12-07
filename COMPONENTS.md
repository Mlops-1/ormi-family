# 오르미패밀리 모바일 앱 - 컴포넌트 아키텍처 (Cloudscape 기반)

## 개요

이 프로젝트는 **Cloudscape Design System**을 기반으로 재구축된 모바일 우선 웹 애플리케이션입니다.
기존 Tailwind CSS 레이아웃 시스템을 유지하면서, 핵심 컴포넌트는 Cloudscape 라이브러리를 확장하여 사용합니다.

## 컴포넌트 (Cloudscape Wrappers)

### 1. Button Component

**기반**: `@cloudscape-design/components/button`
**파일**: `src/components/Button.tsx`

**Props 인터페이스**:

```typescript
interface ButtonProps extends Omit<CloudscapeButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary'; // Mapped to Cloudscape primary/normal
  fullWidth?: boolean; // Tailwind width override
  className?: string;
  // ...Cloudscape Props
}
```

**설명**:

- Cloudscape Button을 래핑하여 사용
- `primary` → Cloudscape `primary`
- `secondary` → Cloudscape `normal`
- `fullWidth`: `w-full` 클래스 적용

---

### 2. SocialButton Component

**기반**: `@cloudscape-design/components/button`
**파일**: `src/components/SocialButton.tsx`

**Props 인터페이스**:

```typescript
interface SocialButtonProps extends Omit<CloudscapeButtonProps, 'variant'> {
  provider: 'google' | 'x';
  // ...Cloudscape Props
}
```

**설명**:

- `iconSvg` prop을 사용하여 Google/X 벡터 아이콘 전달
- Cloudscape Button의 견고한 인터랙션 활용

---

### 3. Input Component

**기반**: `@cloudscape-design/components/input`, `FormField`
**파일**: `src/components/Input.tsx`

**Props 인터페이스**:

```typescript
interface InputProps extends CloudscapeInputProps {
  label?: string; // Wrapper for FormField
  error?: string; // Mapped to FormField errorText
  className?: string;
}
```

**주요 변경사항**:

- `onChange` 이벤트 핸들링이 Cloudscape 방식(`event.detail.value`)으로 변경됨
- 내부적으로 `FormField`로 래핑되어 레이블과 에러 메시지 처리

**사용 예시**:

```tsx
<Input
  value={username}
  onChange={({ detail }) => setUsername(detail.value)}
  label="사용자 이름"
/>
```

---

### 4. Checkbox Component

**기반**: `@cloudscape-design/components/checkbox`
**파일**: `src/components/Checkbox.tsx`

**Props 인터페이스**:

```typescript
interface CheckboxProps extends CloudscapeCheckboxProps {
  label: string;
  className?: string;
}
```

**주요 변경사항**:

- `onChange` 이벤트 핸들링이 Cloudscape 방식(`event.detail.checked`)으로 변경됨
- `label`은 `children`으로 전달됨

**사용 예시**:

```tsx
<Checkbox
  checked={checked}
  onChange={({ detail }) => setChecked(detail.checked)}
  label="동의합니다"
/>
```

---

### 5. Logo Component

**파일**: `src/components/Logo.tsx`

**설명**:

- 기존 커스텀 디자인 유지 (Tailwind CSS Text Gradient)
- 브랜드 정체성 보존

---

## 스타일링 전략

- **Layout**: Tailwind CSS (`flex`, `grid`, `w-full`, `min-h-screen`) 사용
- **Micro-Components**: Cloudscape Design System 스타일 사용
- **Global Styles**: `@cloudscape-design/global-styles` 적용

## 개발 노트

Cloudscape 컴포넌트는 Shadow DOM이나 스코프된 스타일을 사용하지 않으나, 전용 CSS 변수와 클래스를 사용합니다. Tailwind CSS와의 충돌을 최소화하기 위해 레이아웃(배치, 크기)은 Tailwind로 제어하고, 컴포넌트 내부 스타일은 Cloudscape 기본값을 따릅니다.
