import * as THREE from "three";

import { galaxyVertexShader } from "./galaxyVertex";
import { galaxyFragmentShader } from "./galaxyFragment";

const MAX_GALAXIES = 5;

const DEFAULTS = {
  galaxyCount: 2,
  spiralTightness: 14,
  armSharpness: 8,
  galaxyRadius: 0.5,

  rotationSpeed: 0.25,

  warpScale: 4.5,
  warpStrength: 0.045,
  warpSpeed: 0.01,

  armNoiseScale: 11,
  armNoiseSpeed: 0.008,
  armNoiseLow: 0.32,
  armNoiseHigh: 0.72,

  coreRadius: 0.12,
  coreSharpness: 2.8,
  coreBrightness: 1.65,

  haloRadius: 1.75,
  haloPower: 3.4,
  haloBrightness: 0.07,

  nebulaScale: 4.5,
  nebulaSpeed: 0.004,
  nebulaLow: 0.38,
  nebulaHigh: 0.69,
  nebulaBrightness: 0.22,

  dustScale: 14,
  dustLow: 0.49,
  dustHigh: 0.67,
  dustStrength: 0.72,
  dustNebulaStrength: 0.42,

  largeStarDensity: 0.992,
  largeStarSize: 0.085,
  largeStarBrightness: 1.6,
  largeStarTwinkle: 0.55,

  smallStarDensity: 0.978,
  smallStarSize: 0.04,
  smallStarBrightness: 0.75,
  smallStarTwinkle: 0.25,

  colorA: "#01030a",
  colorB: "#7da7ff",
  nebulaColor: "#633ca6",
  warmStarColor: "#ffd6a3",
  coolStarColor: "#b9d4ff",

  starsEnabled: 1,
};

function generateGalaxies() {
  const galaxies = [];

  for (let i = 0; i < MAX_GALAXIES; i++) {
    galaxies.push({
      offset: new THREE.Vector2(
        Math.random() * 0.6 - 0.3,
        Math.random() * 0.6 - 0.3
      ),
      scale: 0.25 + Math.random() * 0.35,
      rotation: Math.random() * Math.PI * 2,
      seed: Math.random() * 1000,
      interactionDirection: new THREE.Vector2(0, 0),
      interactionStrength: 0,
      colorBias: Math.random() * 0.44 - 0.22,
    });
  }

  return galaxies;
}

export function createGalaxyMaterial() {
  const galaxies = generateGalaxies();

  return new THREE.ShaderMaterial({
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,

    uniforms: {
      time: { value: 0 },

      mannequinOrigin: {
  value: new THREE.Vector3(),
},

galaxyScale: {
  value: 0.35,
},

      starsEnabled: {
        value: DEFAULTS.starsEnabled,
      },

      galaxyCount: {
        value: DEFAULTS.galaxyCount,
      },

      galaxyOffsets: {
        value: galaxies.map((g) => g.offset),
      },

      galaxyScales: {
        value: galaxies.map((g) => g.scale),
      },

      galaxyRotations: {
        value: galaxies.map((g) => g.rotation),
      },

      galaxySeeds: {
        value: galaxies.map((g) => g.seed),
      },

      galaxyInteractionDirections: {
        value: galaxies.map((g) => g.interactionDirection),
      },

      galaxyInteractionStrengths: {
        value: galaxies.map((g) => g.interactionStrength),
      },

      galaxyColorBiases: {
        value: galaxies.map((g) => g.colorBias),
      },

      armCount: { value: 3 },
      spiralTightness: { value: DEFAULTS.spiralTightness },
      armSharpness: { value: DEFAULTS.armSharpness },
      galaxyRadius: { value: DEFAULTS.galaxyRadius },

      rotationSpeed: { value: DEFAULTS.rotationSpeed },

      warpScale: { value: DEFAULTS.warpScale },
      warpStrength: { value: DEFAULTS.warpStrength },
      warpSpeed: { value: DEFAULTS.warpSpeed },

      armNoiseScale: { value: DEFAULTS.armNoiseScale },
      armNoiseSpeed: { value: DEFAULTS.armNoiseSpeed },
      armNoiseLow: { value: DEFAULTS.armNoiseLow },
      armNoiseHigh: { value: DEFAULTS.armNoiseHigh },

      coreRadius: { value: DEFAULTS.coreRadius },
      coreSharpness: { value: DEFAULTS.coreSharpness },
      coreBrightness: { value: DEFAULTS.coreBrightness },

      haloRadius: { value: DEFAULTS.haloRadius },
      haloPower: { value: DEFAULTS.haloPower },
      haloBrightness: { value: DEFAULTS.haloBrightness },

      nebulaScale: { value: DEFAULTS.nebulaScale },
      nebulaSpeed: { value: DEFAULTS.nebulaSpeed },
      nebulaLow: { value: DEFAULTS.nebulaLow },
      nebulaHigh: { value: DEFAULTS.nebulaHigh },
      nebulaBrightness: { value: DEFAULTS.nebulaBrightness },

      dustScale: { value: DEFAULTS.dustScale },
      dustLow: { value: DEFAULTS.dustLow },
      dustHigh: { value: DEFAULTS.dustHigh },
      dustStrength: { value: DEFAULTS.dustStrength },
      dustNebulaStrength: { value: DEFAULTS.dustNebulaStrength },

      largeStarDensity: { value: DEFAULTS.largeStarDensity },
      largeStarSize: { value: DEFAULTS.largeStarSize },
      largeStarBrightness: { value: DEFAULTS.largeStarBrightness },
      largeStarTwinkle: { value: DEFAULTS.largeStarTwinkle },

      smallStarDensity: { value: DEFAULTS.smallStarDensity },
      smallStarSize: { value: DEFAULTS.smallStarSize },
      smallStarBrightness: { value: DEFAULTS.smallStarBrightness },
      smallStarTwinkle: { value: DEFAULTS.smallStarTwinkle },

      colorA: {
        value: new THREE.Color(DEFAULTS.colorA),
      },

      colorB: {
        value: new THREE.Color(DEFAULTS.colorB),
      },

      nebulaColor: {
        value: new THREE.Color(DEFAULTS.nebulaColor),
      },

      warmStarColor: {
        value: new THREE.Color(DEFAULTS.warmStarColor),
      },

      coolStarColor: {
        value: new THREE.Color(DEFAULTS.coolStarColor),
      },
    },
  });
}