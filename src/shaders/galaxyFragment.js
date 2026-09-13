export const galaxyFragmentShader = `
        uniform float time;
        uniform vec3 mannequinOrigin;
        uniform float galaxyScale;

        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform vec3 nebulaColor;
        uniform vec3 warmStarColor;
        uniform vec3 coolStarColor;

        uniform float armCount;
        uniform float spiralTightness;
        uniform float rotationSpeed;
        uniform float armSharpness;
        uniform float galaxyRadius;

        uniform float warpScale;
        uniform float warpStrength;
        uniform float warpSpeed;

        uniform float armNoiseScale;
        uniform float armNoiseSpeed;
        uniform float armNoiseLow;
        uniform float armNoiseHigh;

        uniform float coreRadius;
        uniform float coreSharpness;
        uniform float coreBrightness;

        uniform float haloRadius;
        uniform float haloBrightness;
        uniform float haloPower;

        uniform float nebulaScale;
        uniform float nebulaSpeed;
        uniform float nebulaLow;
        uniform float nebulaHigh;
        uniform float nebulaBrightness;

        uniform float dustScale;
        uniform float dustLow;
        uniform float dustHigh;
        uniform float dustStrength;
        uniform float dustNebulaStrength;

        uniform float largeStarDensity;
        uniform float largeStarSize;
        uniform float largeStarBrightness;
        uniform float largeStarTwinkle;

        uniform float smallStarDensity;
        uniform float smallStarSize;
        uniform float smallStarBrightness;
        uniform float smallStarTwinkle;

        uniform float starsEnabled;

        const int MAX_GALAXIES = 5;

uniform int galaxyCount;

uniform vec2 galaxyOffsets[MAX_GALAXIES];
uniform float galaxyScales[MAX_GALAXIES];
uniform float galaxyRotations[MAX_GALAXIES];
uniform float galaxySeeds[MAX_GALAXIES];
uniform vec2 galaxyInteractionDirections[MAX_GALAXIES];
uniform float galaxyInteractionStrengths[MAX_GALAXIES];
uniform float galaxyColorBiases[MAX_GALAXIES];

        varying vec3 vWorldPosition;

        const vec2 WARP_OFFSET = vec2(5.2, 1.3);
        const vec2 DUST_OFFSET = vec2(7.3, -2.1);
        const vec2 NEBULA_OFFSET = vec2(-2.4, 4.7);
        const vec2 BACKGROUND_STAR_OFFSET = vec2(3.7, 8.2);
        const vec2 GALAXY_FINE_STAR_OFFSET = vec2(11.4, 2.8);
        const vec2 GALAXY_MEDIUM_STAR_OFFSET = vec2(6.1, 14.7);
        const vec2 CORE_STAR_OFFSET = vec2(2.7, 18.4);
        const vec2 HERO_STAR_OFFSET = vec2(19.3, 4.6);
        const vec2 GALAXY_COLOR_OFFSET = vec2(13.4, 6.2);
        const vec2 BULGE_GRAIN_OFFSET = vec2(4.8, -7.1);
        const float BULGE_ASPECT_RATIO = 1.18;

        // --------------------------------
        // RANDOM
        // --------------------------------

        float random(vec2 position) {
          return fract(
            sin(
              dot(
                position,
                vec2(12.9898, 78.233)
              )
            ) * 43758.5453
          );
        }

        // --------------------------------
        // VALUE NOISE
        // --------------------------------

        float noise(vec2 position) {
          vec2 cell = floor(position);
          vec2 local = fract(position);

          float a = random(cell);
          float b = random(cell + vec2(1.0, 0.0));
          float c = random(cell + vec2(0.0, 1.0));
          float d = random(cell + vec2(1.0, 1.0));

          vec2 smoothLocal = local * local * (3.0 - 2.0 * local);

          float top = mix(a, b, smoothLocal.x);
          float bottom = mix(c, d, smoothLocal.x);

          return mix(top, bottom, smoothLocal.y);
        }

        // --------------------------------
        // FBM
        // --------------------------------

        float fbm(vec2 position) {
          float value = 0.0;
          float amplitude = 0.5;

          for (int i = 0; i < 5; i++) {
            value += noise(position) * amplitude;
            position *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        // --------------------------------
        // STARS
        // --------------------------------

        float createStars(
          vec2 position,
          float scale,
          float threshold,
          float size,
          float twinkleSpeed
        ) {
          vec2 gridPosition = position * scale;
          vec2 cell = floor(gridPosition);
          vec2 localPosition = fract(gridPosition) - 0.5;

          float starSeed = random(cell);
          float starExists = step(threshold, starSeed);
          float distanceToStar = length(localPosition);

          float starShape = 1.0 - smoothstep(0.0, size, distanceToStar);

          float twinkle = sin(time * twinkleSpeed + starSeed * 6.28318) * 0.5 + 0.5;
          twinkle = mix(0.6, 1.0, twinkle);

          return starExists * starShape * twinkle * starsEnabled;
        }

        float createLuminosityField(vec2 position) {
          float broadDensity = fbm(position * 18.0 + vec2(14.2, -6.8));
          float mediumDensity = fbm(position * 55.0 + vec2(-9.7, 21.3));

          broadDensity = smoothstep(0.25, 0.78, broadDensity);
          mediumDensity = smoothstep(0.32, 0.75, mediumDensity);

          float luminosity = broadDensity * 0.58 + mediumDensity * 0.42;

          return clamp(luminosity, 0.0, 1.0);
        }

        // --------------------------------
        // GALAXY SHAPE
        // --------------------------------

        struct GalaxyShape {
          float distanceFromCentre;
          float bulgeDistance;
          float angle;
          float centreInfluence;
          float spiral;
          float radialMask;
          float core;
          float nucleus;
          float halo;
        };

        struct GalaxyStars {
          float fine;
          float medium;
          float core;
          float hero;
        };

        struct GalaxySettings {
  vec2 proceduralOffset;
  float armCount;
  float spiralTightness;
  float colorBias;
  float coreRadius;
  float colorVariation;

  float armSharpness;
  float brightness;
};

        float createSpiral(
  float distanceFromCentre,
  float angle,
  float localSpiralTightness,
  float localArmCount,
  float localArmSharpness
) {
          float safeDistance = max(distanceFromCentre, 0.003);

          float innerInfluence =
            1.0 -
            smoothstep(
              coreRadius * 0.18,
              coreRadius * 0.75,
              safeDistance
            );

          float outerPhase = safeDistance * localSpiralTightness;

          float innerPhase =
            coreRadius * localSpiralTightness +
            log(safeDistance / coreRadius) * 2.4;

          float radialPhase = mix(outerPhase, innerPhase, innerInfluence);

          float spiral =
            sin(
              angle * localArmCount +
              radialPhase -
              time * rotationSpeed
            );

          spiral = spiral * 0.5 + 0.5;

float finalArmSharpness =
  mix(
    localArmSharpness,
    0.55,
    innerInfluence
  );

spiral =
  pow(
    spiral,
    finalArmSharpness
  );

          return spiral;
        }

        float createRadialMask(float distanceFromCentre) {
          float fadeStart = galaxyRadius * 0.5;

          return 1.0 - smoothstep(fadeStart, galaxyRadius, distanceFromCentre);
        }

        float createHalo(float distanceFromCentre) {
          float halo =
            1.0 - smoothstep(0.0, galaxyRadius * haloRadius, distanceFromCentre);

          return pow(halo, haloPower);
        }

        float createCore(
  float distanceFromCentre,
  float coreRadius
) {
  float core =
    1.0 -
    smoothstep(
      0.0,
      coreRadius,
      distanceFromCentre
    );

  return pow(
    core,
    coreSharpness
  );
}
        float createNucleus(
  float distanceFromCentre,
  float coreRadius
) {
  float nucleusRadius =
    coreRadius * 0.42;

          float nucleus =
            1.0 -
            smoothstep(
              nucleusRadius * 0.08,
              nucleusRadius,
              distanceFromCentre
            );

          return pow(nucleus, 1.35);
        }

        vec2 transformGalaxyPosition(
          vec2 position,
          vec2 offset,
          float scale,
          float rotation
        ) {
          vec2 localPosition = position - offset;

          localPosition.x -=
  floor(
    localPosition.x + 0.5
  );

          float sine = sin(rotation);
          float cosine = cos(rotation);

          mat2 rotationMatrix = mat2(cosine, -sine, sine, cosine);

          localPosition = rotationMatrix * localPosition;
          localPosition /= max(scale, 0.001);

          return localPosition;
        }

        vec2 applyTidalDistortion(
  vec2 galaxyPosition,
  vec2 interactionDirection,
  float interactionStrength,
  float rotation
) {
  if (interactionStrength <= 0.0) {
    return galaxyPosition;
  }

  float sine =
    sin(rotation);

  float cosine =
    cos(rotation);

  mat2 rotationMatrix =
    mat2(
      cosine, -sine,
      sine, cosine
    );

  vec2 localDirection =
    normalize(
      rotationMatrix *
      interactionDirection
    );

  float distanceFromCentre =
    length(galaxyPosition);

  float tidalFalloff =
    1.0 -
    smoothstep(
      0.0,
      galaxyRadius * 1.2,
      distanceFromCentre
    );

  float alongAxis =
    dot(
      galaxyPosition,
      localDirection
    );

  float tidalAmount =
    interactionStrength *
    tidalFalloff *
    0.28;

  galaxyPosition -=
    localDirection *
    alongAxis *
    tidalAmount;

  return galaxyPosition;
}

        GalaxySettings createGalaxySettings(
  float seed
) {
  GalaxySettings settings;

settings.colorVariation =
  mix(
    -0.14,
    0.14,
    random(vec2(seed, 9.0))
  );

  settings.proceduralOffset =
    vec2(
      random(vec2(seed, 1.0)),
      random(vec2(seed, 2.0))
    ) * 20.0;

  settings.armCount =
    floor(
      mix(
        2.0,
        5.0,
        random(vec2(seed, 3.0))
      )
    );

  settings.spiralTightness =
    mix(
      spiralTightness * 0.75,
      spiralTightness * 1.25,
      random(vec2(seed, 4.0))
    );

  settings.colorBias =
    mix(
      -0.18,
      0.18,
      random(vec2(seed, 5.0))
    );

  settings.coreRadius =
    coreRadius *
    mix(
      0.78,
      1.22,
      random(vec2(seed, 6.0))
    );

settings.armSharpness =
  mix(
    armSharpness * 0.75,
    armSharpness * 1.25,
    random(vec2(seed, 7.0))
  );

settings.brightness =
  mix(
    0.82,
    1.18,
    random(vec2(seed, 8.0))
  );

  return settings;
}

        GalaxyStars createGalaxyStars(
  vec2 warpedPosition,
  vec2 galaxyPosition,
  vec2 proceduralOffset
) {
          GalaxyStars stars;

          stars.fine =
            createStars(
              warpedPosition + GALAXY_FINE_STAR_OFFSET + proceduralOffset,
              220.0,
              0.72,
              0.12,
              smallStarTwinkle * 0.6
            );

          stars.medium =
            createStars(
              warpedPosition + GALAXY_MEDIUM_STAR_OFFSET + proceduralOffset,
              140.0,
              0.82,
              0.16,
              smallStarTwinkle * 0.8
            );

          float coreStarsA =
            createStars(
              warpedPosition + CORE_STAR_OFFSET,
              320.0,
              0.88,
              0.065,
              smallStarTwinkle * 0.08
            );

          float coreStarsB =
            createStars(
              warpedPosition + CORE_STAR_OFFSET + vec2(43.7, 91.2),
              360.0,
              0.88,
              0.065,
              smallStarTwinkle * 0.08
            );

          stars.core = clamp(coreStarsA + coreStarsB * 0.7, 0.0, 1.0);

          stars.hero =
            createStars(
              galaxyPosition + HERO_STAR_OFFSET + proceduralOffset,
              75.0,
              clamp(largeStarDensity + 0.04, 0.0, 1.0),
              largeStarSize,
              largeStarTwinkle
            );

          return stars;
        }

       vec2 warpGalaxyPosition(
  vec2 galaxyPosition,
  vec2 proceduralOffset
) {
  vec2 warp =
    vec2(
      fbm(
        galaxyPosition * warpScale +
        proceduralOffset +
        time * warpSpeed
      ),
      fbm(
        galaxyPosition * warpScale +
        WARP_OFFSET +
        proceduralOffset +
        time * warpSpeed
      )
    );

  warp = warp * 2.0 - 1.0;

  return galaxyPosition + warp * warpStrength;
}

        float createDustLanes(
          vec2 warpedPosition,
          float radialMask,
          float centreInfluence,
          float spiral,
          vec2 proceduralOffset
        ) {
          vec2 dustWarp =
            vec2(
              fbm(warpedPosition * dustScale * 0.18 + DUST_OFFSET + proceduralOffset),
              fbm(warpedPosition * dustScale * 0.18 + DUST_OFFSET + proceduralOffset + vec2(4.6, -8.3))
            );

          dustWarp = dustWarp * 2.0 - 1.0;

          vec2 dustPosition = warpedPosition + dustWarp * 0.035;

          float dustNoise =
            fbm(dustPosition * dustScale * 0.48 + DUST_OFFSET + proceduralOffset);

          float dustLanes =
            smoothstep(dustLow - 0.08, dustHigh + 0.08, dustNoise);

          float innerDustInfluence =
            mix(radialMask, 1.0, centreInfluence * 0.45);

          float softDustSpiral = pow(spiral, 0.3);

          dustLanes *=
            mix(0.35, 1.0, softDustSpiral) * innerDustInfluence;

          return dustLanes;
        }

        float createNebula(
          vec2 warpedPosition,
          float radialMask,
          float dustLanes,
          vec2 proceduralOffset
        ) {
          float nebulaNoise =
            fbm(
              warpedPosition * nebulaScale +
              NEBULA_OFFSET + proceduralOffset +
              time * nebulaSpeed
            );

          nebulaNoise = smoothstep(nebulaLow, nebulaHigh, nebulaNoise);

          float nebula = nebulaNoise * radialMask * nebulaBrightness;

          nebula *= 1.0 - dustLanes * dustNebulaStrength;

          return nebula;
        }

GalaxyShape createGalaxyShape(
  vec2 warpedPosition,
  float localArmCount,
  float localSpiralTightness,
  float coreRadius,
  float localArmSharpness
) {
          GalaxyShape shape;

          vec2 bulgePosition = warpedPosition;
          bulgePosition.y *= BULGE_ASPECT_RATIO;

          shape.bulgeDistance = length(bulgePosition);
          shape.distanceFromCentre = length(warpedPosition);
          shape.angle = atan(warpedPosition.y, warpedPosition.x);

          shape.centreInfluence =
            1.0 - smoothstep(0.0, galaxyRadius, shape.distanceFromCentre);

          float tightenedSpiral =
  localSpiralTightness +
  shape.centreInfluence * 8.0;

shape.spiral =
  createSpiral(
    shape.distanceFromCentre,
    shape.angle,
    tightenedSpiral,
    localArmCount,
    localArmSharpness
  );

          shape.radialMask = createRadialMask(shape.distanceFromCentre);

          float bulgeSpiralStructure = mix(0.75, 1.0, shape.spiral);

          shape.core =
  createCore(
    shape.bulgeDistance,
    coreRadius
  ) *
  bulgeSpiralStructure;

shape.nucleus =
  createNucleus(
    shape.bulgeDistance,
    coreRadius
  );

          shape.halo = createHalo(shape.distanceFromCentre);

          return shape;
        }

vec3 renderGalaxy(
  vec2 position,
  vec2 offset,
  float scale,
  float rotation,
  float seed,
  vec2 interactionDirection,
  float interactionStrength,
  float universeColorBias
) {
  vec2 galaxyPosition =
    transformGalaxyPosition(
      position,
      offset,
      scale,
      rotation
    );

    galaxyPosition =
  applyTidalDistortion(
    galaxyPosition,
    interactionDirection,
    interactionStrength,
    rotation
  );

  GalaxySettings settings =
    createGalaxySettings(
      seed
    );

          // --------------------------------
          // DOMAIN WARP
          // --------------------------------

          vec2 warpedPosition =
  warpGalaxyPosition(
    galaxyPosition,
    settings.proceduralOffset
  );

          // --------------------------------
          // GALAXY SHAPE
          // --------------------------------

          GalaxyShape shape =
  createGalaxyShape(
    warpedPosition,
    settings.armCount,
    settings.spiralTightness,
    settings.coreRadius,
    settings.armSharpness
  );
          // --------------------------------
          // ARM NOISE
          // --------------------------------

          float armNoise =
            fbm(warpedPosition * armNoiseScale + time * armNoiseSpeed);

          armNoise = smoothstep(armNoiseLow, armNoiseHigh, armNoise);

          // --------------------------------
          // DUST
          // --------------------------------

          float dustLanes =
            createDustLanes(
              warpedPosition,
              shape.radialMask,
              shape.centreInfluence,
              shape.spiral,
              settings.proceduralOffset
            );

          // --------------------------------
          // NEBULA
          // --------------------------------

          float nebula =
            createNebula(warpedPosition, shape.radialMask, dustLanes, settings.proceduralOffset);

          // --------------------------------
          // STARS
          // --------------------------------

          GalaxyStars stars =
  createGalaxyStars(
    warpedPosition,
    galaxyPosition,
    settings.proceduralOffset
  );

          // --------------------------------
          // GALAXY ARMS
          // --------------------------------

          float arms =
            shape.spiral *
            shape.radialMask *
            armNoise *
            (1.0 - dustLanes * dustStrength * 0.65);

          float armClumpNoise =
            fbm(
              warpedPosition * 3.0 +
              vec2(time * 0.002, -time * 0.0015)
            );

          float armClumps = smoothstep(0.2, 0.8, armClumpNoise);

          arms *= mix(0.55, 1.0, armClumps);

          float innerArmMask =
            1.0 -
            smoothstep(
              coreRadius * 0.3,
              coreRadius * 1.35,
              shape.bulgeDistance
            );

          float innerArmConnection =
            shape.spiral * mix(0.45, 1.0, armNoise) * innerArmMask;



          float starClumpNoise =
            fbm(
              warpedPosition * 5.0 +
              vec2(time * 0.003, -time * 0.002)
            );

          float starClumps = smoothstep(0.52, 0.78, starClumpNoise);

          float galaxyStarMask =
            clamp(
              (arms * 3.5 + shape.halo * 0.5) * starClumps,
              0.0,
              1.0
            );

          stars.fine *= galaxyStarMask;
          stars.medium *= galaxyStarMask;

vec3 localGalaxyColor =
  colorB;

localGalaxyColor.r =
  clamp(
    localGalaxyColor.r +
    universeColorBias,
    0.0,
    1.0
  );

localGalaxyColor.b =
  clamp(
    localGalaxyColor.b -
    universeColorBias,
    0.0,
    1.0
  );


          // --------------------------------
          // COLOR LAYERS
          // --------------------------------

          float galaxyColorNoise =
            noise(warpedPosition * 90.0 + GALAXY_COLOR_OFFSET);

          float starTemperature =
  clamp(
    smoothstep(
      0.35,
      0.75,
      galaxyColorNoise
    ) +
    settings.colorBias,
    0.0,
    1.0
  );

vec3 galaxyStarColor =
  mix(
    coolStarColor,
    warmStarColor,
    starTemperature
  );

vec3 haloLayer =
  localGalaxyColor *
  shape.halo *
  haloBrightness *
  0.75;

          vec3 armColor =
  localGalaxyColor *
  (
    arms +
    innerArmConnection * 0.35
  );

          vec3 nebulaLayer = nebulaColor * nebula * 0.65;

          vec3 coreColor =
  localGalaxyColor *
  shape.core *
  coreBrightness *
  0.12;

          vec3 galaxyStarLayer =
            galaxyStarColor * (stars.fine + stars.medium) * 1.4;

          float galaxyStarOcclusion =
            clamp(1.0 - dustLanes * dustStrength * 0.4, 0.0, 1.0);

          float coreStarFalloff = pow(shape.core, 0.85);

          float coreSpiralMask = mix(0.35, 1.0, shape.spiral);

          vec3 coreStarColor = mix(vec3(1.0), warmStarColor, 0.35);

          coreStarColor =
            mix(coreStarColor, coolStarColor, galaxyColorNoise * 0.25);

          float luminosityField =
            createLuminosityField(warpedPosition + BULGE_GRAIN_OFFSET);

          float nucleusDensity = mix(0.58, 1.0, luminosityField);

          nucleusDensity *= mix(0.78, 1.0, starClumps);

          float texturedNucleus = shape.nucleus * nucleusDensity;

          float bulgeSpiralDensity = mix(0.32, 1.0, coreSpiralMask);

          float bulgeClumpDensity = mix(0.42, 1.0, starClumps);

          float bulgeDustOcclusion =
            clamp(1.0 - dustLanes * 0.72, 0.0, 1.0);

          float luminosityDensity =
            luminosityField *
            bulgeSpiralDensity *
            bulgeClumpDensity *
            bulgeDustOcclusion;

          float stellarDensity =
            clamp(0.16 + luminosityDensity * 1.25, 0.0, 1.0);

          float unresolvedBulge = pow(shape.core, 0.78) * stellarDensity;

          galaxyStarLayer *= galaxyStarOcclusion;

          vec3 heroStarLayer = galaxyStarColor * stars.hero * 3.0;

          vec3 bulgeColor =
  mix(
    coolStarColor,
    warmStarColor,
    clamp(
      0.72 + settings.colorBias,
      0.0,
      1.0
    )
  );

          vec3 nucleusOuterColor =
  mix(
    coolStarColor,
    warmStarColor,
    clamp(
      0.82 + settings.colorBias,
      0.0,
      1.0
    )
  );

          vec3 nucleusInnerColor = mix(warmStarColor, vec3(1.0), 0.58);

          vec3 nucleusColor =
            mix(
              nucleusOuterColor,
              nucleusInnerColor,
              pow(shape.nucleus, 1.7)
            );

          vec3 nucleusLayer =
            nucleusColor * texturedNucleus * coreBrightness * 0.72;

          float coreStarVisibility =
            stars.core * coreStarFalloff * coreSpiralMask;

          vec3 coreStarLayer = coreStarColor * coreStarVisibility * 3.0;

          vec3 unresolvedBulgeLayer = bulgeColor * unresolvedBulge * 0.65;

          unresolvedBulgeLayer *= 1.0 - coreStarVisibility * 0.45;

          // --------------------------------
          // FINAL COMPOSITION
          // --------------------------------

          vec3 galaxyLayer =
            haloLayer +
            armColor +
            nebulaLayer +
            coreColor +
            unresolvedBulgeLayer +
            nucleusLayer +
            galaxyStarLayer +
            coreStarLayer +
            heroStarLayer;
            galaxyLayer *= 
              settings.brightness;

          return galaxyLayer;
        }

        void main() {
vec3 mannequinPosition =
  vWorldPosition - mannequinOrigin;

vec2 position =
  mannequinPosition.xy *
  galaxyScale;

          // --------------------------------
          // SHARED BACKGROUND
          // --------------------------------

          vec3 backgroundColor = colorA;

          float backgroundStars =
            createStars(
              position + BACKGROUND_STAR_OFFSET,
              160.0,
              smallStarDensity,
              smallStarSize,
              smallStarTwinkle
            );

          vec3 backgroundStarLayer =
            coolStarColor * backgroundStars * smallStarBrightness * 2.0;

          vec3 finalColor = backgroundColor + backgroundStarLayer;

          // --------------------------------
          // GALAXIES
          // --------------------------------

for (int i = 0; i < MAX_GALAXIES; i++) {
  if (i >= galaxyCount) {
    break;
  }

finalColor +=
  renderGalaxy(
    position,
    galaxyOffsets[i],
    galaxyScales[i],
    galaxyRotations[i],
    galaxySeeds[i],
    galaxyInteractionDirections[i],
    galaxyInteractionStrengths[i],
    galaxyColorBiases[i]
  );
}

finalColor += vec3(
  0.018,
  0.026,
  0.055
);

          gl_FragColor = vec4(finalColor, 1.0);
        }
`;