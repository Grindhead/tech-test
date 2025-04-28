import { Sprite, Text, Texture, TextStyle } from "pixi.js";

/**
 * Manages emoji textures and the creation of emoji display objects (Sprites).
 * Handles cases where an emoji texture might be missing or requires substitution,
 * providing a fallback text representation.
 */
export class EmojiManager {
  /** A map storing the preloaded emoji textures, keyed by their names (e.g., ":smile:"). */
  private emojiTextures: Record<string, Texture>;
  /** The target size (width and height) for emoji sprites in pixels. */
  private readonly emojiSize: number;
  /** The TextStyle to use for rendering fallback text when an emoji texture is missing. */
  private readonly missingEmojiStyle: Partial<TextStyle>;

  /**
   * Creates an instance of EmojiManager.
   *
   * @param emojiTextures - A record mapping emoji names to their preloaded PixiJS Textures.
   * @param emojiSize - The desired size (width & height) for the emoji sprites.
   * @param missingEmojiStyle - The TextStyle for fallback text when an emoji texture is unavailable.
   */
  constructor(
    emojiTextures: Record<string, Texture>,
    emojiSize: number,
    missingEmojiStyle: Partial<TextStyle>
  ) {
    this.emojiTextures = emojiTextures || {}; // Ensure it's an object even if null/undefined is passed
    this.emojiSize = emojiSize;
    this.missingEmojiStyle = missingEmojiStyle;
  }

  /**
   * Handles specific emoji name substitutions.
   * Supports emoji names both with and without colons.
   * Currently substitutes "affirmative" or "win" with "satisfied" if the latter exists.
   *
   * @param emojiName - The original emoji name from the dialogue text (with or without colons).
   * @returns The substituted emoji name, or the original name if no substitution rule applies.
   */
  private getSubstitutedEmojiName(emojiName: string): string {
    // Strip colons for the comparison if present
    const baseName = emojiName.replace(/:/g, "");

    // Handle specific substitutions based on available textures
    // Check both with and without colons in the textures map
    if (
      (baseName === "affirmative" || baseName === "win") &&
      (this.emojiTextures["satisfied"] || this.emojiTextures[":satisfied:"])
    ) {
      return "satisfied"; // Return the base substituted name
    }

    return baseName; // Return the base name (without colons)
  }

  /**
   * Creates a display object for a given emoji name.
   * Attempts to create a {@link Sprite} using the corresponding texture.
   * If the texture is missing or substitution fails, it returns a {@link Text} object
   * as a fallback, displaying the original emoji name within brackets.
   *
   * @param emojiName - The name of the emoji (e.g., ":smile:") to create an object for.
   * @returns A PixiJS {@link Sprite} if the texture is found, otherwise a PixiJS {@link Text} fallback.
   */
  public createEmojiObject(emojiName: string): Sprite | Text {
    if (!emojiName) {
      console.warn(
        "EmojiManager: Empty emoji name provided to createEmojiObject."
      );
      // Return a generic placeholder for empty names
      return new Text("[?]", this.missingEmojiStyle);
    }

    // Try to use the emoji name directly with its colons intact first
    let texture = this.emojiTextures[emojiName];

    // If not found with exact name, try the substitution rules with base name
    if (!texture || texture === Texture.EMPTY) {
      // Extract base name only for substitution purposes
      const baseEmojiName = emojiName.replace(/:/g, "");
      if (!baseEmojiName) {
        console.warn(
          `EmojiManager: Could not extract base name from '${emojiName}'.`
        );
        return new Text(`[${emojiName}]`, this.missingEmojiStyle);
      }

      // Apply substitution rules
      const substitutedBaseName = this.getSubstitutedEmojiName(baseEmojiName);

      // Try using the substituted name with colons added back
      const substitutedName = `:${substitutedBaseName}:`;
      texture = this.emojiTextures[substitutedName];

      // Final fallback - try the base substituted name without colons
      if (!texture || texture === Texture.EMPTY) {
        texture = this.emojiTextures[substitutedBaseName];
      }
    }

    // Check if any texture lookup succeeded
    if (!texture || texture === Texture.EMPTY) {
      console.warn(`EmojiManager: Texture not found for emoji: '${emojiName}'`);
      return new Text(`[${emojiName}]`, this.missingEmojiStyle);
    }

    // Create the sprite with the found texture
    try {
      const sprite = new Sprite(texture);
      sprite.width = this.emojiSize;
      sprite.height = this.emojiSize;
      // Change anchor for proper vertical alignment with text
      // This centers the emoji vertically with the text baseline
      sprite.anchor.set(0, 0.5);

      // Debug information
      console.log(
        `Created emoji sprite for '${emojiName}' with size ${this.emojiSize}px`
      );
      return sprite;
    } catch (error) {
      console.error(
        `EmojiManager: Failed to create sprite for emoji '${emojiName}':`,
        error
      );
      return new Text(`[${emojiName}]`, this.missingEmojiStyle);
    }
  }

  /**
   * Gets the configured width for emoji sprites.
   * Assumes all emojis are rendered at the same size.
   *
   * @param _emojiName - The name of the emoji (currently unused, but kept for potential future variations).
   * @returns The configured width (and height) in pixels for emoji sprites.
   */
  public getEmojiWidth(_emojiName?: string): number {
    return this.emojiSize;
  }

  /**
   * Returns the internal map of emoji names to textures.
   * Used by the dialogue parser to identify valid emoji names.
   *
   * @returns The record mapping emoji names to their {@link Texture} objects.
   */
  public getTextures(): Record<string, Texture> {
    return this.emojiTextures || {};
  }
}
