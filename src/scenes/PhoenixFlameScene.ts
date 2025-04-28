import { Container, Texture, Text, Graphics } from "pixi.js";
import { BaseScene } from "./BaseScene";
import { SceneManager } from "./SceneManager";
import { Button } from "../ui/Button";
import { MenuScene } from "./MenuScene";
import { Emitter, EmitterConfigV3 } from "@pixi/particle-emitter";
import { appConfig } from "../config/index";

/**
 * Represents the "Phoenix Flame" scene.
 * Displays a particle emitter effect resembling a campfire.
 */
export class PhoenixFlameScene implements BaseScene {
  /** The main container for all visual elements in this scene. */
  public container: Container;
  private sceneManager: SceneManager;
  private backButton: Button | null = null;
  /** The main flame particle emitter. */
  private flameEmitter: Emitter | null = null;
  /** Container holding the fire effect (emitters, base) for easy positioning. */
  private fireContainer: Container | null = null;
  /** Text object displaying the current particle count (for debugging). */
  private particleCountText: Text | null = null;

  /**
   * Creates an instance of PhoenixFlameScene.
   * @param {SceneManager} sceneManager - The scene manager instance.
   */
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  /**
   * Initializes the scene asynchronously.
   * Sets up the back button, particle emitters, campfire base, and text elements.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  public async init(): Promise<void> {
    this.cleanup();

    // Back Button using config
    this.backButton = new Button({
      text: "< Back",
      width: appConfig.buttons.small.WIDTH,
      height: appConfig.buttons.small.HEIGHT,
      fillColor: appConfig.buttons.small.FILL_COLOR,
      hoverColor: appConfig.buttons.small.HOVER_COLOR,
      textStyle: appConfig.buttons.small.TEXT_STYLE,
      onClick: () => this.sceneManager.changeScene(MenuScene),
    });
    this.container.addChild(this.backButton);

    // Create container for fire (allows us to position it easily)
    this.fireContainer = new Container();
    this.container.addChild(this.fireContainer);

    // Add title text to describe the scene
    const title = new Text("Phoenix Flame", appConfig.textStyles.SCENE_TITLE);
    title.anchor.set(0.5, 0);
    title.y = appConfig.scenes.phoenixFlame.TITLE_Y_OFFSET;
    this.fireContainer.addChild(title);

    // Create campfire logs/base
    this.createCampfireBase();

    // Add particle count text for debugging
    this.particleCountText = new Text(
      "Particles: 0",
      appConfig.textStyles.DIALOGUE
    );
    this.particleCountText.anchor.set(0.5, 0);
    this.particleCountText.y =
      appConfig.scenes.phoenixFlame.PARTICLE_COUNT_TEXT_Y_OFFSET;
    this.fireContainer.addChild(this.particleCountText);

    // Get fire textures from the ALREADY LOADED atlas via Assets cache
    const fireTextures = appConfig.scenes.phoenixFlame.FIRE_TEXTURES.map(
      (name) => Texture.from(name)
    );

    // Check if textures are valid (were they in the loaded atlas?)
    const invalidTextures = fireTextures.filter(
      (t) => !t || t === Texture.EMPTY
    );
    if (invalidTextures.length > 0) {
      console.warn(
        "PhoenixFlameScene: Could not find some fire textures in the atlas. Ensure fire1-fire5 are loaded.",
        "Check textures: ",
        appConfig.scenes.phoenixFlame.FIRE_TEXTURES
      );
    }

    // Create main flame emitter configuration from config
    // Clone the config object to avoid potential mutation issues
    const flameEmitterConfig: EmitterConfigV3 = JSON.parse(
      JSON.stringify(appConfig.scenes.phoenixFlame.flameEmitter)
    );

    // Dynamically add the textureRandom behavior
    flameEmitterConfig.behaviors.push({
      type: "textureRandom",
      config: {
        textures: fireTextures,
      },
    });

    // Create emitters
    this.flameEmitter = new Emitter(this.fireContainer, flameEmitterConfig);

    // Start emitters
    this.flameEmitter.emit = true;

    // Position elements
    this.resize(
      this.sceneManager["app"].renderer.width,
      this.sceneManager["app"].renderer.height
    );
  }

  /**
   * Creates the visual base for the campfire (logs, embers).
   * Uses simple Graphics objects to draw rounded rectangles and circles.
   * Adds the graphics to the `fireContainer`.
   */
  private createCampfireBase(): void {
    if (!this.fireContainer) return;

    const logs = new Graphics();
    const baseConfig = appConfig.scenes.phoenixFlame.campfireBase;

    // Brown log on left
    logs.beginFill(baseConfig.LOG_BROWN);
    logs.drawRoundedRect(
      baseConfig.LOG_RECT_1.x,
      baseConfig.LOG_RECT_1.y,
      baseConfig.LOG_RECT_1.w,
      baseConfig.LOG_RECT_1.h,
      baseConfig.LOG_RECT_1.r
    );
    logs.endFill();
    logs.rotation = baseConfig.LOG_RECT_1.rotation;

    // Darker log on right
    logs.beginFill(baseConfig.LOG_DARK_BROWN);
    logs.drawRoundedRect(
      baseConfig.LOG_RECT_2.x,
      baseConfig.LOG_RECT_2.y,
      baseConfig.LOG_RECT_2.w,
      baseConfig.LOG_RECT_2.h,
      baseConfig.LOG_RECT_2.r
    );
    logs.endFill();

    logs.rotation = baseConfig.LOG_RECT_2.rotation;

    // Log on bottom
    logs.beginFill(baseConfig.LOG_LIGHT_BROWN);
    logs.drawRoundedRect(
      baseConfig.LOG_RECT_3.x,
      baseConfig.LOG_RECT_3.y,
      baseConfig.LOG_RECT_3.w,
      baseConfig.LOG_RECT_3.h,
      baseConfig.LOG_RECT_3.r
    );
    logs.endFill();

    // Create embers/coals
    const embers = new Graphics();
    embers.beginFill(baseConfig.EMBERS_ORANGE);
    embers.drawCircle(
      baseConfig.EMBER_POS_1.x,
      baseConfig.EMBER_POS_1.y,
      baseConfig.EMBER_RADIUS_1
    );
    embers.endFill();

    embers.beginFill(baseConfig.EMBERS_RED);
    embers.drawCircle(
      baseConfig.EMBER_POS_2.x,
      baseConfig.EMBER_POS_2.y,
      baseConfig.EMBER_RADIUS_2
    );
    embers.endFill();

    embers.beginFill(baseConfig.EMBERS_TOMATO);
    embers.drawCircle(
      baseConfig.EMBER_POS_3.x,
      baseConfig.EMBER_POS_3.y,
      baseConfig.EMBER_RADIUS_3
    );
    embers.endFill();

    // Glowing center
    const glow = new Graphics();
    glow.beginFill(baseConfig.GLOW_ORANGE, baseConfig.GLOW_ALPHA);
    glow.drawCircle(0, baseConfig.GLOW_Y_OFFSET, baseConfig.GLOW_RADIUS);
    glow.endFill();

    // Add elements to container
    this.fireContainer.addChild(logs);
    this.fireContainer.addChild(embers);
    this.fireContainer.addChild(glow);
  }

