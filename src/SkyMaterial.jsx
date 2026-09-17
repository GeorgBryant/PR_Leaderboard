import * as THREE from "three";

const vertexShader = `
  varying vec3 vPosition;

  void main() {
    vPosition = position;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vPosition;

  void main() {
    vec3 direction = normalize(vPosition);

    // ------------------------------------------------
    // VERTICAL SKY GRADIENT
    // ------------------------------------------------

    float height = clamp(direction.y, 0.0, 1.0);

    vec3 horizon = vec3(0.72, 0.34, 0.43);
    vec3 coral   = vec3(0.78, 0.28, 0.45);
    vec3 pink    = vec3(0.67, 0.25, 0.50);
    vec3 violet  = vec3(0.34, 0.25, 0.48);
    vec3 upper   = vec3(0.08, 0.10, 0.22);

    vec3 skyColor;

    if (height < 0.10) {
      float t = smoothstep(0.0, 0.10, height);
      skyColor = mix(horizon, coral, t);
    }
    else if (height < 0.30) {
      float t = smoothstep(0.10, 0.30, height);
      skyColor = mix(coral, pink, t);
    }
    else if (height < 0.60) {
      float t = smoothstep(0.30, 0.60, height);
      skyColor = mix(pink, violet, t);
    }
    else {
      float t = smoothstep(0.60, 1.0, height);
      skyColor = mix(violet, upper, t);
    }

    // ------------------------------------------------
    // SUN DIRECTION
    // ------------------------------------------------

    vec3 sunDirection =
      normalize(vec3(0.0, 0.05, -1.0));

    float sunAlignment =
      max(dot(direction, sunDirection), 0.0);

    // ------------------------------------------------
    // EXISTING ATMOSPHERIC GLOW
    // ------------------------------------------------

    float outerGlow =
      pow(sunAlignment, 5.0);

    vec3 outerGlowColor =
      vec3(1.0, 0.20, 0.38);

    float innerGlow =
      pow(sunAlignment, 18.0);

    vec3 innerGlowColor =
      vec3(1.0, 0.48, 0.28);

    float coreGlow =
      pow(sunAlignment, 60.0);

    vec3 coreGlowColor =
      vec3(1.0, 0.78, 0.48);

    float horizonMask =
      1.0 - smoothstep(
        0.05,
        0.65,
        height
      );

    outerGlow *= horizonMask;
    innerGlow *= horizonMask;
    coreGlow *= horizonMask;

// ------------------------------------------------
// SUN BLEED
// ------------------------------------------------

// Soft atmosphere immediately surrounding sun
float sunBleedSoft =
  pow(sunAlignment, 35.0);

// Tighter hot region
float sunBleed =
  pow(sunAlignment, 90.0);

sunBleedSoft *= horizonMask;
sunBleed *= horizonMask;

vec3 sunBleedColor =
  vec3(1.0, 0.58, 0.34);

vec3 sunBleedCore =
  vec3(1.0, 0.82, 0.56);

    // ------------------------------------------------
    // COMBINE
    // ------------------------------------------------

    vec3 color = skyColor;

    // Broad orange sunset atmosphere
    vec3 sunsetOrange =
      vec3(1.0, 0.30, 0.06);

    float orangeBand =
      (
        1.0 -
        smoothstep(
          0.05,
          0.42,
          height
        )
      )
      * pow(sunAlignment, 2.5);

    color = mix(
      color,
      sunsetOrange,
      orangeBand * 0.48
    );

    // Existing atmosphere
    color +=
      outerGlowColor *
      outerGlow *
      0.26;

    color +=
      innerGlowColor *
      innerGlow *
      0.38;

    color +=
      coreGlowColor *
      coreGlow *
      0.50;

    // New sun bleed
color = mix(
  color,
  sunBleedColor,
  sunBleedSoft * 0.18
);

color = mix(
  color,
  sunBleedCore,
  sunBleed * 0.28
);

    gl_FragColor =
      vec4(color, 1.0);
  }
`;

export const skyMaterial =
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
  });