# TurtleNeck Design System

TurtleNeck 프론트엔드의 디자인 기준 문서입니다. 새 화면이나 컴포넌트를 만들 때 이 문서를 먼저 확인하고, 여기에 없는 값을 새로 만들어야 한다면 이 문서도 함께 수정해 주세요.

- 토큰 원본: [`src/styles/tokens.css`](src/styles/tokens.css) (Figma 디자인 시스템과 이름을 맞춤)
- 컴포넌트 스타일: [`src/App.css`](src/App.css)
- 전역 스타일: [`src/index.css`](src/index.css)

## 1. 제품 톤

- **차분하고 다정한 건강 관리 도구.** 경고를 줄 때도 겁주지 않고, 지금 무엇을 하면 되는지 알려 줍니다.
- 메인 컬러는 편안한 세이지 그린입니다. 경고 색(주황/빨강)은 **자세 상태를 알릴 때만** 씁니다.
- 마스코트 거북이(`src/assets/turtle.png`)가 브랜드의 얼굴입니다. 스플래시, 헤더 워드마크, 자세 상태 일러스트, 섹션 제목 아이콘에 씁니다.

## 2. 컬러

### 2.1 브랜드 팔레트 (`tokens.css`)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--color-green-100` | `#64947c` | Primary. 주요 버튼, 활성 탭, 강조 텍스트 |
| `--color-green-70` | `#93b4a3` | Primary hover, 일러스트 보조 |
| `--color-green-50` | `#b1c9bd` | 로더 점, 게이지 정상 구간 |
| `--color-green-30` | `#d0dfd8` | 브랜드 테두리 |
| `--color-green-10` | `#eff4f2` | 연한 배경, 활성 탭 배경, 데스크톱 페이지 배경 |
| `--color-black-100` | `#484345` | 제목 등 강한 텍스트 |
| `--color-black-70` | `#585858` | 본문 텍스트 |
| `--color-black-50` | `#888888` | 보조 텍스트, 비활성 탭 |
| `--color-black-30` | `#b8b8b8` | 비활성(disabled) 텍스트 |
| `--color-black-10` | `#e7e7e7` | 기본 테두리, 섹션 구분선(10px) |
| `--color-brown` | `#4c3a24` | 액센트 (현재 거의 사용하지 않음) |
| `--color-white` | `#ffffff` | 표면 |

### 2.2 시맨틱 토큰

컴포넌트에서는 팔레트 이름 대신 **시맨틱 토큰**을 씁니다.

| 토큰 | 매핑 |
| --- | --- |
| `--color-primary` / `-hover` / `-soft` / `-subtle` | green-100 / 70 / 30 / 10 |
| `--color-text-strong` / `text` / `text-muted` / `text-disabled` / `text-inverse` | black-100 / 70 / 50 / 30 / white |
| `--color-background`, `--color-surface` | white |
| `--color-surface-subtle` | green-10 |
| `--color-border` / `--color-border-brand` | black-10 / green-30 |
| `--shadow-color` / `--shadow-color-brand` | `rgb(17 17 17 / 10%)` / `rgb(100 148 124 / 18%)` |
| `--focus-ring` | `rgb(100 148 124 / 45%)` |

### 2.3 자세 상태 컬러

자세 측정 화면은 서버 판정(`GOOD` / `WARNING` / `BAD`)에 맞춰 세 단계 색을 씁니다. 아직 토큰으로 빠지지 않고 `App.css`에 직접 들어가 있으니, 새로 쓸 때는 아래 값을 그대로 맞춰 주세요.

| 상태 | 의미 | 강조색 | 배경 | 테두리 / 게이지 구간 |
| --- | --- | --- | --- | --- |
| 정상 `GOOD` | 편차 10° 미만 | `--color-primary` | `--color-primary-subtle` | `--color-green-50` |
| 주의 `WARNING` | 편차 10° 이상 20° 미만 | `#d56b4e` (문구), `#d9933d` (배지·게이지) | `#fff7f4` | `#f1c8bd`, 게이지 `#f1d3a6` |
| 위험 `BAD` | 편차 20° 이상 | `#c44f4f` | `#fff6f6` | `#edc1c1` |
| 비활성 (미보정·연결 끊김) | 측정 불가 | `--color-text-muted` | `#f7f7f7` | - |

