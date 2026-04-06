# SocialTwin / ㈜옴니노드 — 프리미엄 B2B 엔터프라이즈 디자인 시스템 가이드

다른 서비스 페이지를 메인 페이지(`index.html`)와 동일한 쌍용건설(SSYENC) 스타일의 **웅장하고 무게감 있는 기업형 레이아웃**으로 리디자인할 때 참고하는 핵심 가이드라인 문서입니다. 

실제 구현은 `styles.css`에 정의된 `.ss-*` (Social Simulation / Ssangyong Style) 접두사 클래스들이 단일 소스로 작동합니다.

---

## 1. 전체 룩앤필 (Look & Feel)

- **테마 컬러:** 다크 네이비 / 딥 블루(신뢰, 기업) 베이스 + 오렌지/시안(혁신, 하이테크) 포인트 컬러.
- **레이아웃 구조:** 좌우 여백을 가득 채우는 풀 블리드(Full-bleed) 박스형 섹션, 거대한 텍스트, 화면에 꽉 차는 풀스크린 히어로.
- **클래스 네이밍 규칙:** 새로 추가된 모든 엔터프라이즈 레이아웃과 컴포넌트는 `.ss-` 접두사로 시작됩니다 (예: `.ss-hero`, `.ss-vision`, `.ss-b-panel`).

---

## 2. 필수 환경 (새 HTML 페이지 기본 구조)

`index.html` 및 `socialtwin-detail.html`과 동일하게 `<head>`에 다음 폰트와 스타일을 넣어야 합니다.

```html
<link rel="stylesheet" href="styles.css?v=s2" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=Noto+Sans+KR:wght@300;400;600;700;800;900&display=swap" rel="stylesheet" />
```

- **상단 여백 (GNB):** 상단 고정 투명 내비게이션(`.nav`, `id="nav"`) 아래에 콘텐츠가 들어가므로 첫 섹션은 크게 설정합니다.

---

## 3. 핵심 CSS 변수 (포인트 컬러)

`styles.css`의 `:root`에 정의된 핵심 컬러 토큰을 활용합니다.

| 토큰 | 용도 및 설명 |
|-----|------|
| `--indigo` (`#e8692a`) | 주 액센트 포인트 컬러 (강렬한 오렌지 톤). 버튼 배경, 태그, 강조 텍스트에 사용. |
| `--cyan` (`#f0a060`) | 보조 액센트 컬러 (피치/시안 톤). `--indigo`와 혼합해 그라데이션으로 사용. |
| `--gradient-main` | 좌측 상단에서 우측 하단으로 이어지는 메인 투톤 그라데이션. |
| `--text-primary` (`#f1f5f9`) | 기본 화이트 텍스트. 다크 모드 특성상 대부분의 폰트는 흰색을 유지합니다. |

---

## 4. 메인 레이아웃 및 섹션 패턴 (Layout Patterns)

다른 서비스 페이지를 구성할 때는 아래의 4가지 주요 섹션 클래스 패턴을 조합하여 페이지를 만듭니다.

### A. 히어로 섹션 (`.ss-hero`)
페이지 첫 진입 시 브라우저 높이(100vh 또는 50vh)를 가득 채우는 서론 영역입니다.
```html
<section class="ss-hero" style="min-height: 50vh;"> <!-- 서브페이지는 50vh 권장 -->
  <div class="ss-hero-bg">
    <!-- 비디오나 배경 이미지 오버레이 적용 -->
    <div class="ss-hero-overlay" style="background: rgba(8, 12, 20, 0.8);"></div>
  </div>
  <div class="ss-hero-content container" style="text-align:center;">
    <p class="ss-hero-subtitle">SUB TITLE</p>
    <h1 class="ss-hero-title">거대한 메인 타이틀</h1>
  </div>
</section>
```

