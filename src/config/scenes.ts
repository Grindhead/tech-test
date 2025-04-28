import { EmitterConfigV3 } from "@pixi/particle-emitter";

/** Scene-specific configurations */
export const sceneConfig = {
  /** Ace of Shadows scene configuration */
  aceOfShadows: {
    /** Width of each card */
    CARD_WIDTH: 70,
    /** Height of each card */
    CARD_HEIGHT: 100,
    /** Vertical offset between stacked cards */
    STACK_OFFSET_Y: 5,
    /** Total number of cards in the scene */
    NUM_CARDS: 144,
    /** Interval between card movements (ms) */
    MOVE_INTERVAL: 1000,
    /** Duration of card movement animation (seconds) */
    ANIMATION_DURATION: 2,
    /** Horizontal spacing factor between stacks */
    STACK_X_SPACING_FACTOR: 1.5,
  },

  /** Magic Words scene configuration */
  magicWords: {
    /** API endpoint for fetching magic words */
    API_ENDPOINT:
      "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords",
    /** Vertical spacing between lines */
    LINE_SPACING: 8,
    /** Size of emoji characters */
    EMOJI_SIZE: 20,
    /** Padding around dialogue text */
    DIALOGUE_PADDING: 15,
    /** Characters typed per second */
    TYPING_SPEED_CHARS_PER_SEC: 30,
    /** Size of avatar images */
    AVATAR_SIZE: 50,
    /** Padding around avatars */
    AVATAR_PADDING: 10,
  },

  /** Phoenix Flame scene configuration */
  phoenixFlame: {
    /** Vertical position of the title */
    TITLE_Y_OFFSET: -260,
    /** Vertical position of the particle count text */
    PARTICLE_COUNT_TEXT_Y_OFFSET: 170,
    /** Array of texture frame IDs for the fire particles */
    FIRE_TEXTURES: [
      "fire1.png",
      "fire2.png",
      "fire3.png",
      "fire4.png",
      "fire5.png",
    ],
    /** Configuration for the campfire base graphics */
    campfireBase: {
      LOG_BROWN: 0x8b4513,
      LOG_DARK_BROWN: 0x654321,
      LOG_LIGHT_BROWN: 0x8b5a2b,
      EMBERS_ORANGE: 0xe25822,
      EMBERS_RED: 0xff4500,
      EMBERS_TOMATO: 0xff6347,
      GLOW_ORANGE: 0xff8c00,
      GLOW_ALPHA: 0.4,
      GLOW_RADIUS: 25,
      GLOW_Y_OFFSET: 20,
      EMBER_RADIUS_1: 16,
      EMBER_RADIUS_2: 10,
      EMBER_RADIUS_3: 8,
      EMBER_POS_1: { x: -5, y: 25 },
      EMBER_POS_2: { x: 8, y: 22 },
      EMBER_POS_3: { x: -15, y: 22 },
      LOG_RECT_1: { x: -35, y: 25, w: 70, h: 15, r: 5, rotation: -0.3 },
      LOG_RECT_2: { x: 10, y: 30, w: 60, h: 12, r: 5, rotation: 0.2 }, // Note: Rotation applied *after* drawing
      LOG_RECT_3: { x: -30, y: 40, w: 65, h: 14, r: 5 },
    },
    /** Configuration for the main flame particle emitter */
    flameEmitter: {
      lifetime: { min: 2.0, max: 3.0 },
      frequency: 0.3,
      emitterLifetime: -1,
      particlesPerWave: 1,
      maxParticles: 8,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 0.8 },
                { time: 0.2, value: 1.0 },
                { time: 0.7, value: 0.5 },
                { time: 1, value: 0 },
              ],
            },
            minMult: 0.3,
            maxMult: 1.0,
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.3 },
                { time: 0.4, value: 0.7 },
                { time: 1, value: 0.15 },
              ],
            },
            minMult: 0.8,
            maxMult: 1.2,
          },
        },
        {
          type: "moveSpeed",
          config: {
            speed: {
              list: [
                { time: 0, value: 80 },
                { time: 1, value: 50 },
              ],
              isStepped: false,
            },
            minMult: 0.8,
            maxMult: 1.1,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: -90,
            max: -90,
          },
        },
        { type: "noRotation", config: {} },
        // TextureRandom behavior needs to be added dynamically in the scene
        // based on loaded textures.
        {
          type: "spawnShape",
          config: {
            type: "rect",
            data: {
              x: -12.5,
              y: -10,
              w: 25,
              h: 10,
            },
          },
        },
      ],
    } as EmitterConfigV3, // Cast to satisfy type, textureRandom added later
  },
} as const;