> TODO: 위 값을 `--color-status-warning-*`, `--color-status-danger-*` 토큰으로 옮기기. 통계 페이지의 `#f00013`(교정 필요 횟수)과 `#7d7d80`, `#54555a`, `#111111` 같은 회색도 토큰으로 정리할 대상입니다.

## 3. 타이포그래피

- 서체: **Pretendard Variable** (`pretendard` 패키지, `--font-family-base`). 대체 서체는 시스템 산세리프입니다.
- `letter-spacing: 0`. 자간은 따로 조정하지 않습니다.
- 한국어 문장이 기본이라 줄간격을 넉넉히(1.38~1.6) 둡니다.

| 역할 | 모바일 | 데스크톱 | 굵기 | 예시 |
| --- | --- | --- | --- | --- |
| Hero 제목 | 24px / 1.48 | `clamp(38px, 4vw, 54px)` / 1.3 | 700 (강조어만 primary) | 메인 "바른 자세가 만드는…" |
| 페이지 제목 | 24px / 1.38 | 30px | 700 | 스트레칭 인트로, 404 |
| 섹션 제목 | 20px / 1.3 | 동일 | 700 | "오늘의 추천 스트레칭" |
| 상태 제목 | 20px / 32px | 동일 | 500 | 자세 상태 문구 |
| 모바일 헤더 | 17px | (숨김) | 700 | 페이지 상단 바 |
| 카드 제목 | 15px / 1.38 | 16px | 700 | 스트레칭 카드 |
| 버튼 | 15~16px | 동일 | 700 | `action-button`, `primary-button` |
| 본문 | 12~13px / 1.5~1.6 | 12~15px | 400~500 | 설명, 안내 |
| 캡션·키커 | 10~13px | 동일 | 600~800 | 태그, `feature-kicker` |
| 큰 수치 | 28px | 동일 | 600 | 자세 유지 시간 `00:00` |

## 4. 간격, 모서리, 그림자

- **페이지 좌우 여백**: 모바일 20px. 데스크톱 콘텐츠 폭은 `min(1180px, 100% - 64px)`, 카드형 페이지(`feature-page`)는 최대 820px에 안쪽 여백 42~56px / 48px입니다.
- **간격 단위**: 4px 배수를 기본으로 씁니다(8, 12, 14, 16, 20, 24, 28). 카드 리스트 간격은 12~14px, 데스크톱 그리드는 20px입니다.
- **섹션 구분**: 모바일에서 섹션 사이는 `10px solid var(--color-black-10)` 굵은 띠로 나눕니다.
- **모서리 반경**
  - 8px: 기본값. 버튼, 카드, 입력, 측정 정보 박스
  - 999px: 필터 칩, 태그, 상태 배지, 게이지 막대
  - 50%: 아이콘 원형 배경, 상태 아이콘
  - 4px: 홈 추천 썸네일
  - 10px: 통계 요약 카드
- **그림자**: 평소에는 거의 쓰지 않습니다. hover 때 `0 10~12px 24~28px var(--shadow-color)`, 데스크톱 자세 측정 카드는 `0 18px 40px var(--shadow-color)`, 마스코트에는 `drop-shadow`로 `--shadow-color-brand`를 씁니다.

## 5. 레이아웃 & 반응형

- **모바일 우선.** 기준 폭 375~390px, 최소 320px.
- 브레이크포인트는 **768px** 하나입니다.

