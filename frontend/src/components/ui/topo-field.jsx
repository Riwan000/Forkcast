import { useEffect, useMemo, useRef, useState } from "react";

const topoFieldSource = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TopoField Background</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent;
      }
      #topo-canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>
</head>
<body>
    <div id="topo-container" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;">
        <canvas id="topo-canvas"></canvas>
    </div>

    <script>
        const canvas = document.getElementById('topo-canvas');
        const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false });

        if (gl) {
            const vsSource = \`
                attribute vec2 a_position;
                void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
            \`;

            const fsSource = \`
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform float u_dpr;
                uniform float u_food_mode;

                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m; m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    vec2 st = gl_FragCoord.xy / u_resolution.xy;
                    float aspect = u_resolution.x / u_resolution.y;
                    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

                    // Ambient Simplex Terrain Noise
                    float noiseScale = 1.35;
                    vec2 noisePos = st * vec2(aspect, 1.0) * noiseScale + vec2(u_time * 0.01, u_time * 0.016);
                    float n = snoise(noisePos) * 0.5 + 0.5;

                    // Light Food Topography (Gourmet Burger Contour Silhouette)
                    float foodElevation = 0.0;
                    if (u_food_mode > 0.5) {
                        vec2 bp = p;
                        bp.y += 0.03;
                        bp.y -= sin(u_time * 0.7) * 0.01;

                        // 1. Top Bun Dome (smooth rounded crown of the burger)
                        float topBunDist = length(vec2(bp.x * 1.15, max(0.0, bp.y - 0.02) * 1.75));
                        float topBun = smoothstep(0.38, 0.02, topBunDist);

                        // 2. Patty & Wavy Filling Layer (lettuce & melted cheese contours)
                        float ripple = sin(bp.x * 22.0 + u_time * 0.8) * 0.012;
                        float pattyLayer = smoothstep(0.40, 0.06, length(vec2(bp.x * 1.12, (bp.y - 0.01 + ripple) * 4.6)));

                        // 3. Bottom Bun (rounded base foundation)
                        float bottomBunDist = length(vec2(bp.x * 1.25, max(0.0, -bp.y - 0.07) * 2.2));
                        float bottomBun = smoothstep(0.36, 0.03, bottomBunDist);

                        // 4. Subtle savory aroma curls rising above
                        float s1 = exp(-pow(bp.x - sin(bp.y * 7.5 - u_time * 1.1) * 0.04, 2.0) * 450.0);
                        float s2 = exp(-pow(bp.x - 0.12 - sin(bp.y * 6.5 - u_time * 1.3 + 1.2) * 0.035, 2.0) * 400.0);
                        float steamMask = smoothstep(0.18, 0.28, bp.y) * smoothstep(0.55, 0.30, bp.y);
                        float aroma = (s1 + s2) * steamMask * 0.4;

                        foodElevation = (topBun * 0.72 + pattyLayer * 0.58 + bottomBun * 0.65 + aroma);
                    }

                    // Combined Heightfield
                    float totalHeight = (u_food_mode > 0.5) 
                        ? (foodElevation * 0.72 + n * 0.28) 
                        : n;

                    // Ultra-thin Topographic Contour Lines
                    float numBands = 12.0;
                    float bandVal = totalHeight * numBands;
                    float triangleWave = abs(fract(bandVal) - 0.5) * 2.0; 
                    
                    // Fine, light, airy contour line profile ("lightly")
                    float topoLines = smoothstep(0.026, 0.006, triangleWave) * 0.65;

                    vec3 whiteColor = vec3(1.0, 1.0, 1.0);
                    float totalAlpha = clamp(topoLines, 0.0, 1.0);

                    gl_FragColor = vec4(whiteColor, totalAlpha);
                }
            \`;

            function createShader(gl, type, source) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                return shader;
            }

            const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, "a_position");
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
            const timeLocation = gl.getUniformLocation(program, "u_time");
            const dprLocation = gl.getUniformLocation(program, "u_dpr");
            const foodModeLocation = gl.getUniformLocation(program, "u_food_mode");

            function resizeCanvas() {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = window.innerWidth * dpr;
                canvas.height = window.innerHeight * dpr;
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
                gl.uniform1f(dprLocation, dpr);
                gl.uniform1f(foodModeLocation, 1.0);
            }

            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            let startTime = performance.now();
            function render(time) {
                gl.uniform1f(timeLocation, (time - startTime) * 0.001);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);
        }
    </script>
</body>
</html>`;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function glslFloat(value, digits = 3) {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
}

function patchTopoField(source, { length, density, foodShape }) {
  let next = source
    .replace(
      "float noiseScale = 1.4;",
      `float noiseScale = ${glslFloat(1.4 * length, 3)};`,
    )
    .replace(
      "float numBands = 11.0;",
      `float numBands = ${glslFloat(11.0 * density, 2)};`,
    )
    .replace(
      "gl.uniform1f(foodModeLocation, 1.0);",
      `gl.uniform1f(foodModeLocation, ${foodShape ? "1.0" : "0.0"});`,
    );
  return next;
}

function buildFocusedDocument(knobs) {
  const bg = knobs.background || (knobs.mode === "light" ? "#eef1f6" : "#430000");
  const patched = patchTopoField(topoFieldSource, knobs);

  const focusStyle = `<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${bg} !important; }
body { position: relative !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
</style>`;

  const controlScript = `<script data-threeui-controls>
(function () {
  var controls = { speed: 1, opacity: 1 };
  window.__SF_CONTROLS = controls;
  var origin = performance.now();
  var virtual = 0;
  var last = origin;
  var performanceNow = performance.now.bind(performance);
  performance.now = function () {
    var real = performanceNow();
    virtual += (real - last) * (controls.speed || 1);
    last = real;
    return origin + virtual;
  };
  function applyVisual() {
    var opacity = controls.opacity == null ? 1 : controls.opacity;
    Array.prototype.forEach.call(document.querySelectorAll('[data-threeui-role], canvas'), function (element) {
      element.style.opacity = String(opacity);
    });
  }
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'threeui-controls') return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
    applyVisual();
  });
  window.__SF_APPLY_CONTROLS = applyVisual;
})();
</script>`;

  return patched
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}${focusStyle}`)
    .replace(/<\/body>/i, `</body>`);
}

export default function TopoField({
  mode = "dark",
  speed = 1,
  length = 1,
  density = 1,
  opacity = 0.85,
  foodShape = true,
  background = "#430000",
  blur = 1.2,
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
  style,
}) {
  const iframeRef = useRef(null);

  const safeSpeed = clamp(speed, 0, 3);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);

  const resolvedBg = background || (mode === "light" ? "#eef1f6" : "#430000");

  const source = useMemo(
    () =>
      buildFocusedDocument({
        mode,
        length: safeLength,
        density: safeDensity,
        foodShape,
        background: resolvedBg,
      }),
    [mode, safeLength, safeDensity, foodShape, resolvedBg],
  );

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "threeui-controls",
        controls: { speed: safeSpeed, opacity: safeOpacity },
      },
      "*",
    );
  }, [safeSpeed, safeOpacity, source]);

  const colorFilter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;
  const blurFilter = blur ? `blur(${typeof blur === "number" ? `${blur}px` : blur})` : undefined;
  const combinedFilter = [colorFilter, blurFilter].filter(Boolean).join(" ") || undefined;

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title="Food Topo Field"
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background: resolvedBg,
        filter: combinedFilter,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
