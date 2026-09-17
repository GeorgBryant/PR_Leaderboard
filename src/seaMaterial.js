import * as THREE from "three";

const vertexShader = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  uniform float uTime;

  void main() {
    vec3 animatedPosition =
      position;

float wave =
  sin(
    position.z * 0.35 +
    uTime * 0.4
  );

animatedPosition.y +=
  wave * 0.02;


  
animatedPosition.z +=
  wave * 0.005;

    vec4 worldPosition =
      modelMatrix *
      vec4(animatedPosition, 1.0);

    vWorldPosition =
      worldPosition.xyz;

    vWorldNormal =
      normalize(
        mat3(modelMatrix) * normal
      );

    gl_Position =
      projectionMatrix *
      viewMatrix *
      worldPosition;
  }
`;

const fragmentShader = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;


  // --------------------------------------------
  // RGB -> HSV
  // --------------------------------------------

  vec3 rgb2hsv(vec3 c) {
    vec4 K =
      vec4(
        0.0,
        -1.0 / 3.0,
        2.0 / 3.0,
        -1.0
      );

    vec4 p =
      mix(
        vec4(c.bg, K.wz),
        vec4(c.gb, K.xy),
        step(c.b, c.g)
      );

    vec4 q =
      mix(
        vec4(p.xyw, c.r),
        vec4(c.r, p.yzx),
        step(p.x, c.r)
      );

    float d =
      q.x - min(q.w, q.y);

    float e =
      1.0e-10;

    return vec3(
      abs(
        q.z +
        (q.w - q.y) /
        (6.0 * d + e)
      ),
      d / (q.x + e),
      q.x
    );
  }


  // --------------------------------------------
  // HSV -> RGB
  // --------------------------------------------

  vec3 hsv2rgb(vec3 c) {
    vec3 p =
      abs(
        fract(
          c.xxx +
          vec3(
            0.0,
            2.0 / 3.0,
            1.0 / 3.0
          )
        ) *
        6.0 -
        3.0
      );

    return
      c.z *
      mix(
        vec3(1.0),
        clamp(
          p - 1.0,
          0.0,
          1.0
        ),
        c.y
      );
  }


  void main() {
    vec3 normal =
      normalize(vWorldNormal);


    // --------------------------------------------
    // ORIGINAL GROOVY SEA
    // --------------------------------------------

    vec3 color =
      normal * 0.5 + 0.5;


    // --------------------------------------------
    // GREEN HUE REMAP
    // --------------------------------------------

    vec3 hsv =
      rgb2hsv(color);

    // Select the yellow-green / green part
    // of the original normal-map rainbow.
    float greenMask =
      smoothstep(
        0.12,
        0.22,
        hsv.x
      ) *
      (
        1.0 -
        smoothstep(
          0.48,
          0.56,
          hsv.x
        )
      );

    // Move only that hue range toward cyan-blue.
    // Saturation and brightness stay unchanged.
    float targetHue =
      0.65;

    hsv.x =
      mix(
        hsv.x,
        targetHue,
        greenMask * 0.65
      );

    color =
      hsv2rgb(hsv);


    gl_FragColor =
      vec4(
        color,
        1.0
      );
  }
`;

export const seaMaterial =
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,

    uniforms: {
      uTime: { value: 0 },
    },

    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true,
  });