| | 모바일 (< 768px) | 데스크톱 (≥ 768px) |
| --- | --- | --- |
| 내비게이션 | 하단 고정 탭바 `bottom-nav` (높이 72px + safe-area) | 상단 `site-header` + `desktop-nav` (밑줄 활성 표시) |
| 페이지 헤더 | `mobile-page-header` (뒤로가기 + 제목, sticky, blur) | 숨김 |
| 배경 | 흰색 | `--color-primary-subtle` 위에 흰 카드 |
| 스트레칭 목록 | 1열 | 2열 |
| 스트레칭 상세 | 이미지 위, 본문 아래 | 좌우 2단 그리드 |

- 높이는 `100svh`를 기준으로 하고, iOS 홈 인디케이터를 위해 `env(safe-area-inset-bottom)`을 반영합니다.
- hover 효과는 `@media (hover: hover)` 안에서만 줍니다. 터치 기기에서 hover 상태가 남지 않게 하기 위해서입니다.

## 6. 아이콘

- `App.tsx`의 `Icon` 컴포넌트가 인라인 SVG(24×24 viewBox)를 렌더링합니다. 외부 아이콘 라이브러리는 쓰지 않습니다.
- 기본은 **선 아이콘**입니다: `stroke-width: 1.9`, 둥근 끝(round cap/join), `currentColor`.
- 탭바용 `home`, `heart`, `chart`만 채운 아이콘(`.icon--filled`)입니다.
- 크기: 탭바 22px, 버튼 안 20px, 인라인 메타 13~16px.
- 새 아이콘은 `IconName` 유니언과 `paths`에 추가하고, 같은 선 스타일을 지켜 주세요.

## 7. 컴포넌트

| 컴포넌트 | 클래스 | 규칙 |
| --- | --- | --- |
| 주요 버튼 | `.action-button` | 높이 52px(작은 버전 42~46px), primary 배경, 흰 글자 700, 아이콘 + 라벨. 한 화면에 하나만 둡니다. |
| 메인 CTA | `.primary-button` | 홈 Hero 하단 고정 버튼. 모바일에서는 아이콘을 숨깁니다. |
| 필터 칩 | `.target-filter button` | 높이 34px, pill. 활성이면 primary로 채우고, `aria-pressed`를 씁니다. |
| 세그먼트 탭 | `.trend-tabs` | 회색 트랙 안의 작은 탭. 활성이면 primary로 채우고, `role="tab"`과 `aria-selected`를 씁니다. |
| 정렬 셀렉트 | `.stretch-sort` | 네이티브 `<select>`에 커스텀 chevron을 얹습니다. |
| 스트레칭 카드 | `.stretch-card` | 썸네일(부위 태그) + 출처 + 제목 2줄 말줄임 + 요약 + 소요 시간 |
| 추천 카드 | `.routine-card` | 홈의 가로 스크롤 카드. 폭 202px, scroll-snap |
| 측정 정보 | `.posture-readout` | 3열 그리드. 가장 중요한 값(유지 시간)은 전체 폭 `__primary`로 둡니다. |
| 편차 게이지 | `.deviation-gauge` | 0~30° 막대에 정상/주의/위험 구간과 현재 위치 마커, 상태 배지를 둡니다. `role="meter"`를 씁니다. |
| 빈 상태 | `.statistics-empty` | 점선 브랜드 테두리 + 원형 아이콘 + 제목 + 설명 + CTA |
| 오류 상태 | `.stretch-feedback` | 연한 빨강 배경 + 경고 아이콘 + "다시 시도" 버튼 |
| 로딩 | `.stretch-card--loading`, `.analysis-loader` | 스켈레톤 shimmer, 또는 점 3개 pulse |

## 8. 자세 측정 화면 상태

