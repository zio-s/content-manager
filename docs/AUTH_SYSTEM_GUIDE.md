# 인증 시스템 완벽 가이드

## 🎯 목차
1. [전체 구조](#전체-구조)
2. [토큰 기반 인증 개념](#토큰-기반-인증-개념)
3. [로그인 플로우](#로그인-플로우)
4. [자동 토큰 갱신](#자동-토큰-갱신)
5. [세션 복원](#세션-복원)
6. [KOMCA 패턴 비교](#komca-패턴-비교)
7. [면접 대응](#면접-대응)

---

## 전체 구조

```
인증 시스템 아키텍처
==================

사용자
  ↓
Login Page → Redux (loginThunk)
  ↓
Auth Service (login)
  ↓
Token Manager (createTokenPair)
  ↓
localStorage 저장
  ↓
Redux State 업데이트
  ↓
API 요청 (apiClient)
  ↓
Axios 요청 인터셉터 (자동 토큰 주입)
  ↓
Axios 응답 인터셉터 (401 시 자동 갱신)
```

### 📁 파일 구조
```
src/shared/
├── auth/
│   ├── types.ts              # 타입 정의
│   ├── token-manager.ts      # 토큰 생성/검증/갱신
│   └── auth-service.ts       # 로그인/로그아웃/세션복원
│
├── store/
│   ├── store.ts              # Redux Store 설정
│   └── slices/
│       └── auth-slice.ts     # 인증 상태 관리
│
└── api/
    └── axios-instance.ts     # Axios 인터셉터
```

---

## 토큰 기반 인증 개념

### 1. 왜 토큰을 사용하나요?

**전통적인 세션 방식:**
```
장점: 서버에서 세션 관리 → 보안 강화
단점: 서버 메모리 사용, 확장성 문제
```

**토큰 방식 (JWT):**
```
장점: Stateless (서버 메모리 불필요), 확장성 좋음
단점: 토큰 탈취 시 무효화 어려움
```

### 2. Access Token vs Refresh Token

| 구분 | Access Token | Refresh Token |
|------|--------------|---------------|
| **수명** | 짧음 (15분) | 김 (7일) |
| **용도** | API 요청 | 토큰 갱신 |
| **보안** | 탈취 시 피해 적음 | 탈취 시 피해 큼 |
| **저장** | Memory/localStorage | httpOnly Cookie (이상적) |

**🎓 이중 토큰 전략:**
- Access Token만: 15분마다 재로그인 필요 (UX 나쁨)
- Refresh Token만: 탈취 시 7일간 악용 (보안 나쁨)
- **둘 다 사용**: 보안 + UX 모두 만족 ✅

### 3. 우리의 구현 방식

```typescript
// UUID 토큰 생성
const accessToken = uuidv4()  // "a1b2c3d4-e5f6..."

// 메타데이터 별도 저장
const metadata = {
  userId: "1",
  email: "admin@example.com",
  role: "admin",
  issuedAt: Date.now(),
  expiresAt: Date.now() + (15 * 60 * 1000)
}
localStorage.setItem(`token_meta_${token}`, JSON.stringify(metadata))
```

**실제 JWT vs 우리 방식:**
- **JWT**: 토큰 자체에 정보 인코딩 (Base64)
- **우리**: UUID + 메타데이터 분리 저장
- **결과**: 구조는 다르지만, 동작 원리는 동일

---

## 로그인 플로우

### 전체 과정

```typescript
// 1. 사용자가 로그인 폼 제출
<LoginForm onSubmit={(email, password) => {
  dispatch(loginThunk({ email, password }))
}} />

// 2. Redux Thunk 실행
loginThunk → authService.login()

// 3. Auth Service에서 사용자 검증
const users = await fetch('/mock-data/auth.json')
const user = users.find(u => u.email === email && u.password === password)

// 4. 토큰 생성
const tokens = createTokenPair(user)
// {
//   accessToken: "a1b2c3d4...",
//   refreshToken: "e5f6g7h8..."
// }

// 5. localStorage 저장
localStorage.setItem('accessToken', tokens.accessToken)
localStorage.setItem('refreshToken', tokens.refreshToken)
localStorage.setItem('userInfo', JSON.stringify(user))

// 6. Redux 상태 업데이트
state.user = user
state.accessToken = tokens.accessToken
state.isAuthenticated = true
```

### 코드 예시

```typescript
// 컴포넌트에서 사용
import { useDispatch } from 'react-redux'
import { loginThunk } from '@/shared/store/slices/auth-slice'

function LoginPage() {
  const dispatch = useDispatch()

  const handleLogin = async (email: string, password: string) => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap()
      // 성공 → 대시보드로 이동
      navigate('/dashboard')
    } catch (error) {
      // 실패 → 에러 메시지 표시
      alert(error)
    }
  }

  return <LoginForm onSubmit={handleLogin} />
}
```

---

## 자동 토큰 갱신

### 가장 중요한 부분! 🔥

**문제 상황:**
```
사용자가 대시보드에서 작업 중
  ↓
15분 경과 → Access Token 만료
  ↓
API 요청 → 401 Unauthorized
  ↓
사용자에게 "로그인이 만료되었습니다" 메시지?
  ↓
사용자: "뭐야... 귀찮아..." (이탈)
```

**해결책: 자동 갱신**
```
사용자가 대시보드에서 작업 중
  ↓
15분 경과 → Access Token 만료
  ↓
API 요청 → 401 Unauthorized
  ↓
Axios 인터셉터가 자동 감지
  ↓
Refresh Token으로 새 Access Token 발급
  ↓
원래 요청 자동 재시도
  ↓
사용자: "음? 잘 되네?" (만족)
```

### 핵심 코드 (axios-instance.ts)

```typescript
// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401 에러 감지
    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true  // 무한 루프 방지

      // 1. Refresh Token 가져오기
      const tokens = getStoredTokens()

      // 2. 새 Access Token 발급
      const newAccessToken = refreshAccessToken(tokens.refreshToken)

      // 3. localStorage + Redux 업데이트
      saveTokens({ accessToken: newAccessToken, refreshToken: tokens.refreshToken })
      store.dispatch(setAccessToken(newAccessToken))

      // 4. 원래 요청 재시도 (새 토큰으로)
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
      return axiosInstance(originalRequest)
    }

    return Promise.reject(error)
  }
)
```

### 시퀀스 다이어그램

```
사용자          컴포넌트         API Client      인터셉터        TokenManager
  |                |                |               |                |
  |-- 게시글 조회 -->|                |               |                |
  |                |-- GET /posts -->|               |                |
  |                |                |-- 요청 전송 -->|                |
  |                |                |               |<-- 401 에러 ---|
  |                |                |               |                |
  |                |                |               |-- refreshToken -->
  |                |                |               |<-- newToken ---|
  |                |                |               |                |
  |                |                |<-- 재시도 ----|                |
  |                |<-- 성공 응답 --|                |                |
  |<-- 화면 표시 --|                |                |                |
```

---

## 세션 복원

### 왜 필요한가?

```
상황 1: 페이지 새로고침
사용자: "F5 누름"
결과: Redux 상태 초기화 → 로그인 풀림 (나쁨)

상황 2: 브라우저 재시작
사용자: "내일 다시 접속"
결과: 로그인 풀림 → 재로그인 필요 (나쁨)
```

### 해결: 세션 복원

```typescript
// App.tsx - 앱 시작 시 자동 실행
useEffect(() => {
  dispatch(getSessionThunk())
}, [])

// getSessionThunk 동작
1. localStorage에서 토큰 확인
2. Access Token 만료 체크
3. 만료되었으면 Refresh Token으로 갱신
4. 사용자 정보 복원
5. Redux 상태 업데이트
```

### 플로우

```
앱 시작 (App.tsx)
  ↓
useEffect → dispatch(getSessionThunk())
  ↓
localStorage에 토큰 있음?
  ↓ Yes
Access Token 유효?
  ↓ No
Refresh Token으로 갱신
  ↓
Redux 상태 복원
  ↓
사용자: "자동 로그인 됐네!" ✅
```

---

## KOMCA 패턴 비교

### 동일한 구조

| 항목 | KOMCA | content-manager |
|------|-------|-----------------|
| **상태 관리** | Redux Toolkit | Redux Toolkit ✅ |
| **비동기 처리** | createAsyncThunk | createAsyncThunk ✅ |
| **HTTP 클라이언트** | Axios | Axios ✅ |
| **인터셉터** | 요청/응답 둘 다 | 요청/응답 둘 다 ✅ |
| **자동 갱신** | 401 시 refresh | 401 시 refresh ✅ |
| **구조 패턴** | Service → Slice | Service → Slice ✅ |

### 차이점 (데이터 소스만)

| 항목 | KOMCA | content-manager |
|------|-------|-----------------|
| **인증** | Supabase Auth API | JSON 파일 |
| **토큰 발급** | Supabase 서버 | 클라이언트 UUID |
| **토큰 검증** | Supabase 서버 | localStorage 메타데이터 |
| **데이터** | PostgreSQL | JSON 파일 |

**결론: 구조는 100% 동일, 데이터 소스만 다름**

---

## 면접 대응

### Q1: "토큰 기반 인증의 장단점은?"

**답변:**
```
장점:
1. Stateless: 서버가 세션 저장 불필요 → 확장성 좋음
2. 분산 시스템: 여러 서버 간 공유 쉬움
3. 모바일 친화적: 네이티브 앱에서도 사용 쉬움

단점:
1. 토큰 탈취 위험: XSS 공격에 취약
2. 무효화 어려움: 서버에서 즉시 무효화 불가능
3. 페이로드 크기: 세션 ID보다 크기가 큼

해결책:
- Access Token: 짧은 수명 (15분)
- Refresh Token: 긴 수명 (7일)
- httpOnly Cookie 사용 (XSS 방지)
```

### Q2: "자동 토큰 갱신은 어떻게 구현했나요?"

**답변:**
```
Axios 응답 인터셉터를 사용했습니다.

1. 모든 API 요청이 401 에러를 반환하면 인터셉터가 감지
2. Refresh Token의 유효성을 확인
3. 유효하면 새 Access Token 발급
4. 원래 요청을 새 토큰으로 재시도
5. 사용자는 에러를 느끼지 못함

핵심은 _isRetry 플래그로 무한 루프를 방지하는 것입니다.
```

### Q3: "백엔드 없이 어떻게 인증을 구현했나요?"

**답변:**
```
UUID로 토큰을 생성하고, 메타데이터를 localStorage에 저장했습니다.

실제 프로덕션:
- 서버가 JWT 발급
- 서버가 토큰 검증
- 보안이 서버에서 보장됨

저의 Mock 구현:
- 클라이언트가 UUID 생성
- 클라이언트가 timestamp로 만료 체크
- 실제 보안은 없지만, 전체 플로우는 동일

목적:
- 토큰 기반 인증의 개념 학습
- 자동 갱신 메커니즘 이해
- Redux 통합 패턴 숙지
- 실제 백엔드 연결 시 Service 레이어만 교체하면 됨
```

### Q4: "보안은 어떻게 처리했나요?"

**답변:**
```
Mock 환경이므로 실제 보안은 없습니다.

하지만 실제 프로덕션 환경을 가정하여:

1. HTTPS 필수: 모든 통신 암호화
2. httpOnly Cookie: XSS 공격 방지
3. CSRF Token: CSRF 공격 방지
4. 짧은 Access Token: 탈취 피해 최소화
5. Refresh Token Rotation: 재사용 공격 방지

학습 포인트:
- localStorage는 XSS에 취약함을 이해
- 실제로는 httpOnly Cookie 사용해야 함
- 토큰 관리의 보안 트레이드오프 이해
```

### Q5: "KOMCA 프로젝트와 비교하면?"

**답변:**
```
KOMCA 프로젝트의 인증 구조를 분석하고 동일하게 구현했습니다.

동일한 부분:
- Redux Toolkit + createAsyncThunk
- Axios 인터셉터 (요청/응답)
- 자동 토큰 갱신 로직
- Service → Slice 아키텍처 패턴

차이점:
- KOMCA: Supabase Auth API
- 저의 프로젝트: Mock JSON + localStorage

실무 적용:
- 구조가 동일하므로 실제 백엔드 연결 시
- auth-service.ts만 교체하면 즉시 적용 가능
```

---

## 다음 단계

1. ✅ 타입 정의 (types.ts)
2. ✅ Token Manager (token-manager.ts)
3. ✅ Auth Service (auth-service.ts)
4. ✅ Redux Slice (auth-slice.ts)
5. ✅ Axios 인터셉터 (axios-instance.ts)
6. ⏳ **로그인 페이지 구현**
7. ⏳ **Protected Route 구현**
8. ⏳ **App.tsx에서 세션 복원**
9. ⏳ **대시보드 구현**

---

**작성일**: 2025-11-18
**프로젝트**: content-manager
**작성자**: 변세민
