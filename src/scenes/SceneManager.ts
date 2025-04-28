import { Application } from "pixi.js";
import { BaseScene } from "./BaseScene";

/**
 * Represents a constructor for a class that implements the BaseScene interface.
 *
 * @template T - A specific type extending BaseScene.
 * @param sceneManager - The SceneManager instance managing the scene lifecycle.
 * @param app - The PixiJS Application instance.
 * @returns An instance of the scene class T.
 */
export type SceneConstructor = new (
  sceneManager: SceneManager,
  app: Application
) => BaseScene;

/**
 * Manages the lifecycle and transitions of different scenes within the PixiJS application.
 * It handles initializing, updating, resizing, and destroying scenes.
 * Ensures only one scene is active and displayed at a time.
 */
export class SceneManager {
  /** The PixiJS Application instance associated with this manager. */
  private app: Application;
  /** The currently active scene instance, or null if no scene is active. */
  private currentScene: BaseScene | null = null;

  /**
   * Creates an instance of SceneManager.
   *
   * @param app - The PixiJS Application instance.
   */
  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Transitions to a new scene.
   * This method handles the destruction of the current scene (if any)
   * and the initialization and display of the new scene.
   *
   * @param NewSceneClass - The constructor of the scene class (must conform to SceneConstructor type) to switch to.
   * @example
   * // Assuming MenuScene is a valid scene class
   * sceneManager.changeScene(MenuScene);
   */
  public changeScene(NewSceneClass: SceneConstructor): void {
    // Destroy the current scene if it exists
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene.container);
      this.currentScene.destroy();
      this.currentScene = null; // Explicitly nullify
    }

    // Instantiate the new scene
    const newSceneInstance = new NewSceneClass(this, this.app);

    // Set the new scene
    this.currentScene = newSceneInstance;

    // Add the new scene's container to the stage
    if (this.currentScene) {
      this.currentScene.container.zIndex = 0; // Base layer for scenes
      this.app.stage.addChild(this.currentScene.container);

      // Call resize immediately to set initial position
      this.resize();

      // Initialize the new scene
      const initPromise = this.currentScene.init();
      if (initPromise instanceof Promise) {
        initPromise
          .then(() => {
            // Trigger resize *after* async init is complete
            this.resize();
          })
          .catch((error) => {
            console.error("Error initializing scene:", error);
            // Potentially handle the error, e.g., switch to an error scene
          });
      } else {
        // If init is synchronous, resize immediately
        this.resize();
      }
    }
  }

  /**
   * Updates the currently active scene.
   * This method should be called within the main application loop (ticker).
   * It delegates the update logic to the current scene's update method.
   *
   * @param delta - The time elapsed since the last frame, typically provided by the PixiJS ticker.
   *                Passed down to the current scene's update method.
   */
  public update(delta: number): void {
    if (this.currentScene) {
      this.currentScene.update(delta);
    }
  }

  /**
   * Notifies the currently active scene about a change in the application's dimensions.
   * This method should be called whenever the PixiJS renderer or view is resized.
   * It delegates the resize logic to the current scene's resize method, passing the new dimensions.
   */
  public resize(): void {
    if (this.currentScene) {
      this.currentScene.resize(
        this.app.renderer.width,
        this.app.renderer.height
      );
    }
  }
}
