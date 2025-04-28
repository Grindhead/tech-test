import { uiConstants } from "./ui";
import { textStyles } from "./textStyles";
import { buttonConfig } from "./buttons";
import { sceneConfig } from "./scenes";
import { layoutConfig } from "./layout";

/** Main application configuration object */
export const appConfig = {
  /** General UI constants */
  ui: uiConstants,
  /** Collection of predefined text styles */
  textStyles: textStyles,
  /** Configuration specific to scenes */
  scenes: sceneConfig,
  /** Configuration for Button components */
  buttons: buttonConfig,
  /** Layout constants for different scenes/contexts */
  layout: layoutConfig,
} as const;

// Re-export everything
export { uiConstants } from "./ui";
export { textStyles } from "./textStyles";
export { buttonConfig } from "./buttons";
export { sceneConfig } from "./scenes";
export { layoutConfig } from "./layout";
