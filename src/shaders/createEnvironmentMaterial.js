import * as THREE from "three";
import { environmentVertexShader } from "./environmentVertex";
import { environmentFragmentShader } from "./environmentFragment";

export function createEnvironmentMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader:
      environmentVertexShader,

    fragmentShader:
      environmentFragmentShader,

    uniforms: {
      time: {
        value: 0,
      },
    },

    side: THREE.BackSide,
  });
}