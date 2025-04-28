import { TextStyle } from "pixi.js";
import { textStyles } from "./textStyles";

/** Base button configuration */
const baseButtonConfig = {
  DEFAULT_WIDTH: 250,
  DEFAULT_HEIGHT: 60,
  FILL_COLOR: 0x444444,
  HOVER_COLOR: 0x666666,
} as const;

/** Button configurations for different types of buttons */
export const buttonConfig = {
  /** Base configuration for standard Button components */
  base: {
    ...baseButtonConfig,
    TEXT_STYLE: (): Partial<TextStyle> => textStyles.BUTTON,
  },

  /** Configuration for buttons used in the main menu */
  menu: {
    WIDTH: baseButtonConfig.DEFAULT_WIDTH,
    HEIGHT: baseButtonConfig.DEFAULT_HEIGHT,
    FILL_COLOR: 0x0066cc,
    HOVER_COLOR: 0x0088ff,
    TEXT_STYLE: (): Partial<TextStyle> => textStyles.BUTTON,
    SPACING: 20,
  },

  /** Configuration for smaller buttons (e.g., Back button) */
  small: {
    WIDTH: 100,
    HEIGHT: 40,
    FILL_COLOR: baseButtonConfig.FILL_COLOR,
    HOVER_COLOR: baseButtonConfig.HOVER_COLOR,
    TEXT_STYLE: {
      fontFamily: textStyles.MAIN_FONT,
      fontSize: 16,
      fill: 0xffffff,
      align: "center",
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowAlpha: 0.4,
      dropShadowDistance: 2,
    } as Partial<TextStyle>,
  },

  /** Configuration for the fullscreen toggle button */
  fullscreen: {
    WIDTH: 120,
    HEIGHT: 40,
    FILL_COLOR: 0x555555,
    HOVER_COLOR: 0x777777,
    get TEXT_STYLE(): Partial<TextStyle> {
      return { ...textStyles.BUTTON, fontSize: 16 };
    },
  },
} as const;
