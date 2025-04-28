import "./style.css";
import {
  Application,
  extensions,
  AccessibilityManager,
  // Container, // Removed
  // FederatedPointerEvent, // Removed
} from "pixi.js";
import { createFPSTracker } from "./ui/FPSTracker";
import { SceneManager } from "./scenes/SceneManager";
import { PreloaderScene } from "./scenes/PreloaderScene";
import { Button } from "./ui/Button";
import { appConfig } from "./config/index";

/**
 * Initializes the PixiJS application, sets up global UI elements (FPS tracker, fullscreen button),
 * manages scenes, and handles resizing.
 * @returns {Promise<void>} A promise that resolves when the application initialization is complete.
 */
async function initApp() {
  // Disable the accessibility manager
  extensions.remove(AccessibilityManager);

  const app = new Application<HTMLCanvasElement>({
    background: "#1099bb",
    resizeTo: window,
    antialias: true,
    autoDensity: true,
  });

  app.stage.sortableChildren = true;

  document.body.appendChild(app.view);

  createFPSTracker(app);

  let isFullscreen = !!document.fullscreenElement;
  const fullscreenButton = new Button({
    text: isFullscreen ? "Windowed" : "Fullscreen",
    width: appConfig.buttons.fullscreen.WIDTH,
    height: appConfig.buttons.fullscreen.HEIGHT,
    fillColor: appConfig.buttons.fullscreen.FILL_COLOR,
    hoverColor: appConfig.buttons.fullscreen.HOVER_COLOR,
    textStyle: appConfig.buttons.fullscreen.TEXT_STYLE,
    onClick: toggleFullscreen,
  });
  fullscreenButton.zIndex = 1;
  app.stage.addChild(fullscreenButton);

  /**
   * Positions the fullscreen button at the top-right corner of the screen.
   */
  function positionFullscreenButton() {
    fullscreenButton.x =
      app.renderer.width -
      fullscreenButton.getWidth() / 2 -
      appConfig.layout.fullscreenButton.X_OFFSET_FROM_RIGHT;
    fullscreenButton.y =
      appConfig.layout.fullscreenButton.Y_OFFSET_FROM_TOP +
      fullscreenButton.getHeight() / 2;
  }

  /**
   * Updates the text of the fullscreen button based on the current fullscreen state.
   */
  function updateFullscreenButtonText() {
    isFullscreen = !!document.fullscreenElement;
    fullscreenButton.setText(isFullscreen ? "Windowed" : "Fullscreen");
  }

  /**
   * Toggles the browser's fullscreen mode and updates the button text accordingly.
   * @returns {Promise<void>} A promise that resolves when the fullscreen state change is complete.
   */
  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        isFullscreen = false;
      }
    }
    updateFullscreenButtonText();
  }

  document.addEventListener("fullscreenchange", updateFullscreenButtonText);

  const sceneManager = new SceneManager(app);

  sceneManager.changeScene(PreloaderScene);
  positionFullscreenButton(); // Initial position

  app.ticker.add(() => {
    sceneManager.update(app.ticker.deltaMS);
  });

  app.renderer.on("resize", () => {
    sceneManager.resize();
    positionFullscreenButton();
  });
}

initApp();
