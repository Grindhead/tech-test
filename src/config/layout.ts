import { uiConstants } from "./ui";

/** Layout configurations for different scenes and UI elements */
export const layoutConfig = {
  /** Layout constants for the MenuScene */
  menu: {
    /** Vertical position of the title */
    TITLE_Y_POSITION: 100,
    /** Starting vertical position for menu buttons */
    BUTTON_START_Y_POSITION: 220,
  },

  /** Layout constants for scenes with a back button */
  sceneWithBackButton: {
    /** Horizontal offset from left edge */
    X_OFFSET_FROM_LEFT: uiConstants.screenEdgePadding,
    /** Vertical offset from top edge */
    get Y_OFFSET_FROM_TOP(): number {
      // Assuming FPS counter text height is roughly 24px
      return uiConstants.screenEdgePadding + uiConstants.spacing;
    },
  },

  /** Layout constants for the global fullscreen button */
  fullscreenButton: {
    /** Horizontal offset from right edge */
    get X_OFFSET_FROM_RIGHT(): number {
      return uiConstants.screenEdgePadding;
    },
    /** Vertical offset from top edge */
    get Y_OFFSET_FROM_TOP(): number {
      // Use the same calculation as the back button Y offset
      return uiConstants.screenEdgePadding + uiConstants.spacing;
    },
  },

  /** Configuration for UI elements */
  elements: {
    /** Configuration for the FPS counter display */
    fpsCounter: {
      /** Vertical position from top */
      Y: uiConstants.padding,
    },
  },
} as const;
