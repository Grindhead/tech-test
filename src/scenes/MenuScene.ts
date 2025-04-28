import { Container, Text } from "pixi.js";
import { SceneManager, SceneConstructor } from "./SceneManager";
import { Button } from "../ui/Button";
import { appConfig } from "../config/index";
import { PhoenixFlameScene } from "./PhoenixFlameScene";
import { MagicWordsScene } from "./MagicWordsScene";
import { AceOfShadowsScene } from "./AceOfShadowsScene";
import { BaseScene } from "./BaseScene";

/**
 * Represents the main menu scene of the application.
 * Allows navigation to different game scenes.
 */
export class MenuScene implements BaseScene {
  // --- Properties ---
  /** The Pixi container holding all visual elements of the scene */
  public container = new Container();
  /** The scene manager instance for handling scene transitions */
  private sceneManager: SceneManager;
  /** The title text element */
  private titleText: Text | null = null;
  /** Array to hold the menu buttons */
  private buttons: Button[] = [];
  /** Reference to the resize listener function */
  private resizeListener: (() => void) | null = null;

  /** Array defining the buttons to be displayed on the menu */
  private readonly buttonConfigs: {
    label: string;
    sceneKey: SceneConstructor;
  }[];

  // --- Constructor ---
  /**
   * Creates an instance of MenuScene.
   * @param sceneManager - The scene manager instance.
   */
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;

    // Define button configurations with Scene classes
    this.buttonConfigs = [
      { label: "Start Phoenix Flame", sceneKey: PhoenixFlameScene },
      { label: "Start Magic Words", sceneKey: MagicWordsScene },
      { label: "Start Ace of Shadows", sceneKey: AceOfShadowsScene },
    ];
  }

  // --- Scene Lifecycle Methods ---
  /**
   * Initializes the scene, setting up UI elements and listeners.
   * Called when the scene becomes active.
   */
  public init(): void {
    this.setupUI();
  }

  /**
   * Updates the scene state.
   * This method is called on every frame by the SceneManager's update loop.
   * The menu scene currently has no dynamic elements requiring per-frame updates.
   * @param _delta - The time elapsed since the last frame (in milliseconds or seconds, depending on the ticker configuration).
   */
  public update(_delta: number): void {
    // No update logic needed for a static menu
  }

  /**
   * Cleans up resources used by the menu scene.
   * This method is called by the SceneManager when switching away from this scene.
   * It destroys the PIXI display objects created for the UI to free up memory.
   */
  public destroy(): void {
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
      this.resizeListener = null;
    }
    this.titleText?.destroy();
    this.buttons.forEach((button) => button.destroy());
    this.buttons = [];
    this.container.destroy({ children: true });
  }

  // --- UI Setup ---
  /**
   * Sets up the UI elements for the menu scene, including the title and buttons.
   */
  private setupUI(): void {
    this.titleText = new Text("Main Menu", appConfig.textStyles.SCENE_TITLE);
    this.titleText.anchor.set(0.5);
    this.container.addChild(this.titleText);

    this.buttonConfigs.forEach((config) => {
      const button = new Button({
        text: config.label,
        width: appConfig.buttons.menu.WIDTH,
        height: appConfig.buttons.menu.HEIGHT,
        fillColor: appConfig.buttons.menu.FILL_COLOR,
        hoverColor: appConfig.buttons.menu.HOVER_COLOR,
        textStyle: appConfig.buttons.menu.TEXT_STYLE(),
        onClick: () => this.sceneManager.changeScene(config.sceneKey),
      });
      this.buttons.push(button);
      this.container.addChild(button);
    });
  }

  // --- Resizing Logic ---
  /**
   * Adjusts the layout of scene elements based on the new screen dimensions.
   * @param appWidth - The new width of the application screen.
   * @param appHeight - The new height of the application screen.
   */
  public resize(appWidth: number, _appHeight: number): void {
    if (this.titleText) {
      this.titleText.x = appWidth / 2;
      this.titleText.y = appConfig.layout.menu.TITLE_Y_POSITION;
    }

    let currentY = appConfig.layout.menu.BUTTON_START_Y_POSITION;

    this.buttons.forEach((button) => {
      button.x = appWidth / 2;
      button.y = currentY;
      currentY += button.height + appConfig.buttons.menu.SPACING;
    });
  }
}
