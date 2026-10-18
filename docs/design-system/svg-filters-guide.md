# SVG 필터 실전 가이드

이 문서는 코딩애플의 영상과 `codingapple1/svg-filters` 저장소를 바탕으로 SVG 필터의 동작 원리를 다시 정리한 실습 자료입니다. 저장소 코드를 복제하지 않고, 개념을 검증한 뒤 모든 예제를 새로 작성했습니다.

브라우저에서 바로 열 수 있는 [svg-filter-lab.html](./examples/svg-filter-lab.html)을 함께 제공합니다. 문서 아래쪽에도 같은 전체 코드를 실어 두었습니다.

- 가까운 도형이 액체처럼 합쳐지는 gooey 효과
- 글자와 도형이 손으로 그린 것처럼 흔들리는 displacement 효과
- 선이 실제로 그려지는 필기 애니메이션
- 여러 필터 출력을 합성한 네온 발광 효과
- 밝기를 두 색상으로 다시 매핑하는 duotone 효과
- 필터가 아닌 mask, gradient, blend를 조합한 홀로그램 카드

## 조사 범위

| 대상 | 확인 내용 |
| --- | --- |
| [영상: 진정한 남자는 포토샵 대신 html 쓴다고 함](https://youtu.be/RrYPBkmnUwc) | SVG filter primitive를 연결해 gooey, 흔들림, 구름, 필기, 홀로그램 계열 효과를 만드는 흐름 |
| [codingapple1/svg-filters](https://github.com/codingapple1/svg-filters) | 커밋 `20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4`의 HTML과 이미지 예제 전체 |
| [W3C Filter Effects Module Level 1](https://www.w3.org/TR/filter-effects-1/) | 필터 파이프라인, primitive 속성, 필터 영역과 색 공간의 표준 동작 |
| [MDN SVG filter](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter) | 브라우저에서 사용하는 기본 문법과 호환성 참고 |

조사 시점은 2026-07-22입니다. 저장소 원본은 `/private/tmp/svg-filters-source`에 클론해 확인했습니다.

## 영상에서 다룬 흐름

영상은 6분 24초이며 기술 내용은 다음 순서로 진행됩니다.

| 구간 | 내용 | 코드에서 확인한 근거 |
| --- | --- | --- |
| 00:00-01:08 | SVG filter를 렌더링된 픽셀에 적용하는 처리 단계로 소개합니다. | W3C의 filter primitive tree 설명과 일치합니다. |
| 02:04-02:50 | `feDisplacementMap`이 두 번째 입력의 채널값에 따라 첫 번째 입력 픽셀을 옮기는 원리를 설명합니다. | `turbulence/test-displacementMap.html` |
| 02:50-03:23 | `feTurbulence` noise를 displacement map으로 사용하고 seed를 바꿔 흔들림을 만듭니다. | `turbulence/squiggle-image.html`, `squiggle-text.html` |
| 03:23-03:37 | `feBlend`로 두 입력의 합성 방식을 바꿀 수 있다고 설명합니다. | 저장소에는 대응 예제가 없어 W3C 명세로 교차 확인했습니다. |
| 03:38-04:43 | Gaussian blur와 알파 대비로 가까운 도형을 하나처럼 연결하는 gooey 효과를 만듭니다. | `gooey/gooey-demo.html` |
| 04:43-05:03 | `feComposite`로 원본 디테일을 되살려 글자와 이모지 gooey 효과를 개선합니다. | `gooey/text2.html` |
| 05:04-05:39 | Liquid Glass와 홀로그램 같은 활용 사례를 보여줍니다. | 저장소의 홀로그램은 filter가 아닌 mask, gradient, blend 조합입니다. |
| 05:40-06:21 | cross-origin iframe에 SVG filter를 적용할 수 있었던 동작을 이용한 clickjacking 연구를 소개합니다. | 원 연구와 Chrome 150 완화 내용을 별도로 확인했습니다. |

영상의 displacement 설명은 이해를 위해 "밝기 정보"로 단순화되어 있습니다. 실제 계산은 `xChannelSelector`와 `yChannelSelector`에 지정한 R, G, B, A 채널값을 사용합니다. 아래 예제는 두 축이 같은 데이터에 끌려가지 않도록 X축에는 R, Y축에는 G를 명시했습니다.

## 먼저 이해할 구조

SVG 필터는 그래픽 하나에 함수를 한 번 적용하는 기능이 아닙니다. 작은 영상 처리 단계를 위에서 아래로 연결하는 파이프라인입니다.

```html
<svg aria-hidden="true" width="0" height="0">
  <defs>
    <filter id="example-filter">
      <feGaussianBlur
        in="SourceGraphic"
        stdDeviation="6"
        result="blurred"
      />
      <feColorMatrix
        in="blurred"
        type="saturate"
        values="0"
        result="grayscale"
      />
      <feComposite
        in="SourceGraphic"
        in2="grayscale"
        operator="atop"
      />
    </filter>
  </defs>
</svg>
```

핵심은 세 가지입니다.

1. `in`은 현재 단계가 읽을 입력입니다. `SourceGraphic`은 필터를 적용하기 전 원본 그래픽입니다.
2. `result`는 현재 단계의 출력에 이름을 붙입니다. 다음 단계의 `in`이나 `in2`에서 다시 사용할 수 있습니다.
3. 마지막 primitive의 출력이 최종 결과가 됩니다. 중간 결과를 만들었어도 마지막에 원본만 출력하면 앞 단계 효과는 보이지 않습니다.

CSS로 HTML 요소에 적용할 수도 있고 SVG 요소에 직접 적용할 수도 있습니다.

```css
.filtered-html-element {
  filter: url(#example-filter);
}
```

```html
<g filter="url(#example-filter)">
  <circle cx="50" cy="50" r="40" />
</g>
```

## 자주 쓰는 primitive

| primitive | 역할 | 주로 조절하는 값 |
| --- | --- | --- |
| `feGaussianBlur` | 픽셀을 주변으로 퍼뜨립니다. | `stdDeviation` |
| `feColorMatrix` | RGBA 채널을 행렬로 변환합니다. | `type`, `values` |
| `feComponentTransfer` | 채널별로 입력값을 다시 매핑합니다. | `tableValues`, `slope`, `intercept` |
| `feTurbulence` | 절차적으로 noise 이미지를 생성합니다. | `type`, `baseFrequency`, `numOctaves`, `seed` |
| `feDisplacementMap` | 두 번째 입력의 채널값으로 첫 번째 입력의 픽셀 위치를 이동합니다. | `scale`, `xChannelSelector`, `yChannelSelector` |
| `feFlood` | 필터 영역을 단색으로 채운 중간 이미지를 만듭니다. | `flood-color`, `flood-opacity` |
| `feComposite` | 두 입력을 Porter-Duff 규칙이나 산술식으로 합성합니다. | `operator`, `in`, `in2` |
| `feMerge` | 여러 중간 결과를 지정한 순서로 쌓습니다. | `feMergeNode` 순서 |

### 색상 행렬을 읽는 법

`feColorMatrix type="matrix"`의 `values`는 4행 5열 행렬입니다. 각 행은 출력 R, G, B, A를 계산합니다.

```text
R' = r1*R + r2*G + r3*B + r4*A + r5
G' = g1*R + g2*G + g3*B + g4*A + g5
B' = b1*R + b2*G + b3*B + b4*A + b5
A' = a1*R + a2*G + a3*B + a4*A + a5
```

Gooey 효과에서 자주 쓰는 마지막 행이 `0 0 0 20 -9`라면 알파 계산은 다음과 같습니다.

```text
A' = clamp(20*A - 9, 0, 1)
```

블러 때문에 생긴 낮은 알파는 0으로 밀리고, 도형이 겹친 높은 알파는 1에 가까워집니다. 그래서 흐릿한 두 도형이 경계가 선명한 하나의 덩어리처럼 보입니다.

### displacement를 읽는 법

`feDisplacementMap`은 `in2`의 채널값을 좌표 이동량으로 해석합니다. 채널값 0.5는 이동하지 않는 기준점이고 0과 1은 서로 반대 방향으로 이동합니다.

```text
새 X = 기존 X + scale * (선택한 X 채널값 - 0.5)
새 Y = 기존 Y + scale * (선택한 Y 채널값 - 0.5)
```

`feTurbulence`를 `in2`로 넘기면 noise의 밝고 어두운 부분에 따라 원본 픽셀이 서로 다른 방향으로 밀립니다. 자세한 계산식은 [MDN feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap)에서 확인할 수 있습니다.

## 원본 저장소에서 확인한 내용

저장소는 설치형 스킬이 아닙니다. `SKILL.md`, 빌드 도구, 테스트, 설명 문서가 없고 HTML과 PNG 실험 파일로 구성되어 있습니다.

| 계열 | 원본 위치 | 확인한 구조 |
| --- | --- | --- |
| Gooey | [`gooey/gooey-demo.html`](https://github.com/codingapple1/svg-filters/blob/20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4/gooey/gooey-demo.html#L37-L70) | blur 결과의 알파 대비를 높이고 range input으로 값을 변경합니다. |
| Gooey text | [`gooey/text2.html`](https://github.com/codingapple1/svg-filters/blob/20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4/gooey/text2.html#L36-L50) | goo 결과 위에 원본을 합성해 글자 색을 복원합니다. |
| Squiggle | [`turbulence/squiggle-text.html`](https://github.com/codingapple1/svg-filters/blob/20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4/turbulence/squiggle-text.html#L1-L12) | turbulence를 displacement 입력으로 사용하고 seed를 애니메이션합니다. |
| Handwriting | [`handwriting.html`](https://github.com/codingapple1/svg-filters/blob/20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4/handwriting.html#L24-L74) | stroke dash 애니메이션과 blur 기반 paint 효과를 결합합니다. |
| Cloud | [`cloud.html`](https://github.com/codingapple1/svg-filters/blob/20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4/cloud.html#L4-L35) | turbulence, component transfer, color matrix를 연결합니다. |
| Hologram | [`holo/holo2.html`](https://github.com/codingapple1/svg-filters/blob/20f03c33e8b5148f7cb7b1326ea6da2ab7ce4fd4/holo/holo2.html#L10-L146) | mask와 gradient를 겹치고 포인터 또는 기울기 센서로 좌표를 이동합니다. |

원본을 그대로 사용하기 어려운 부분도 확인했습니다.

- `turbulence/squiggle-water.html`은 turbulence 결과를 `noise`로 만들고 displacement에서는 존재하지 않는 `noise2`를 읽습니다. 새 예제에서는 이름을 일치시켰습니다.
- 일부 gooey 예제는 `feColorMatrix mode="matrix"`를 사용합니다. 표준 속성은 `type="matrix"`이며 `mode`가 아닙니다.
- 큰 blur와 displacement를 사용하면서 필터 영역을 넓히지 않아 가장자리가 잘릴 수 있습니다.
- 여러 파일이 완전한 HTML 문서가 아닌 fragment라서 단독 실행 시 Quirks Mode가 될 수 있습니다.
- 이미지 예제는 저장소 내부 PNG에 의존합니다. 아래 실습 코드는 모든 그래픽을 인라인 SVG로 다시 만들었습니다.
- 홀로그램은 핵심이 SVG filter가 아니라 gradient, mask, `mix-blend-mode`, 포인터 입력입니다. 개념을 혼동하지 않도록 별도 예제로 분리했습니다.
- 저장소에 라이선스 파일이 없습니다. 아래 코드는 원본 구현을 복사하지 않은 독립 예제입니다.

## 완전 실행 예제

아래 전체 코드를 `svg-filter-lab.html`로 저장하고 Chrome, Edge, Firefox 또는 Safari에서 여십시오. 외부 이미지, 폰트, 라이브러리, 네트워크 요청이 없습니다.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SVG Filter Lab</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #090b12;
      color: #f4f7ff;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-width: 320px;
      background:
        radial-gradient(circle at 15% 0%, #20305b 0, transparent 32rem),
        #090b12;
    }

    header,
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    header {
      padding: 64px 0 32px;
    }

    h1,
    h2,
    p {
      margin-top: 0;
    }

    h1 {
      margin-bottom: 12px;
      font-size: clamp(2rem, 6vw, 4.5rem);
      letter-spacing: -0.05em;
    }

    header p,
    .description {
      color: #b6bfd5;
      line-height: 1.65;
    }

    main {
      display: grid;
      gap: 24px;
      padding-bottom: 72px;
    }

    .demo {
      overflow: hidden;
      border: 1px solid #29314a;
      border-radius: 24px;
      background: rgba(16, 20, 34, 0.92);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
    }

    .demo-copy {
      padding: 28px 28px 16px;
    }

    .demo-copy h2 {
      margin-bottom: 8px;
      font-size: clamp(1.35rem, 3vw, 2rem);
    }

    .preview {
      display: grid;
      min-height: 320px;
      place-items: center;
      padding: 24px;
      background: #0d1020;
    }

    .controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      padding: 20px 28px 28px;
    }

    label {
      display: grid;
      gap: 8px;
      color: #dce3f7;
      font-size: 0.9rem;
    }

    input,
    select,
    button {
      font: inherit;
    }

    input[type="range"] {
      width: 100%;
      accent-color: #79f2ce;
    }

    input[type="color"] {
      width: 100%;
      min-height: 42px;
      border: 1px solid #414b68;
      border-radius: 10px;
      background: #171c2d;
    }

    select,
    button {
      min-height: 42px;
      border: 1px solid #414b68;
      border-radius: 10px;
      background: #171c2d;
      color: #f4f7ff;
    }

    button {
      padding: 0 16px;
      cursor: pointer;
    }

    output {
      color: #79f2ce;
      font-variant-numeric: tabular-nums;
    }

    .filter-definitions {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .gooey-canvas {
      position: relative;
      width: min(100%, 560px);
      height: 260px;
      overflow: hidden;
      border-radius: 20px;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent),
        #090b17;
    }

    .gooey-layer {
      position: absolute;
      inset: 0;
      filter: url(#lab-gooey-filter);
    }

    .gooey-blob {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 104px;
      height: 104px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff4d8d, #ff9d3d);
      box-shadow: inset 18px 18px 32px rgba(255, 255, 255, 0.16);
    }

    .gooey-blob:nth-child(1) {
      transform: translate(calc(-50% - var(--gooey-gap)), -50%);
    }

    .gooey-blob:nth-child(2) {
      transform: translate(calc(-50% + var(--gooey-gap)), -50%);
    }

    .gooey-blob:nth-child(3) {
      width: 72px;
      height: 72px;
      animation: gooey-orbit 4.5s ease-in-out infinite alternate;
    }

    @keyframes gooey-orbit {
      from {
        transform: translate(-180px, -92px);
      }
      to {
        transform: translate(90px, 28px);
      }
    }

    .svg-preview {
      width: min(100%, 620px);
      height: auto;
      overflow: visible;
    }

    .signature-path {
      fill: none;
      stroke: #61f6ca;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: draw-signature 4.8s cubic-bezier(0.45, 0, 0.25, 1) infinite;
    }

    @keyframes draw-signature {
      0%, 8% {
        stroke-dashoffset: 1;
        opacity: 0;
      }
      12% {
        opacity: 1;
      }
      62%, 84% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    .hologram-card {
      width: min(100%, 360px);
      border-radius: 24px;
      transform-style: preserve-3d;
      transition: transform 140ms ease-out;
      will-change: transform;
      touch-action: none;
    }

    .hologram-svg {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 24px;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
    }

    @media (prefers-reduced-motion: reduce) {
      .gooey-blob:nth-child(3),
      .signature-path {
        animation: none;
      }

      .signature-path {
        stroke-dashoffset: 0;
      }

      .hologram-card {
        transition: none;
      }
    }
  </style>
</head>
<body>
  <svg class="filter-definitions" aria-hidden="true" focusable="false">
    <defs>
      <filter
        id="lab-gooey-filter"
        x="-35%"
        y="-60%"
        width="170%"
        height="220%"
        color-interpolation-filters="sRGB"
      >
        <feGaussianBlur
          id="lab-gooey-blur"
          in="SourceGraphic"
          stdDeviation="11"
          result="lab-gooey-blurred"
        />
        <feColorMatrix
          id="lab-gooey-matrix"
          in="lab-gooey-blurred"
          type="matrix"
          values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 20 -9
          "
          result="lab-gooey-alpha"
        />
        <feComposite
          in="SourceGraphic"
          in2="lab-gooey-alpha"
          operator="atop"
        />
      </filter>
    </defs>
  </svg>

  <header>
    <h1>SVG Filter Lab</h1>
    <p>각 입력값을 움직이면서 primitive가 픽셀을 어떻게 바꾸는지 확인해 보십시오.</p>
  </header>

  <main>
    <section class="demo" aria-labelledby="gooey-heading">
      <div class="demo-copy">
        <h2 id="gooey-heading">1. Gooey: blur와 alpha threshold</h2>
        <p class="description">블러로 도형 사이를 연결한 뒤 알파 대비를 높여 경계를 다시 선명하게 만듭니다.</p>
      </div>
      <div class="preview">
        <div class="gooey-canvas">
          <div id="gooey-layer" class="gooey-layer" style="--gooey-gap: 74px">
            <span class="gooey-blob"></span>
            <span class="gooey-blob"></span>
            <span class="gooey-blob"></span>
          </div>
        </div>
      </div>
      <div class="controls">
        <label>
          도형 간격 <output id="gooey-gap-output">74px</output>
          <input id="gooey-gap" type="range" min="30" max="130" value="74">
        </label>
        <label>
          블러 <output id="gooey-blur-output">11</output>
          <input id="gooey-blur" type="range" min="0" max="20" step="0.5" value="11">
        </label>
        <label>
          알파 절편 <output id="gooey-threshold-output">-9</output>
          <input id="gooey-threshold" type="range" min="3" max="15" step="0.5" value="9">
        </label>
      </div>
    </section>

    <section class="demo" aria-labelledby="wobble-heading">
      <div class="demo-copy">
        <h2 id="wobble-heading">2. Wobble: turbulence와 displacement</h2>
        <p class="description">생성한 noise의 R 채널과 G 채널을 각각 X축과 Y축 이동량으로 사용합니다.</p>
      </div>
      <div class="preview">
        <svg class="svg-preview" viewBox="0 0 640 300" role="img" aria-labelledby="wobble-title wobble-description">
          <title id="wobble-title">Noise displacement demo</title>
          <desc id="wobble-description">색상 카드와 글자가 유기적으로 흔들립니다.</desc>
          <defs>
            <linearGradient id="lab-wobble-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#6e5cff" />
              <stop offset="0.55" stop-color="#36d4ff" />
              <stop offset="1" stop-color="#6effb5" />
            </linearGradient>
            <filter
              id="lab-wobble-filter"
              x="-20%"
              y="-35%"
              width="140%"
              height="170%"
              color-interpolation-filters="sRGB"
            >
              <feTurbulence
                id="lab-wobble-noise"
                type="fractalNoise"
                baseFrequency="0.018 0.032"
                numOctaves="2"
                seed="2"
                result="lab-wobble-noise-result"
              />
              <feDisplacementMap
                id="lab-wobble-displacement"
                in="SourceGraphic"
                in2="lab-wobble-noise-result"
                scale="18"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <rect x="46" y="46" width="548" height="208" rx="48" fill="url(#lab-wobble-gradient)" filter="url(#lab-wobble-filter)" />
          <text
            x="320"
            y="177"
            text-anchor="middle"
            fill="#07111f"
            font-size="68"
            font-weight="850"
            letter-spacing="-3"
            filter="url(#lab-wobble-filter)"
          >WOBBLE</text>
        </svg>
      </div>
      <div class="controls">
        <label>
          Noise 주파수 <output id="wobble-frequency-output">0.018</output>
          <input id="wobble-frequency" type="range" min="0.004" max="0.08" step="0.002" value="0.018">
        </label>
        <label>
          이동 크기 <output id="wobble-scale-output">18</output>
          <input id="wobble-scale" type="range" min="0" max="48" value="18">
        </label>
        <button id="wobble-toggle" type="button" aria-pressed="true">애니메이션 정지</button>
      </div>
    </section>

    <section class="demo" aria-labelledby="signature-heading">
      <div class="demo-copy">
        <h2 id="signature-heading">3. Handwriting: pathLength와 displacement</h2>
        <p class="description">필기 동작은 stroke dash가 만들고 필터는 선의 가장자리에 미세한 불규칙성을 더합니다.</p>
      </div>
      <div class="preview">
        <svg class="svg-preview" viewBox="0 0 700 260" role="img" aria-labelledby="signature-title signature-description">
          <title id="signature-title">Animated handwritten line</title>
          <desc id="signature-description">청록색 선이 왼쪽부터 서명처럼 그려집니다.</desc>
          <defs>
            <filter
              id="lab-signature-filter"
              x="-12%"
              y="-30%"
              width="124%"
              height="160%"
              color-interpolation-filters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.022 0.08"
                numOctaves="2"
                seed="8"
                result="lab-signature-noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="lab-signature-noise"
                scale="1.8"
                xChannelSelector="R"
                yChannelSelector="G"
                result="lab-signature-distorted"
              />
              <feGaussianBlur
                in="lab-signature-distorted"
                stdDeviation="0.28"
                result="lab-signature-soft"
              />
              <feMerge>
                <feMergeNode in="lab-signature-soft" />
                <feMergeNode in="lab-signature-distorted" />
              </feMerge>
            </filter>
          </defs>
          <rect x="20" y="20" width="660" height="220" rx="24" fill="#071612" />
          <path
            id="signature-path"
            class="signature-path"
            pathLength="1"
            filter="url(#lab-signature-filter)"
            d="M 74 156 C 92 60 132 54 142 112 C 150 166 105 193 126 116 C 145 53 178 68 178 128 C 178 174 202 176 219 121 C 235 68 261 66 257 130 C 254 180 287 175 304 118 C 321 62 347 72 338 140 C 332 187 369 169 388 113 C 405 62 433 76 423 137 C 414 189 456 172 477 114 C 496 62 520 80 515 139 C 511 180 550 178 581 120 C 602 80 622 83 635 110"
          />
        </svg>
      </div>
      <div class="controls">
        <button id="signature-replay" type="button">필기 다시 재생</button>
      </div>
    </section>

    <section class="demo" aria-labelledby="neon-heading">
      <div class="demo-copy">
        <h2 id="neon-heading">4. Neon: flood, composite, merge</h2>
        <p class="description">원본 알파를 넓게 블러하고 단색 flood를 잘라낸 뒤 원본과 순서대로 쌓습니다.</p>
      </div>
      <div class="preview">
        <svg class="svg-preview" viewBox="0 0 700 280" role="img" aria-labelledby="neon-title neon-description">
          <title id="neon-title">Layered neon glow</title>
          <desc id="neon-description">보라색 발광이 여러 겹으로 번지는 SVG FILTER 글자입니다.</desc>
          <defs>
            <filter
              id="lab-neon-filter"
              x="-45%"
              y="-100%"
              width="190%"
              height="300%"
              color-interpolation-filters="sRGB"
            >
              <feGaussianBlur id="lab-neon-wide-blur" in="SourceGraphic" stdDeviation="13" result="lab-neon-wide-alpha" />
              <feFlood id="lab-neon-wide-color" flood-color="#8c5cff" flood-opacity="0.85" result="lab-neon-wide-paint" />
              <feComposite in="lab-neon-wide-paint" in2="lab-neon-wide-alpha" operator="in" result="lab-neon-wide-glow" />
              <feGaussianBlur id="lab-neon-near-blur" in="SourceGraphic" stdDeviation="4" result="lab-neon-near-alpha" />
              <feFlood id="lab-neon-near-color" flood-color="#d8c7ff" result="lab-neon-near-paint" />
              <feComposite in="lab-neon-near-paint" in2="lab-neon-near-alpha" operator="in" result="lab-neon-near-glow" />
              <feMerge>
                <feMergeNode in="lab-neon-wide-glow" />
                <feMergeNode in="lab-neon-near-glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="16" y="16" width="668" height="248" rx="30" fill="#05020c" stroke="#271841" />
          <text
            id="neon-text"
            x="350"
            y="165"
            text-anchor="middle"
            fill="#ffffff"
            stroke="#cbb8ff"
            stroke-width="2"
            font-size="72"
            font-weight="800"
            letter-spacing="4"
            filter="url(#lab-neon-filter)"
          >SVG FILTER</text>
        </svg>
      </div>
      <div class="controls">
        <label>
          발광 색상
          <input id="neon-color" type="color" value="#8c5cff">
        </label>
        <label>
          넓은 발광 <output id="neon-spread-output">13</output>
          <input id="neon-spread" type="range" min="2" max="24" step="0.5" value="13">
        </label>
      </div>
    </section>

    <section class="demo" aria-labelledby="duotone-heading">
      <div class="demo-copy">
        <h2 id="duotone-heading">5. Duotone: luminance와 component transfer</h2>
        <p class="description">먼저 RGB를 밝기값으로 통일하고 각 채널을 어두운 색과 밝은 색 사이로 다시 매핑합니다.</p>
      </div>
      <div class="preview">
        <svg class="svg-preview" viewBox="0 0 700 360" role="img" aria-labelledby="duotone-title duotone-description">
          <title id="duotone-title">Duotone landscape</title>
          <desc id="duotone-description">산과 태양으로 구성된 풍경이 두 색상 팔레트로 변환됩니다.</desc>
          <defs>
            <linearGradient id="lab-landscape-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#e9f5ff" />
              <stop offset="1" stop-color="#405a79" />
            </linearGradient>
            <filter id="lab-duotone-filter" color-interpolation-filters="sRGB">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="
                  0.2126 0.7152 0.0722 0 0
                  0.2126 0.7152 0.0722 0 0
                  0.2126 0.7152 0.0722 0 0
                  0      0      0      1 0
                "
                result="lab-duotone-luminance"
              />
              <feComponentTransfer in="lab-duotone-luminance">
                <feFuncR id="lab-duotone-red" type="table" tableValues="0.05 1" />
                <feFuncG id="lab-duotone-green" type="table" tableValues="0.02 0.75" />
                <feFuncB id="lab-duotone-blue" type="table" tableValues="0.18 0.35" />
              </feComponentTransfer>
            </filter>
          </defs>
          <g filter="url(#lab-duotone-filter)">
            <rect x="20" y="20" width="660" height="320" rx="28" fill="url(#lab-landscape-sky)" />
            <circle cx="535" cy="100" r="54" fill="#ffffff" />
            <path d="M 20 300 L 170 134 L 285 250 L 400 92 L 680 300 Z" fill="#263b55" />
            <path d="M 20 300 L 220 192 L 330 278 L 470 177 L 680 300 Z" fill="#6f8497" />
            <path d="M 20 300 C 150 260 245 340 365 292 C 470 250 555 315 680 275 L 680 340 L 20 340 Z" fill="#101923" />
          </g>
        </svg>
      </div>
      <div class="controls">
        <label>
          팔레트
          <select id="duotone-palette">
            <option value="violet">Violet sunset</option>
            <option value="ocean">Deep ocean</option>
            <option value="forest">Forest mint</option>
            <option value="mono">Warm mono</option>
          </select>
        </label>
      </div>
    </section>

    <section class="demo" aria-labelledby="hologram-heading">
      <div class="demo-copy">
        <h2 id="hologram-heading">6. Bonus: filter가 아닌 hologram</h2>
        <p class="description">포인터 위치를 카드 회전과 gradient 이동에 함께 사용합니다. 빛 영역은 mask로 제한하고 screen blend로 합성합니다.</p>
      </div>
      <div class="preview">
        <div id="hologram-card" class="hologram-card">
          <svg class="hologram-svg" viewBox="0 0 360 500" role="img" aria-labelledby="hologram-title hologram-description">
            <title id="hologram-title">Interactive hologram card</title>
            <desc id="hologram-description">포인터를 움직이면 카드와 무지개 빛이 함께 움직입니다.</desc>
            <defs>
              <linearGradient id="lab-card-background" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#182b50" />
                <stop offset="0.55" stop-color="#513768" />
                <stop offset="1" stop-color="#102638" />
              </linearGradient>
              <linearGradient id="lab-hologram-gradient" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(42 .5 .5)">
                <stop offset="0" stop-color="#ff4f9a" />
                <stop offset="0.2" stop-color="#ffde59" />
                <stop offset="0.4" stop-color="#5dffbd" />
                <stop offset="0.6" stop-color="#55b8ff" />
                <stop offset="0.8" stop-color="#a76cff" />
                <stop offset="1" stop-color="#ff4f9a" />
              </linearGradient>
              <mask id="lab-hologram-mask">
                <rect width="360" height="500" fill="black" />
                <circle cx="180" cy="205" r="125" fill="white" />
                <path d="M 46 408 Q 180 336 314 408 L 314 454 L 46 454 Z" fill="white" />
                <g fill="white" opacity="0.65">
                  <circle cx="83" cy="90" r="9" />
                  <circle cx="288" cy="121" r="14" />
                  <circle cx="65" cy="333" r="7" />
                  <circle cx="299" cy="327" r="10" />
                </g>
              </mask>
            </defs>
            <rect width="360" height="500" rx="28" fill="url(#lab-card-background)" />
            <rect x="15" y="15" width="330" height="470" rx="20" fill="none" stroke="#dce8ff" stroke-opacity="0.45" />
            <circle cx="180" cy="205" r="118" fill="#0d1427" stroke="#90b5d5" stroke-width="2" />
            <path d="M 112 242 C 125 145 158 119 180 168 C 202 119 235 145 248 242 C 218 276 142 276 112 242 Z" fill="#e6f2ff" />
            <circle cx="151" cy="201" r="10" fill="#172038" />
            <circle cx="209" cy="201" r="10" fill="#172038" />
            <path d="M 156 230 Q 180 246 204 230" fill="none" stroke="#172038" stroke-width="7" stroke-linecap="round" />
            <text x="180" y="398" text-anchor="middle" fill="#ffffff" font-size="31" font-weight="800" letter-spacing="4">SPECTRUM</text>
            <text x="180" y="432" text-anchor="middle" fill="#b7c9e7" font-size="14" letter-spacing="3">INTERACTIVE CARD</text>
            <rect
              width="360"
              height="500"
              rx="28"
              fill="url(#lab-hologram-gradient)"
              mask="url(#lab-hologram-mask)"
              opacity="0.72"
              style="mix-blend-mode: screen"
            />
          </svg>
        </div>
      </div>
    </section>
  </main>

  <script>
    const gooeyLayer = document.getElementById("gooey-layer");
    const gooeyGapInput = document.getElementById("gooey-gap");
    const gooeyBlurInput = document.getElementById("gooey-blur");
    const gooeyThresholdInput = document.getElementById("gooey-threshold");
    const gooeyGapOutput = document.getElementById("gooey-gap-output");
    const gooeyBlurOutput = document.getElementById("gooey-blur-output");
    const gooeyThresholdOutput = document.getElementById("gooey-threshold-output");
    const gooeyBlurPrimitive = document.getElementById("lab-gooey-blur");
    const gooeyMatrixPrimitive = document.getElementById("lab-gooey-matrix");

    function updateGooeyDemo() {
      const gapPixels = Number(gooeyGapInput.value);
      const blurDeviation = Number(gooeyBlurInput.value);
      const alphaIntercept = Number(gooeyThresholdInput.value);
      const matrixValues = `
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 20 ${-alphaIntercept}
      `;

      gooeyLayer.style.setProperty("--gooey-gap", `${gapPixels}px`);
      gooeyBlurPrimitive.setAttribute("stdDeviation", String(blurDeviation));
      gooeyMatrixPrimitive.setAttribute("values", matrixValues);
      gooeyGapOutput.value = `${gapPixels}px`;
      gooeyBlurOutput.value = String(blurDeviation);
      gooeyThresholdOutput.value = String(-alphaIntercept);
    }

    for (const inputElement of [gooeyGapInput, gooeyBlurInput, gooeyThresholdInput]) {
      inputElement.addEventListener("input", updateGooeyDemo);
    }

    updateGooeyDemo();

    const wobbleFrequencyInput = document.getElementById("wobble-frequency");
    const wobbleScaleInput = document.getElementById("wobble-scale");
    const wobbleFrequencyOutput = document.getElementById("wobble-frequency-output");
    const wobbleScaleOutput = document.getElementById("wobble-scale-output");
    const wobbleToggleButton = document.getElementById("wobble-toggle");
    const wobbleNoisePrimitive = document.getElementById("lab-wobble-noise");
    const wobbleDisplacementPrimitive = document.getElementById("lab-wobble-displacement");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let wobbleAnimationEnabled = !reducedMotionQuery.matches;
    let previousSeedFrame = -1;

    function updateWobbleParameters() {
      const baseFrequency = Number(wobbleFrequencyInput.value);
      const verticalFrequency = baseFrequency * 1.8;
      const displacementScale = Number(wobbleScaleInput.value);

      wobbleNoisePrimitive.setAttribute("baseFrequency", `${baseFrequency} ${verticalFrequency}`);
      wobbleDisplacementPrimitive.setAttribute("scale", String(displacementScale));
      wobbleFrequencyOutput.value = baseFrequency.toFixed(3);
      wobbleScaleOutput.value = String(displacementScale);
    }

    function syncWobbleButton() {
      wobbleToggleButton.setAttribute("aria-pressed", String(wobbleAnimationEnabled));
      wobbleToggleButton.textContent = wobbleAnimationEnabled ? "애니메이션 정지" : "애니메이션 재생";
    }

    function animateWobble(timestamp) {
      if (wobbleAnimationEnabled && !document.hidden) {
        const seedFrame = Math.floor(timestamp / 120);
        if (seedFrame !== previousSeedFrame) {
          const nextSeed = 1 + seedFrame % 11;
          wobbleNoisePrimitive.setAttribute("seed", String(nextSeed));
          previousSeedFrame = seedFrame;
        }
      }
      requestAnimationFrame(animateWobble);
    }

    wobbleFrequencyInput.addEventListener("input", updateWobbleParameters);
    wobbleScaleInput.addEventListener("input", updateWobbleParameters);
    wobbleToggleButton.addEventListener("click", () => {
      wobbleAnimationEnabled = !wobbleAnimationEnabled;
      syncWobbleButton();
    });
    reducedMotionQuery.addEventListener("change", motionEvent => {
      wobbleAnimationEnabled = !motionEvent.matches;
      syncWobbleButton();
    });

    updateWobbleParameters();
    syncWobbleButton();
    requestAnimationFrame(animateWobble);

    const signaturePath = document.getElementById("signature-path");
    const signatureReplayButton = document.getElementById("signature-replay");

    signatureReplayButton.addEventListener("click", () => {
      for (const signatureAnimation of signaturePath.getAnimations()) {
        signatureAnimation.cancel();
        signatureAnimation.play();
      }
    });

    const neonColorInput = document.getElementById("neon-color");
    const neonSpreadInput = document.getElementById("neon-spread");
    const neonSpreadOutput = document.getElementById("neon-spread-output");
    const neonWideBlur = document.getElementById("lab-neon-wide-blur");
    const neonNearBlur = document.getElementById("lab-neon-near-blur");
    const neonWideColor = document.getElementById("lab-neon-wide-color");
    const neonNearColor = document.getElementById("lab-neon-near-color");
    const neonText = document.getElementById("neon-text");

    function mixHexWithWhite(hexColor, whiteRatio) {
      const normalizedHex = hexColor.replace("#", "");
      const redChannel = Number.parseInt(normalizedHex.slice(0, 2), 16);
      const greenChannel = Number.parseInt(normalizedHex.slice(2, 4), 16);
      const blueChannel = Number.parseInt(normalizedHex.slice(4, 6), 16);
      const mixChannel = channel => Math.round(channel + (255 - channel) * whiteRatio);
      const toHex = channel => mixChannel(channel).toString(16).padStart(2, "0");
      return `#${toHex(redChannel)}${toHex(greenChannel)}${toHex(blueChannel)}`;
    }

    function updateNeonDemo() {
      const glowColor = neonColorInput.value;
      const nearGlowColor = mixHexWithWhite(glowColor, 0.62);
      const spread = Number(neonSpreadInput.value);

      neonWideColor.setAttribute("flood-color", glowColor);
      neonNearColor.setAttribute("flood-color", nearGlowColor);
      neonWideBlur.setAttribute("stdDeviation", String(spread));
      neonNearBlur.setAttribute("stdDeviation", String(Math.max(1, spread * 0.32)));
      neonText.setAttribute("stroke", nearGlowColor);
      neonSpreadOutput.value = String(spread);
    }

    neonColorInput.addEventListener("input", updateNeonDemo);
    neonSpreadInput.addEventListener("input", updateNeonDemo);
    updateNeonDemo();

    const duotonePalettes = {
      violet: {
        dark: [0.05, 0.02, 0.18],
        light: [1, 0.75, 0.35]
      },
      ocean: {
        dark: [0.01, 0.07, 0.16],
        light: [0.35, 0.95, 0.9]
      },
      forest: {
        dark: [0.02, 0.12, 0.08],
        light: [0.72, 1, 0.64]
      },
      mono: {
        dark: [0.12, 0.07, 0.04],
        light: [1, 0.88, 0.68]
      }
    };

    const duotonePaletteSelect = document.getElementById("duotone-palette");
    const duotoneRedFunction = document.getElementById("lab-duotone-red");
    const duotoneGreenFunction = document.getElementById("lab-duotone-green");
    const duotoneBlueFunction = document.getElementById("lab-duotone-blue");

    function updateDuotonePalette() {
      const selectedPalette = duotonePalettes[duotonePaletteSelect.value];
      const channelFunctions = [duotoneRedFunction, duotoneGreenFunction, duotoneBlueFunction];

      channelFunctions.forEach((channelFunction, channelIndex) => {
        const darkValue = selectedPalette.dark[channelIndex];
        const lightValue = selectedPalette.light[channelIndex];
        channelFunction.setAttribute("tableValues", `${darkValue} ${lightValue}`);
      });
    }

    duotonePaletteSelect.addEventListener("change", updateDuotonePalette);
    updateDuotonePalette();

    const hologramCard = document.getElementById("hologram-card");
    const hologramGradient = document.getElementById("lab-hologram-gradient");

    function resetHologramCard() {
      hologramCard.style.transform = "rotateX(0deg) rotateY(0deg)";
      hologramGradient.setAttribute("gradientTransform", "rotate(42 .5 .5)");
    }

    hologramCard.addEventListener("pointermove", pointerEvent => {
      const cardBounds = hologramCard.getBoundingClientRect();
      const normalizedX = ((pointerEvent.clientX - cardBounds.left) / cardBounds.width) * 2 - 1;
      const normalizedY = ((pointerEvent.clientY - cardBounds.top) / cardBounds.height) * 2 - 1;
      const rotateX = normalizedY * -12;
      const rotateY = normalizedX * 12;
      const gradientAngle = 42 + normalizedX * 38;
      const gradientOffsetX = normalizedX * 0.18;
      const gradientOffsetY = normalizedY * 0.18;

      hologramCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      hologramGradient.setAttribute(
        "gradientTransform",
        `rotate(${gradientAngle} .5 .5) translate(${gradientOffsetX} ${gradientOffsetY})`
      );
    });

    hologramCard.addEventListener("pointerleave", resetHologramCard);
    resetHologramCard();
  </script>
</body>
</html>
```

## 각 예제에서 배울 점

### 1. Gooey

`feGaussianBlur`만 켜면 도형은 단순히 흐려집니다. 이어지는 `feColorMatrix`의 알파 행이 흐린 영역을 임계값 기준으로 잘라냅니다. 마지막 `feComposite`는 원본 색상을 gooey 알파 영역에 다시 올려 블러 때문에 탁해진 색을 복원합니다.

조절 순서는 다음이 이해하기 쉽습니다.

1. 블러를 0으로 내려 원본 도형을 봅니다.
2. 블러를 8에서 14 사이로 높여 도형 사이가 연결되는지 봅니다.
3. 알파 절편을 움직여 연결부가 유지되는 범위를 찾습니다.
4. 도형 간격을 늘려 블러 반경과 연결 가능 거리의 관계를 확인합니다.

### 2. Wobble

`feTurbulence`는 화면에 바로 표시하기 위한 효과라기보다 다른 primitive가 읽을 데이터 맵으로 많이 사용합니다. 이 예제는 noise의 R 채널을 X축, G 채널을 Y축 이동량으로 사용합니다.

- `baseFrequency`가 작으면 큰 덩어리로 천천히 휘어집니다.
- `baseFrequency`가 크면 짧고 거친 주름이 많아집니다.
- `numOctaves`를 높이면 세부 noise가 늘지만 렌더링 비용도 커집니다.
- `scale`은 실제 픽셀 이동 폭을 결정합니다.
- `seed`를 일정 간격으로 바꾸면 손그림 프레임이 떨리는 듯한 애니메이션이 됩니다.

### 3. Handwriting

필기 애니메이션 자체는 필터가 아닙니다. `stroke-dasharray`와 `stroke-dashoffset`이 선을 숨겼다가 드러냅니다. `pathLength="1"`을 사용하면 실제 경로 길이를 계산하지 않고 0부터 1까지의 비율로 제어할 수 있습니다.

필터는 그 위에 작은 displacement와 blur를 더해 완전히 매끈한 벡터 선을 조금 불규칙하게 만듭니다. 강도를 지나치게 높이면 필기감보다 흔들리는 젤리처럼 보이므로 `scale`을 1에서 2 정도로 작게 유지했습니다.

### 4. Neon

네온은 중간 결과를 이름 붙여 재사용하는 이유가 잘 드러나는 예제입니다.

1. 큰 blur로 넓은 빛 알파를 만듭니다.
2. `feFlood`로 발광 색상 이미지를 만듭니다.
3. `feComposite operator="in"`으로 색상을 blur 알파 모양만큼 잘라냅니다.
4. 같은 과정을 작은 blur로 한 번 더 수행합니다.
5. `feMerge`로 넓은 빛, 가까운 빛, 원본 글자를 순서대로 쌓습니다.

### 5. Duotone

첫 `feColorMatrix`는 RGB 각 채널에 같은 luma 근삿값을 출력합니다. `color-interpolation-filters="sRGB"`에서 Rec.709 계열 가중치인 `0.2126`, `0.7152`, `0.0722`를 적용한 값이며, 선형화된 RGB로 계산하는 엄밀한 sRGB 상대 휘도와는 다릅니다.

그다음 `feComponentTransfer`의 채널별 `tableValues`가 밝기 0을 어두운 색으로, 밝기 1을 밝은 색으로 매핑합니다. 중간 밝기는 두 값 사이를 보간합니다. 따라서 이미지 파일을 직접 편집하지 않고 팔레트만 바꿀 수 있습니다.

### 6. Hologram

이 예제에는 `<filter>`가 없습니다. 다음 기술을 조합합니다.

- `linearGradient`로 무지개 빛을 만듭니다.
- `mask`로 빛이 보일 영역을 제한합니다.
- `mix-blend-mode: screen`으로 원본 그래픽 위에 빛을 합성합니다.
- 포인터 좌표를 -1부터 1까지 정규화해 카드 회전과 gradient 위치에 같이 사용합니다.

SVG로 만든 시각 효과라고 해서 모두 SVG filter인 것은 아닙니다. 필터는 픽셀 처리 파이프라인이고, mask는 가시 영역 제어, gradient는 페인트, blend mode는 레이어 합성입니다.

## 실무에서 자주 생기는 문제

### 필터 가장자리가 잘립니다

Blur와 displacement는 원본 바깥쪽 픽셀까지 사용합니다. `<filter>`의 `x`, `y`, `width`, `height`로 필터 영역을 충분히 넓혀야 합니다.

```html
<filter id="safe-glow" x="-40%" y="-80%" width="180%" height="260%">
  <feGaussianBlur stdDeviation="16" />
</filter>
```

영역을 무조건 크게 잡으면 처리할 픽셀 수도 늘어납니다. 효과가 잘리지 않는 최소 범위를 찾는 편이 좋습니다.

### 여러 컴포넌트의 ID가 충돌합니다

`filter: url(#id)`의 ID는 문서 전역에서 찾습니다. 동일한 컴포넌트를 여러 번 렌더링할 때 고정 ID를 쓰면 다른 인스턴스의 필터를 참조할 수 있습니다. 프레임워크에서는 컴포넌트 인스턴스마다 안정적인 고유 ID를 만들고 `filter` 참조와 함께 전달하십시오.

### 색상이 예상과 다릅니다

필터 primitive의 기본 색 공간은 일반적인 UI 색상 계산과 다르게 보일 수 있습니다. 색상 임계값이나 합성 결과를 예측하기 쉽게 만들려면 필요한 필터에 `color-interpolation-filters="sRGB"`를 명시하십시오. 정확한 렌더링 요구가 있다면 sRGB와 linearRGB를 모두 비교해야 합니다.

### HTML 요소에서 브라우저 차이가 납니다

인라인 SVG에 필터를 정의하고 CSS `filter: url(#id)`로 HTML 요소에 적용하는 방식은 편리하지만 브라우저별 clipping과 합성 차이가 있을 수 있습니다. 핵심 UI라면 다음을 확인하십시오.

- Chrome, Edge, Firefox, Safari에서 실제 렌더링 비교
- 필터를 지원하지 않을 때도 내용과 조작이 가능한 fallback
- SVG 정의를 `display: none`으로 숨기지 않고 크기 0의 비가시 SVG로 유지
- 외부 SVG 파일의 fragment ID 대신 같은 문서의 inline definition 사용

### 애니메이션이 무겁습니다

SVG 필터는 벡터 명령만 유지하는 것이 아니라 중간 픽셀 버퍼를 처리합니다. 큰 화면 전체에 blur, 여러 octave의 turbulence, 큰 displacement를 매 프레임 적용하면 비용이 큽니다.

- 애니메이션 영역을 작게 제한합니다.
- `numOctaves`를 먼저 낮춥니다.
- seed를 모든 프레임이 아니라 100ms 안팎 간격으로 갱신해도 손그림 느낌은 유지됩니다.
- 탭이 보이지 않을 때 갱신하지 않습니다.
- `prefers-reduced-motion`을 존중합니다.
- 목록에 같은 필터 인스턴스를 수십 개 만들지 않습니다.

### 신뢰하지 않는 frame과 SVG를 함께 사용합니다

영상 후반부가 소개한 보안 연구의 핵심은 SVG filter 자체가 곧 취약하다는 뜻이 아닙니다. 브라우저가 cross-origin iframe의 렌더링 결과에도 filter를 적용하도록 허용했던 경계가 문제였습니다.

[SVG clickjacking 원 연구](https://lyra.horse/blog/2025/12/svg-clickjacking/)는 `feTile`로 특정 픽셀 영역을 반복하고 `feBlend`, `feComposite`, `feColorMatrix`로 상태를 판별하는 시각적 논리 회로를 구성했습니다. 필터 계산 결과를 JavaScript로 직접 읽은 것이 아니라, 상태에 따라 다른 가짜 UI를 화면에 합성하는 방식입니다.

[Chrome 150 beta 안내](https://developer.chrome.com/blog/chrome-150-beta)는 cross-origin 또는 sandbox 등으로 제한된 iframe과 PDF 같은 플러그인에 SVG filter를 적용하지 않도록 변경했다고 설명합니다. 실무에서는 브라우저 완화만 믿지 말고 다음 원칙도 지켜야 합니다.

- 신뢰하지 않는 SVG를 일반 이미지가 아니라 능동 콘텐츠로 취급합니다.
- 외부 입력 SVG를 그대로 DOM에 삽입하지 않습니다.
- 민감한 화면은 `frame-ancestors` CSP 또는 `X-Frame-Options`로 framing을 제한합니다.
- 외부 `<feImage>`와 data URL을 허용해야 한다면 별도 sanitization 정책을 둡니다.

## 적용 체크리스트

- 모든 `in`과 `in2`가 실제 `result` 이름 또는 표준 입력을 가리키는지 확인했습니다.
- `feColorMatrix`에 비표준 `mode`가 아니라 `type`을 사용했습니다.
- blur와 displacement가 잘리지 않도록 필터 영역을 명시했습니다.
- 한 페이지 안에서 ID가 중복되지 않도록 예제별 접두사를 사용했습니다.
- 외부 이미지, 폰트, CDN, 네트워크 요청을 제거했습니다.
- 제어 요소에 label과 output을 연결하고 SVG에 title과 desc를 넣었습니다.
- 애니메이션에 reduced-motion과 탭 비활성화 대응을 넣었습니다.
- 필터 효과와 mask, gradient, blend의 책임을 구분했습니다.

## 출처

- [코딩애플 YouTube 영상](https://youtu.be/RrYPBkmnUwc)
- [codingapple1/svg-filters 저장소](https://github.com/codingapple1/svg-filters)
- [W3C Filter Effects Module Level 1](https://www.w3.org/TR/filter-effects-1/)
- [MDN SVG filters guide](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_filters)
- [MDN filter element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter)
- [MDN feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap)
- [SVG clickjacking 원 연구](https://lyra.horse/blog/2025/12/svg-clickjacking/)
- [Chrome 150 beta: cross-origin iframe SVG filter 제한](https://developer.chrome.com/blog/chrome-150-beta)
