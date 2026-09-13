import * as THREE from "three";
import { wallVertexShader } from "./wallVertex";
import { wallFragmentShader } from "./wallFragment";

export function createWallMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: wallVertexShader,
    fragmentShader: wallFragmentShader,

    uniforms: {
      time: {
        value: 0,
      },
    },

    side: THREE.DoubleSide,
  });
}