### B. 비전 / 특징 3열 그리드 (`.ss-vision`)
상세 정보나 특징을 설명할 때 사용하는 3분할 텍스트 기반 카드 영역입니다.
```html
<section class="ss-vision">
  <div class="container container-full"> <!-- 와이드하게 쓸 경우 container-full 사용 -->
    <div class="ss-vision-title">
      <h2>SECTION TITLE</h2>
      <p>설명 문구 작성...</p>
    </div>
    <div class="ss-vision-grid">
      <!-- 카드 1 -->
      <div class="ss-vision-card">
        <div class="ss-vision-text">
          <h3>특징 1 타이틀</h3>
          <p>특징 1 설명</p>
        </div>
        <div class="ss-vision-stat">
          <span class="ss-stat-num">01</span>
        </div>
      </div>
      <!-- 카드 2, 3 추가 (마지막 카드는 style="border-bottom:none;") -->
    </div>
  </div>
</section>
```

### C. 수직 블록 비즈니스 패널 (`.ss-business`)
화면 너비를 n등분하여 꽉 찬 배경 이미지 위에 글씨를 띄우는 강렬한 갤러리/서비스 소개형 섹션입니다.
```html
<section class="ss-business">
  <div class="ss-business-panels">
    <!-- 개별 패널 -->
    <div class="ss-b-panel">
      <!-- 센터/커버 배경 이미지 + 어두운 그라데이션 오버레이 필수 적용 -->
      <div class="ss-b-bg" style="background: linear-gradient(to top, rgba(8,12,20,1) 0%, rgba(8,12,20,0.55) 100%), url('이미지/bg.png') center/cover no-repeat;"></div>
      <div class="ss-b-content">
        <h3>서비스명</h3>
        <p>서비스 설명 작성...</p>
      </div>
    </div>
    <!-- 필요한 만큼 추가 (flex: 1로 동일 비율로 늘어남) -->
  </div>
</section>
```

### D. 끈적이는 스크롤 (Sticky) 스펙트럼 (`.ss-masterpiece`)
좌측에 제목을 고정시키고 우측에 리스트가 흘러가는 고급 인터랙션 레이아웃입니다. 프로세스 설명이나 기술 안내 등에 적합합니다.
```html
<section class="ss-masterpiece">
  <div class="container ss-masterpiece-container">
    <div class="ss-mp-left">
      <h2>좌측 고정<br/>타이틀</h2>
    </div>
    <div class="ss-mp-right">
      <!-- 우측 개별 스크롤 아이템 -->
      <div class="ss-mp-item">
        <div class="ss-mp-info">
          <h4>아이템 타이틀</h4>
          <p>내용...</p>
        </div>
        <!-- 우측 이미지 영역이 없을 경우 제거 가능 -->
      </div>
    </div>
  </div>
</section>
```

---

## 5. 유틸리티 및 특수 요소 (UI Components)

- **출시예정(뱃지):** `.ss-business` 내부나 제목 옆에 붙이는 직사각형 뱃지.
  `style="background:var(--indigo); color:#fff; padding:2px 6px; font-size:0.65rem; border-radius:4px; white-space:nowrap;"` 등 Inline 적용 가능.
- **강렬한 CTA 버튼 배너:** `socialtwin-detail.html` 하단에 존재하는 `var(--indigo)` 배경의 꽉 찬 블록.
  `class="cta-banner"`에 배경색(`background: var(--indigo)`)을 주고 흰색 폰트를 적용하면 깔끔한 행동 유도 섹션 완성.
- **버튼 (`.ss-nav-btn` / `.ss-submit`):**
  주로 사각형(border-radius: 4px)의 각진 투명/솔리드 컬러 버튼 라인을 사용해 기업적인 느낌을 강화했습니다. 가벼운 `.btn--ghost` 둥근 알약형 버튼보다 각진 배치를 권장합니다.

---

## 6. 기타 서비스 페이지 적용 튜토리얼 

새로운 "공공기관 리포팅 서비스" 페이지(`example.html`)를 만든다면:
1. `index.html` 파일을 복제(Copy)하여 기본 골격(Nav, Footer)을 그대로 가져옵니다.
2. 중간의 `ss-vision`, `ss-business-panels`, `ss-masterpiece` 콘텐츠 영역들의 태그 내부 내용만 페이지 성격에 맞게 바꿉니다.
3. 배경 사진(`url('이미지/...png')`)을 해당 서비스의 성격과 맞는 이미지로 교체합니다.
4. 모든 영역은 검정색(다크 네이비)에 오렌지(`--indigo`) 포인트라는 테마를 일관되게 유지해야 합니다. 텍스트는 주로 흰색입니다.
