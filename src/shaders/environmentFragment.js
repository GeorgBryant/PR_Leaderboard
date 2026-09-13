export const environmentFragmentShader = `
  uniform float time;

  varying vec3 vWorldPosition;
  varying vec3 vNormalDir;

  float random(vec2 p) {
    return fract(
      sin(
        dot(
          p,
          vec2(12.9898, 78.233)
        )
      ) * 43758.5453
    );
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u =
      f * f * (3.0 - 2.0 * f);

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
      value +=
        noise(p) * amplitude;

      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec3 dir =
      normalize(vWorldPosition);

    float angle =
      atan(dir.z, dir.x);

    float height =
      dir.y;

    vec2 atmosphereUV =
      vec2(
        angle * 0.55,
        height * 1.8
      );

    float cloud =
      fbm(
        atmosphereUV * 1.4 +
        vec2(
          time * 0.004,
          -time * 0.002
        )
      );

    float cloud2 =
      fbm(
        atmosphereUV * 3.0 +
        vec2(
          -time * 0.002,
          time * 0.003
        )
      );

    // -----------------------------
    // VERTICAL DISTANT LIGHT FORMS
    // -----------------------------

    float pillarPattern =
      sin(
        angle * 7.0 +
        cloud * 1.5
      ) * 0.5 + 0.5;

    pillarPattern =
      smoothstep(
        0.72,
        0.98,
        pillarPattern
      );

    float pillarHeight =
      1.0 -
      smoothstep(
        0.15,
        0.9,
        abs(height)
      );

    float pillars =
      pillarPattern *
      pillarHeight;

    // -----------------------------
    // HORIZON HAZE
    // -----------------------------

    float horizon =
      1.0 -
      smoothstep(
        0.02,
        0.35,
        abs(height + 0.10)
      );

    // -----------------------------
    // COLOUR
    // -----------------------------

    vec3 base =
      vec3(
        0.012,
        0.016,
        0.025
      );

    vec3 blueBlack =
      vec3(
        0.025,
        0.055,
        0.085
      );

    vec3 cyanGlow =
      vec3(
        0.08,
        0.20,
        0.24
      );

    vec3 violetGlow =
      vec3(
        0.12,
        0.07,
        0.18
      );

    vec3 color =
      mix(
        base,
        blueBlack,
        cloud * 0.45
      );

    color +=
      cyanGlow *
      pillars *
      0.20;

    color +=
      violetGlow *
      cloud2 *
      pillars *
      0.08;

    color +=
      cyanGlow *
      horizon *
      0.08;

    gl_FragColor =
      vec4(color, 1.0);
  }
`;