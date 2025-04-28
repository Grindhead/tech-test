import { Sprite, Texture } from "pixi.js";
import { AvatarData } from "./types";

/**
 * Manages the creation and positioning of character avatar sprites within dialogue lines.
 * Uses preloaded avatar textures and configuration for size and padding.
 */
export class AvatarManager {
  /** A map storing the preloaded avatar textures, keyed by avatar name (usually character name). */
  private avatarTextures: Record<string, Texture>;
  /** The target size (width and height) for avatar sprites in pixels. */
  private readonly avatarSize: number;
  /** The padding space around the avatar sprite in pixels. */
  private readonly avatarPadding: number;

  /**
   * Creates an instance of AvatarManager.
   *
   * @param avatarTextures - A record mapping avatar names to their preloaded PixiJS Textures.
   * @param avatarSize - The desired size (width & height) for the avatar sprites.
   * @param avatarPadding - The padding to apply around the avatar when positioning.
   */
  constructor(
    avatarTextures: Record<string, Texture>,
    avatarSize: number,
    avatarPadding: number
  ) {
    this.avatarTextures = avatarTextures || {}; // Ensure it's an object
    this.avatarSize = avatarSize;
    this.avatarPadding = avatarPadding;
  }

  /**
   * Creates an avatar {@link Sprite} based on the provided avatar data.
   * Looks up the texture using the `avatarData.name`.
   *
   * @param avatarData - An object containing the avatar's name and desired position.
   * @returns A PixiJS {@link Sprite} instance if the texture is found, otherwise `null`.
   */
  public createAvatarSprite(avatarData: AvatarData): Sprite | null {
    // Find the texture using the name specified in the avatar data
    const texture = this.avatarTextures[avatarData.name];
    if (!texture || texture === Texture.EMPTY) {
      console.warn(
        `AvatarManager: Texture not found for avatar name: ${avatarData.name}`
      );
      return null; // Return null if texture is missing
    }

    // Create and configure the sprite
    try {
      const sprite = new Sprite(texture);
      sprite.width = this.avatarSize;
      sprite.height = this.avatarSize;
      sprite.name = `avatar_${avatarData.name}`; // Assign a name for debugging/identification
      return sprite;
    } catch (error) {
      console.error(
        `AvatarManager: Failed to create sprite for avatar ${avatarData.name}:`,
        error
      );
      return null; // Return null on sprite creation error
    }
  }

  /**
   * Positions an avatar sprite within a line container based on the specified side.
   *
   * @param avatar - The avatar {@link Sprite} to position.
   * @param position - Whether to position the avatar on the "left" or "right" side of the line.
   * @param containerWidth - The total width of the container the avatar is being placed in.
   * @param lineHeight - The height of the current dialogue line (used for vertical centering).
   */
  public positionAvatar(
    avatar: Sprite,
    position: "left" | "right",
    containerWidth: number,
    lineHeight: number
  ): void {
    // Calculate X position based on side
    if (position === "left") {
      avatar.x = this.avatarPadding; // Position near the left edge
    } else {
      // Position near the right edge
      avatar.x = containerWidth - this.avatarSize - this.avatarPadding;
    }

    // Calculate Y position to vertically center the avatar within the line height
    avatar.y = (lineHeight - this.avatarSize) / 2; // Center vertically relative to line height
    // Consider adding top padding as well if needed: avatar.y = this.avatarPadding + (lineHeight - this.avatarSize) / 2;
  }

  /**
   * Calculates the horizontal space offset required to accommodate an avatar (including padding).
   * This is used by the line layout logic to reserve space for the avatar.
   *
   * @returns The total horizontal space (size + padding * 2) needed for an avatar.
   */
  public getAvatarOffset(): number {
    // Total horizontal space taken by an avatar is its size plus padding on both sides
    return this.avatarSize + this.avatarPadding * 2;
  }

  /**
   * Retrieves an avatar sprite for a given character name.
   * Creates a new sprite if a matching texture is found.
   *
   * @param name - The character name to get an avatar for.
   * @returns A new Sprite with the avatar texture if available, otherwise null.
   */
  public getAvatar(name: string): Sprite | null {
    // Check if a texture exists for this name
    const texture = this.avatarTextures[name];
    if (!texture || texture === Texture.EMPTY) {
      // Try with lowercase/uppercase variations
      const altTexture =
        this.avatarTextures[name.toLowerCase()] ||
        this.avatarTextures[name.toUpperCase()] ||
        this.avatarTextures[
          name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        ];

      if (!altTexture || altTexture === Texture.EMPTY) {
        // No texture found for this name
        return null;
      }

      // Use the alternative texture found
      try {
        const sprite = new Sprite(altTexture);
        sprite.width = this.avatarSize;
        sprite.height = this.avatarSize;
        return sprite;
      } catch (error) {
        console.error(`Failed to create avatar sprite for ${name}:`, error);
        return null;
      }
    }

    // Create and return a new sprite with the found texture
    try {
      const sprite = new Sprite(texture);
      sprite.width = this.avatarSize;
      sprite.height = this.avatarSize;
      return sprite;
    } catch (error) {
      console.error(`Failed to create avatar sprite for ${name}:`, error);
      return null;
    }
  }
}
