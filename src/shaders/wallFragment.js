export const wallFragmentShader = `
  uniform float time;

  varying vec3 vWorldPosition;

  float random(vec2 p) {
    return fract(
      sin(dot(p, vec2(12.9898, 78.233))) *
      43758.5453
    );
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(a, b, u.x),
      mix(c, d, u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 p =
      vWorldPosition.xz * 0.45 +
      vec2(
        time * 0.04,
        time * -0.025
      );

    float n = fbm(p);

    // Secondary moving noise layer
    float n2 =
      fbm(
        p * 1.8 +
        vec2(
          -time * 0.03,
          time * 0.02
        )
      );

    // Dark neutral wall underneath
    vec3 base =
      vec3(0.16, 0.16, 0.17);

    // Oil-slick palette
    vec3 oilBlue =
      vec3(0.08, 0.20, 0.42);

    vec3 oilPurple =
      vec3(0.34, 0.08, 0.42);

    vec3 oilGreen =
      vec3(0.08, 0.34, 0.24);

    vec3 oilGold =
      vec3(0.48, 0.28, 0.06);

    // Moving interference-like bands
    float phase =
      n * 3.0 +
      n2 * 2.0 +
      time * 0.12;

    float bandA =
      sin(phase) * 0.5 + 0.5;

    float bandB =
      sin(phase + 2.094) * 0.5 + 0.5;

    float bandC =
      sin(phase + 4.188) * 0.5 + 0.5;

    vec3 oilColor =
      oilBlue * bandA +
      oilPurple * bandB +
      oilGreen * bandC;

    oilColor /=
      max(
        bandA + bandB + bandC,
        0.001
      );

    // Occasional warm/gold regions
    oilColor =
      mix(
        oilColor,
        oilGold,
        smoothstep(0.62, 0.88, n2) * 0.35
      );

    // Preserve some light/dark variation
    float brightness =
      mix(
        0.65,
        1.15,
        smoothstep(0.25, 0.8, n)
      );

    oilColor *= brightness;

    // Blend oil colour into neutral wall
    vec3 color =
      mix(
        base,
        oilColor,
        0.45
      );

    gl_FragColor =
      vec4(color, 1.0);
  }
`;