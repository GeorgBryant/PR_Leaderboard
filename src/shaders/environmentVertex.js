export const environmentVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormalDir;

  void main() {
    vec4 worldPosition =
      modelMatrix *
      vec4(position, 1.0);

    vWorldPosition = worldPosition.xyz;

    vNormalDir =
      normalize(
        mat3(modelMatrix) * normal
      );

    gl_Position =
      projectionMatrix *
      viewMatrix *
      worldPosition;
  }
`;