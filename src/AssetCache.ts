import { Texture } from "pixi.js";

// --- Interfaces for Magic Words API Data Structure ---
// These mirror the structure expected from the API response
// and are used within the AssetCache and related components.

/**
 * Represents an emoji asset definition, including its name used in text
 * and the URL from which its image can be loaded.
 */
interface Emoji {
  /** The unique name or identifier for the emoji (e.g., ":smile:"). */
  name: string;
  /** The URL pointing to the emoji image resource. */
  url: string;
}

/**
 * Represents a single line of dialogue within the Magic Words scene data,
 * containing the speaker's name and the text content.
 */
interface DialogueLine {
  /** The name of the character speaking the line. */
  name: string;
  /** The text content of the dialogue line, potentially including emoji names. */
  text: string;
}

/**
 * Represents the data associated with a character avatar, including its name,
 * image URL, and designated position on the screen relative to the dialogue.
 */
interface AvatarData {
  /** The name of the character associated with the avatar (usually matches a `DialogueLine.name`). */
  name: string;
  /** The URL pointing to the avatar image resource. */
  url: string;
  /** The designated screen side ('left' or 'right') for displaying the avatar. */
  position: "left" | "right";
}

/**
 * Defines the complete data structure expected to be loaded for the Magic Words scene.
 * Contains arrays of emojis, dialogue lines, and optional avatar data.
 */
interface MagicWordsData {
  /** An array of {@link Emoji} objects defining the available emojis and their image URLs. */
  emojies: Emoji[];
  /** An array of {@link DialogueLine} objects representing the sequence of the conversation. */
  dialogue: DialogueLine[];
  /** An optional array of {@link AvatarData} objects defining character avatars. */
  avatars?: AvatarData[];
}

// --- AssetCache Class ---

/**
 * A static utility class acting as a central cache for assets specifically loaded
 * for the Magic Words scene. It provides static properties to store the fetched dialogue data,
 * loaded PixiJS {@link Texture} objects for emojis and avatars, and avatar positioning information.
 *
 * It also includes functionality to track and clean up temporary object URLs created
 * during asset loading (e.g., from blobs) and to manage any errors encountered during the process.
 *
 * **Note:** This class uses static properties, implying a singleton-like behavior for the cache.
 * Ensure proper state management (e.g., using `resetMagicWordsAssets`) if assets need to be reloaded.
 */
export class AssetCache {
  /**
   * Cached data structure containing dialogue, emojis, and avatars fetched from the Magic Words API.
   * It's `null` if the data hasn't been loaded or if an error occurred during loading.
   * @public
   * @static
   * @type {MagicWordsData | null}
   */
  public static magicWordsData: MagicWordsData | null = null;

  /**
   * A map storing loaded emoji {@link Texture} objects, keyed by their respective emoji names (e.g., `":smile:"`).
   * Populated during the asset preloading phase.
   * @public
   * @static
   * @type {Record<string, Texture>}
   */
  public static emojiTextures: Record<string, Texture> = {};

  /**
   * A map storing loaded avatar {@link Texture} objects, keyed by their corresponding avatar/character names.
   * Populated during the asset preloading phase.
   * @public
   * @static
   * @type {Record<string, Texture>}
   */
  public static avatarTextures: Record<string, Texture> = {};

  /**
   * A map storing the designated screen position ('left' or 'right') for each avatar, keyed by avatar name.
   * Populated during the asset preloading phase based on `AvatarData`.
   * @public
   * @static
   * @type {Record<string, "left" | "right">}
   */
  public static avatarPositions: Record<string, "left" | "right"> = {};

  /**
   * An internal array storing object URLs created from blobs (e.g., fetched image data)
   * during the asset loading process. These URLs need explicit revocation to free up memory.
   * @private - Internal use for cleanup.
   * @static
   * @type {string[]}
   */
  private static loadedObjectUrls: string[] = [];

  /**
   * Stores any {@link Error} object encountered during the loading process of Magic Words assets.
   * It remains `null` if the loading process completed successfully.
   * Scenes can check this property to handle loading failures gracefully.
   * @public
   * @static
   * @type {Error | null}
   */
  public static magicWordsError: Error | null = null;

  /**
   * Adds a blob object URL to the internal tracking list.
   * This should be called by the asset loading logic whenever a temporary URL is created.
   *
   * @param {string} url - The object URL string to track.
   * @public
   * @static
   */
  public static addBlobUrl(url: string): void {
    this.loadedObjectUrls.push(url);
  }

  /**
   * Removes a specific blob object URL from the internal tracking list.
   * This should be called if an asset associated with the URL fails to load
   * or is no longer needed before the general cleanup.
   *
   * @param {string} url - The object URL string to remove and potentially revoke.
   * @public
   * @static
   */
  public static removeBlobUrl(url: string): void {
    const index = this.loadedObjectUrls.indexOf(url);
    if (index > -1) {
      this.loadedObjectUrls.splice(index, 1);
      // Consider revoking immediately, or rely on cleanupMagicWordsURLs
      // For simplicity here, we'll rely on the main cleanup.
      // If immediate revocation is needed: URL.revokeObjectURL(url);
      console.log(`AssetCache: Removed tracked URL: ${url}`);
    }
  }

  /**
   * Revokes all tracked object URLs created for Magic Words assets (emojis, avatars)
   * using `URL.revokeObjectURL()` and clears the internal tracking list.
   * This is crucial for preventing memory leaks and should be called when the assets
   * (and the URLs pointing to their blob data) are no longer needed.
   * @public
   * @static
   */
  public static cleanupMagicWordsURLs(): void {
    if (this.loadedObjectUrls.length > 0) {
      console.log(
        `AssetCache: Cleaning up ${this.loadedObjectUrls.length} object URLs.`
      );
      this.loadedObjectUrls.forEach(URL.revokeObjectURL);
      this.loadedObjectUrls = [];
    }
  }

  /**
   * Resets the entire cache state related to Magic Words assets.
   * This performs cleanup of object URLs via `cleanupMagicWordsURLs` and then clears
   * all cached data properties (dialogue data, textures, positions, error state) back to their initial empty/null states.
   * Useful for ensuring a clean slate before reloading assets or during application/scene shutdown.
   * @public
   * @static
   */
  public static resetMagicWordsAssets(): void {
    console.log("AssetCache: Resetting Magic Words assets.");
    this.cleanupMagicWordsURLs(); // Clean up URLs first
    // Reset all static data properties
    this.magicWordsData = null;
    this.emojiTextures = {};
    this.avatarTextures = {};
    this.avatarPositions = {};
    this.magicWordsError = null;
  }
}