센서 처리 원리는 하드웨어 레포 [Dr-SongSunsang/Hadware](https://github.com/Dr-SongSunsang/Hadware)를 참고하세요. 요약하면 두 센서의 pitch 차이(`delta`)가 목 각도이고, 서버가 기준 자세(5초 평균) 대비 편차로 상태를 판정합니다. 판정 기준값은 `src/api/posture.ts`의 `POSTURE_THRESHOLDS`에 모여 있습니다.

| 화면 상태 | 서버 상태 | 일러스트 | 제목 | 보조 문구 색 |
| --- | --- | --- | --- | --- |
| `analyzing` | 첫 데이터 수신 전 | 분석 종이 + 로더 | 자세를 분석중이에요 | primary |
| `uncalibrated` | `UNCALIBRATED` | 회색 배지 거북이 | 기준 자세 설정이 필요해요 | muted |
| `calibrating` | (기준 측정 5초) | 분석 종이 + 로더 | 기준 자세를 설정 중이에요 | primary |
| `normal` | `GOOD` | 체크 배지 거북이 | 바른 자세에요! | primary |
| `needsCorrection` | `WARNING` | 기울어진 거북이 + 경고 | 고개가 조금 앞으로 나왔어요 | `#d56b4e` |
| `needsCorrection` + bad | `BAD` | 기울어진 거북이 + 경고 | 거북목 자세가 지속되고 있어요 | `#c44f4f` |
| `disconnected` | 소켓·기기 끊김 | 회색 배지 거북이 | 기기 연결이 끊어졌어요 | muted |

- 수치는 소수 첫째 자리까지, 단위는 `°`로 씁니다(`formatDegrees`).
- 경계값 근처에서 상태가 깜빡이지 않도록 판정은 서버의 히스테리시스(진입 10°, 해제 8°)를 따릅니다. 프론트에서 따로 다시 판정하지 않습니다.

## 9. 모션

| 이름 | 용도 | 시간 |
| --- | --- | --- |
| `fade-in` | 스플래시 진입 | .4s |
| `turtle-float` | 마스코트 둥실 | 2.2~3s infinite |
| `loading-pulse` | 분석 로더 점 | 1.1s, .16s 간격 |
| `shimmer` | 스켈레톤 | 1.2s |
| 전환 | hover, 버튼 | .18s ease |
| 게이지 마커 | 편차 이동 | `left .4s ease` |

움직임은 짧고 부드럽게 유지합니다. 경고 상태라고 흔들거나 깜빡이는 효과는 쓰지 않습니다.

`prefers-reduced-motion: reduce`에서는 모든 애니메이션과 전환을 사실상 끕니다(`App.css` 하단). 새 애니메이션도 이 규칙에 걸리도록 CSS 애니메이션/트랜지션으로 만들어 주세요.

## 10. 문구 (Voice & Tone)

- **해요체**를 씁니다. 예: "바른 자세로 가만히 있어 주세요.", "다시 시도해 주세요."
- 문제를 알릴 때는 **원인 + 지금 할 일**을 함께 씁니다. 예: "측정 중 움직임이 감지됐어요. 바른 자세로 5초간 가만히 있어 주세요."
- 사용자를 탓하지 않습니다. "잘못된 자세" 대신 "고개가 조금 앞으로 나왔어요"처럼 씁니다.
- 숫자와 단위는 붙여 씁니다: `5초`, `24.1°`, `20초씩 3세트`.

## 11. 접근성

- 포커스: `button`과 `a`에 `3px solid var(--focus-ring)`, offset 3px.
- 장식용 이미지와 아이콘은 `alt=""` 또는 `aria-hidden="true"`로 숨깁니다.
- 실시간으로 바뀌는 자세 상태 영역은 `aria-live="polite"`, 오류는 `role="alert"`, 게이지는 `role="meter"`와 `aria-valuetext`를 씁니다.
- 색만으로 상태를 구분하지 않습니다. 항상 텍스트 라벨(정상/주의/위험)을 함께 둡니다.
- 터치 영역은 40px 이상을 목표로 합니다(헤더 버튼 40×40px, 주요 버튼 52px). 필터 칩(34px)과 세그먼트 탭(28px)은 기준보다 작으니, 새로 만들 때는 키우는 쪽을 권장합니다.
