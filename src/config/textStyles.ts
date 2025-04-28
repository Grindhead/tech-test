import { TextStyle } from "pixi.js";

/** Base text styles configuration */
export const textStyles = {
  /** Main font family used throughout the application */
  MAIN_FONT: "Arial",

  /** Button text style */
  get BUTTON(): Partial<TextStyle> {
    return {
      fontFamily: this.MAIN_FONT,
      fontSize: 20,
      fill: 0xffffff,
      align: "center",
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowAlpha: 0.4,
      dropShadowDistance: 2,
    };
  },

  /** Dialogue text style */
  get DIALOGUE(): Partial<TextStyle> {
    return {
      fontFamily: this.MAIN_FONT,
      fontSize: 24,
      fill: 0xffffff,
      lineHeight: 1.3,
      wordWrap: true,
      letterSpacing: 0.5,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowAlpha: 0.5,
      dropShadowDistance: 1,
      padding: 4,
    };
  },

  /** Character dialogue text style */
  get DIALOGUE_CHAR(): Partial<TextStyle> {
    return {
      ...this.DIALOGUE,
      fontWeight: "bold",
      fontSize: 26,
      fill: 0xffdd99,
    };
  },

  /** FPS counter text style */
  get FPS_COUNTER(): Partial<TextStyle> {
    return {
      fontFamily: this.MAIN_FONT,
      fontSize: 24,
      fill: 0xffffff,
    };
  },

  /** Scene title text style */
  get SCENE_TITLE(): Partial<TextStyle> {
    return {
      fontFamily: this.MAIN_FONT,
      fontSize: 36,
      fill: 0xffffff,
      align: "center",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowDistance: 3,
    };
  },

  /** Error text style */
  get ERROR_TEXT(): Partial<TextStyle> {
    return {
      fontFamily: this.MAIN_FONT,
      fontSize: 18,
      fill: 0xff0000,
      wordWrap: true,
      align: "center",
    };
  },

  /** Loading text style */
  get LOADING_TEXT(): Partial<TextStyle> {
    return {
      fontFamily: this.MAIN_FONT,
      fontSize: 24,
      fill: 0xffffff,
    };
  },

  /** Missing emoji text style */
  get MISSING_EMOJI(): Partial<TextStyle> {
    return {
      ...this.DIALOGUE,
      fill: 0xaaaaaa,
      fontStyle: "italic",
    };
  },
} as const;
