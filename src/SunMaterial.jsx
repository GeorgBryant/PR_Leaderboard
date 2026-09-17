import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;

  void main() {
    // ------------------------------------------------
    // TWO SEPARATE CENTRES
    // ------------------------------------------------

    // Artistic hotspot — intentionally offset
    vec2 colorCenter = vec2(0.75, 0.75);

    // Physical centre of the sun geometry
    vec2 edgeCenter = vec2(0.92, 0.92);

    float colorRadial =
      length(vUv - colorCenter);

    float edgeRadial =
      length(vUv - edgeCenter);


    // ------------------------------------------------
    // SUN COLOUR
    // ------------------------------------------------

    vec3 core = vec3(
      1.0,
      0.97,
      0.78
    );

    vec3 peach = vec3(
      1.0,
      0.70,
      0.38
    );

    vec3 orange = vec3(
      1.0,
      0.32,
      0.08
    );

    vec3 color = mix(
      core,
      peach,
      smoothstep(
        0.05,
        0.38,
        colorRadial
      )
    );

    color = mix(
      color,
      orange,
      smoothstep(
        0.38,
        0.72,
        colorRadial
      )
    );


    // ------------------------------------------------
    // EDGE FADE
    // ------------------------------------------------

    // Completely solid through most of the sun,
    // then gradually dissolve into the sky.
    float alpha =
      1.0 - smoothstep(
        0.42,
        0.52,
        edgeRadial
      );


    gl_FragColor =
      vec4(color, alpha);
  }
`;

export const sunMaterial =
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,

    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });