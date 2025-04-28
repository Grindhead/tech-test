import { Container } from "pixi.js";

/**
 * Defines the common interface for all application scenes.
 * Each scene manages its own display objects within a dedicated container,
 * and implements lifecycle methods for initialization, updates, cleanup, and resizing.
 */
export interface BaseScene {
  /**
   * The main PixiJS container for all display objects rendered by this scene.
   * This container is added to/removed from the main application stage by the SceneManager.
   */
  container: Container;

  /**
   * Initializes the scene. Called once by the SceneManager when the scene becomes active.
   * Setup display objects, load scene-specific assets (if not preloaded),
   * and add event listeners here.
   */
  init(): void | Promise<void>; // Allow async init for potential asset loading

  /**
   * Updates the scene state. Called on every application tick (frame) while the scene is active.
   *
   * @param delta - The time elapsed since the last frame, in milliseconds (provided by app.ticker.deltaMS).
   */
  update(delta: number): void;

  /**
   * Cleans up the scene. Called once by the SceneManager when switching away from this scene.
   * Remove event listeners, stop timers/animations, and perform any other necessary cleanup
   * to prepare the scene for potential destruction or re-initialization.
   */
  destroy(): void;

  /**
   * Handles application resize events. Called by the SceneManager whenever the application viewport changes.
   * Adjust layout, rescale elements, and update positions based on the new dimensions.
   *
   * @param screenWidth - The new width of the renderer view.
   * @param screenHeight - The new height of the renderer view.
   */
  resize(screenWidth: number, screenHeight: number): void;
}