  /**
   * Updates the scene state each frame.
   * Updates the particle emitters and the particle count text.
   * @param {number} delta - Time elapsed since the last frame in milliseconds.
   */
  public update(delta: number): void {
    // Convert delta from milliseconds to seconds (required by particle emitter)
    const deltaSeconds = delta * 0.001;

    // Update emitters
    if (this.flameEmitter) {
      this.flameEmitter.update(deltaSeconds);
    }

    // Update particle count text
    if (this.particleCountText) {
      const count = this.flameEmitter?.particleCount;
      this.particleCountText.text = "Particles:" + count?.toString();
    }
  }

  /**
   * Internal helper to clean up existing emitters and text before re-initialization or destruction.
   */
  private cleanup(): void {
    if (this.flameEmitter) {
      // Emitter is added to fireContainer, so it gets destroyed when fireContainer does,
      // but destroying it explicitly first is safer in case it wasn't added correctly.
      this.flameEmitter.destroy();
      this.flameEmitter = null;
    }

    // Nullify references
    this.fireContainer = null;
    this.particleCountText = null;
    this.backButton = null;
  }

  /**
   * Cleans up the scene, destroying emitters and other objects.
   * Called when the scene is about to be replaced.
   */
  public destroy(): void {
    this.cleanup();
    // Destroy the main container and its children
    this.container.destroy({ children: true });
  }

  /**
   * Handles application resize events.
   * Repositions the back button and the fire container.
   * @param {number} screenWidth - The new width of the renderer.
   * @param {number} screenHeight - The new height of the renderer.
   */
  public resize(screenWidth: number, screenHeight: number): void {
    // Position back button using layout config
    if (this.backButton) {
      this.backButton.x =
        appConfig.layout.sceneWithBackButton.X_OFFSET_FROM_LEFT + // Use offset
        this.backButton.getWidth() / 2;
      this.backButton.y =
        appConfig.layout.sceneWithBackButton.Y_OFFSET_FROM_TOP + // Use offset
        this.backButton.getHeight() / 2;
    }

    // Center the fire container
    if (this.fireContainer) {
      this.fireContainer.x = screenWidth / 2;
      this.fireContainer.y = screenHeight / 2;
    }
  }
}
