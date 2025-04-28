import { Application, Text } from "pixi.js";
import { appConfig } from "../config/index";

/**
 * Creates and manages an FPS counter display, positioned top-left.
 * @param app - The PixiJS Application instance.
 */
export function createFPSTracker(app: Application): void {
  const fpsText = new Text("FPS: 0", appConfig.textStyles.FPS_COUNTER);

  // Set initial position to top-left with padding
  fpsText.anchor.set(0, 0); // Anchor to the top-left
  fpsText.x = appConfig.ui.screenEdgePadding; // Use padding for X
  fpsText.y = appConfig.layout.elements.fpsCounter.Y; // Use layout config for Y
  fpsText.zIndex = 200; // Increase zIndex significantly to ensure it's above other UI like back buttons
  app.stage.addChild(fpsText);

  // Update FPS text on each tick
  app.ticker.add(() => {
    fpsText.text = `FPS: ${app.ticker.FPS.toFixed(2)}`;
    // Position is static, no need to update X/Y here
  });

  // Update position on resize (only Y might need update if config changes, but X is fixed)
  app.renderer.on("resize", (_width: number) => {
    // X is now fixed based on padding, no need to update based on width
    fpsText.x = appConfig.ui.screenEdgePadding;
    // Y position is also fixed based on padding, but can be re-set for consistency
    fpsText.y = appConfig.layout.elements.fpsCounter.Y;
  });
}
