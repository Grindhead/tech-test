import { Container, Graphics, Text, Assets, Texture } from "pixi.js";
import { BaseScene } from "./BaseScene";
import { appConfig } from "../config/index";
import { SceneManager } from "./SceneManager";
import { assetManifest } from "../assets";
import { MenuScene } from "./MenuScene";
import { AssetCache } from "../AssetCache";

// Reuse interfaces from AssetCache or define locally if preferred
// Assuming interfaces are exported from AssetCache or defined globally
interface Emoji {
  name: string;
  url: string;
}
interface AvatarData {
  name: string;
  url: string;
  position: "left" | "right";
}

/**
 * Represents the asset preloader scene.
 * Displays a loading bar and text while loading essential assets.
 * Transitions to the main menu scene upon completion.
 */
export class PreloaderScene implements BaseScene {
  /** The main container for all visual elements in this scene. */
  public container: Container;
  /** The graphics object representing the loading progress bar fill. */
  private loadingBar: Graphics | null = null;
  /** The text object displaying the loading progress percentage. */
  private loadingText: Text | null = null;
  private readonly BAR_WIDTH = 300;
  private readonly BAR_HEIGHT = 30;
  /** The scene manager instance for handling scene transitions. */
  public sceneManager: SceneManager;

  /**
   * Creates an instance of PreloaderScene.
   * @param {SceneManager} sceneManager - The scene manager instance.
   */
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.setupUI();
  }

  /**
   * Sets up the UI elements for the preloader (background bar, progress bar, text).
   */
  private setupUI(): void {
    const bgBar = new Graphics();
    bgBar.beginFill(0x333333);
    bgBar.drawRect(0, 0, this.BAR_WIDTH, this.BAR_HEIGHT);
    bgBar.endFill();
    bgBar.x = -this.BAR_WIDTH / 2;
    bgBar.y = 0;
    this.container.addChild(bgBar);

    this.loadingBar = new Graphics();
    this.loadingBar.x = -this.BAR_WIDTH / 2;
    this.loadingBar.y = 0;
    this.container.addChild(this.loadingBar);

    this.loadingText = new Text(
      "Loading... 0%",
      appConfig.textStyles.LOADING_TEXT
    );
    this.loadingText.anchor.set(0.5, 0);
    this.loadingText.x = 0;
    this.loadingText.y = this.BAR_HEIGHT + appConfig.ui.spacing; // Use UI_SPACING from config
    this.container.addChild(this.loadingText);
  }

  /**
   * Updates the visual progress of the loading bar and text.
   * @param {number} progress - The loading progress (0 to 1).
   */
  public updateProgress(progress: number): void {
    const fillWidth = this.BAR_WIDTH * progress;

    if (this.loadingBar) {
      this.loadingBar.clear();
      this.loadingBar.beginFill(0x00ff00);
      this.loadingBar.drawRect(0, 0, fillWidth, this.BAR_HEIGHT);
      this.loadingBar.endFill();
    }

    if (this.loadingText) {
      this.loadingText.text = `Loading... ${Math.round(progress * 100)}%`;
    }
  }

  /**
   * Initializes the scene asynchronously.
   * Starts the asset loading process and updates the progress UI.
   * Transitions to the MenuScene upon successful load, or shows an error.
   * @returns {Promise<void>} A promise that resolves when initialization and loading are complete or fail.
   */
  public async init(): Promise<void> {
    this.updateProgress(0);

    try {
      await Assets.init({ manifest: assetManifest });

      await Assets.loadBundle("essential", (progress) => {
        this.updateProgress(progress);
      });

      // Add custom loading for Magic Words data and assets
      await this.loadMagicWordsAssets();

      // --- Check for Magic Words loading errors ---
      if (AssetCache.magicWordsError) {
        console.error(
          "Error loading Magic Words assets:",
          AssetCache.magicWordsError
        );
        if (this.loadingText) {
          this.loadingText.text = `Error loading Magic Words: ${AssetCache.magicWordsError.message}`;
          // Optionally prevent transition or show a specific error state
          return; // Stop further execution if Magic Words failed
        }
      }
      // -----------------------------------------

      this.sceneManager.changeScene(MenuScene);
    } catch (error) {
      console.error("Error loading assets:", error);
      if (this.loadingText) {
        this.loadingText.text = "Error loading assets!";
      }
    }
  }

  /** Scene update method (unused for static preloader). */
  public update(_delta: number): void {}

  /** Scene destroy method. */
  public destroy(): void {
    // Consider if cleanup of AssetCache is needed here or elsewhere
    // e.g., AssetCache.resetMagicWordsAssets(); if you want to clear on exiting preloader
    this.loadingBar = null;
    this.loadingText = null;
    // Destroy the container and its children
    this.container.destroy({ children: true });
  }

  /**
   * Handles application resize events.
   * Centers the preloader UI elements on the screen.
   * @param {number} screenWidth - The new width of the renderer.
   * @param {number} screenHeight - The new height of the renderer.
   */
  public resize(screenWidth: number, screenHeight: number): void {
    this.container.x = screenWidth / 2;
    this.container.y = screenHeight / 2 - this.BAR_HEIGHT / 2;
  }

  /**
   * Loads the dialogue data and associated textures for the Magic Words scene.
   * Stores the loaded assets in the AssetCache.
   * Handles potential errors during fetching or loading.
   * @returns {Promise<void>} A promise that resolves when loading is complete or fails.
   */
  private async loadMagicWordsAssets(): Promise<void> {
    if (this.loadingText) this.loadingText.text = "Loading Dialogue Data...";
    this.updateProgress(0.9); // Arbitrary progress update

    try {
      // 1. Fetch Dialogue Data
      const response = await fetch(appConfig.scenes.magicWords.API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const dialogueData = await response.json();
      AssetCache.magicWordsData = dialogueData; // Store data

      if (this.loadingText) this.loadingText.text = "Loading Emojis...";
      this.updateProgress(0.92);

      // 2. Load Emoji Assets
      await this.loadEmojiTextures();

      if (this.loadingText) this.loadingText.text = "Loading Avatars...";
      this.updateProgress(0.96);

      // 3. Load Avatar Assets
      await this.loadAvatarTextures();

      if (this.loadingText) this.loadingText.text = "Assets Loaded.";
      this.updateProgress(1);
    } catch (error) {
      console.error("Failed to load Magic Words assets:", error);
      AssetCache.magicWordsError =
        error instanceof Error ? error : new Error(String(error));
      // Error is stored in AssetCache, will be checked in init()
    }
  }

  /** Helper to load emoji textures into AssetCache */
  private async loadEmojiTextures(): Promise<void> {
    const loadEmojiTexture = async (emoji: Emoji): Promise<boolean> => {
      let objectURLString: string | null = null;
      try {
        console.log(`Loading emoji: ${emoji.name} from URL: ${emoji.url}`);
        const response = await fetch(emoji.url, {
          // Add cache control to prevent browser caching issues
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        // Check if blob is valid
        if (blob.size === 0) {
          throw new Error("Received empty blob");
        }

        // Create the object URL from the blob
        objectURLString = URL.createObjectURL(blob);
        AssetCache.addBlobUrl(objectURLString);

        // Create a proper Promise that resolves when the texture is fully loaded
        const texture = await new Promise<Texture>((resolve, reject) => {
          const texture = Texture.from(objectURLString!); // Use non-null assertion as we know it's not null here

          // Check if texture is already loaded
          if (texture.valid) {
            resolve(texture);
            return;
          }

          // Set up event listeners for loading completion
          texture.once("update", () => resolve(texture));
          texture.once("error", (err) => reject(err));

          // Set timeout as fallback
          const timeout = setTimeout(() => {
            reject(new Error("Texture loading timed out"));
          }, 10000);

          // Clear timeout if texture loads or errors
          texture.once("update", () => clearTimeout(timeout));
          texture.once("error", () => clearTimeout(timeout));
        });

        // Store with the full emoji name as key (including colons)
        AssetCache.emojiTextures[emoji.name] = texture;
        console.log(
          `Successfully loaded emoji: ${emoji.name} (${texture.width}x${texture.height})`
        );
        return true;
      } catch (fetchError) {
        console.error(`Failed to load emoji ${emoji.name}:`, fetchError);
        if (objectURLString) {
          AssetCache.removeBlobUrl(objectURLString);
          URL.revokeObjectURL(objectURLString);
        }
        return false;
      }
    };

    console.log("Starting emoji loading process...");

    // 1. Get defined emojis from API
    const definedEmojis = AssetCache.magicWordsData?.emojies || [];
    const definedEmojiMap = new Map<string, Emoji>();
    definedEmojis.forEach((e) => definedEmojiMap.set(e.name, e));
    console.log("Defined emojis from API:", Array.from(definedEmojiMap.keys()));

    // 2. Extract unique emoji names from dialogue text
    const dialogueEmojis = new Set<string>();
    const emojiRegex = /:([a-zA-Z0-9_]+):/g;
    AssetCache.magicWordsData?.dialogue.forEach((line) => {
      let match;
      while ((match = emojiRegex.exec(line.text)) !== null) {
        dialogueEmojis.add(match[0]); // Add the full name with colons
      }
    });
    console.log("Emojis found in dialogue text:", Array.from(dialogueEmojis));

    // 3. Combine and get unique list of all required emojis
    const allEmojiNames = new Set<string>([
      ...definedEmojiMap.keys(),
      ...dialogueEmojis,
    ]);
    console.log("Total unique emojis required:", Array.from(allEmojiNames));

    // 4. Create the final list of Emoji objects to load
    const emojisToLoad: Emoji[] = [];
    for (const name of allEmojiNames) {
      if (definedEmojiMap.has(name)) {
        // Use the definition from the API if available
        emojisToLoad.push(definedEmojiMap.get(name)!);
      } else {
        // Construct URL for emojis found only in dialogue
        const baseName = name.replace(/:/g, "");
        const seed = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        const constructedUrl = `https://api.dicebear.com/9.x/fun-emoji/png?seed=${seed}`;
        console.log(`Constructing URL for ${name}: ${constructedUrl}`);
        emojisToLoad.push({ name: name, url: constructedUrl });
      }
    }

    // 5. Load all emojis in parallel but grouped in larger batches
    // This balances loading speed with progress updates
    const batchSize = 10; // Increased batch size for faster loading
    let successfullyLoaded = 0;

    for (let i = 0; i < emojisToLoad.length; i += batchSize) {
      const batch = emojisToLoad.slice(i, i + batchSize);

      // Load batch in parallel
      const results = await Promise.all(batch.map(loadEmojiTexture));

      // Count successful loads
      const batchSuccesses = results.filter((result) => result).length;
      successfullyLoaded += batchSuccesses;

      // Update progress
      if (this.loadingText) {
        const progress = Math.min(
          100,
          Math.round(((i + batch.length) / emojisToLoad.length) * 100)
        );
        this.loadingText.text = `Loading Emojis... ${progress}% (${successfullyLoaded}/${emojisToLoad.length})`;
      }
    }

    // Verify all emojis were loaded correctly
    const loadedCount = Object.keys(AssetCache.emojiTextures).length;
    console.log(
      `Emoji loading complete. Loaded ${loadedCount}/${emojisToLoad.length} emojis`
    );

    // Pre-verify all textures to ensure they're ready
    for (const [name, texture] of Object.entries(AssetCache.emojiTextures)) {
      if (!texture.valid) {
        console.warn(`Texture for emoji ${name} is not fully loaded!`);
      }
    }

    // Force a small delay to ensure all textures are fully processed by the GPU
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /** Helper to load avatar textures and positions into AssetCache */
  private async loadAvatarTextures(): Promise<void> {
    const loadAvatarTexture = async (avatar: AvatarData): Promise<void> => {
      let objectURL: string | null = null; // Declare outside try block
      try {
        const response = await fetch(avatar.url);
        const blob = await response.blob();
        objectURL = URL.createObjectURL(blob); // Assign inside try block
        AssetCache.addBlobUrl(objectURL); // Store URL centrally using public method
        const texture = await Texture.fromURL(objectURL);
        AssetCache.avatarTextures[avatar.name] = texture;
        AssetCache.avatarPositions[avatar.name] = avatar.position;
      } catch (fetchError) {
        console.warn(`Failed to load avatar ${avatar.name}:`, fetchError);
        // Optionally add placeholder or skip
        // Remove the potentially failed URL using the public method
        if (objectURL) {
          AssetCache.removeBlobUrl(objectURL);
          URL.revokeObjectURL(objectURL); // Also revoke immediately on failure
        }
      }
    };

    const avatarTexturePromises =
      AssetCache.magicWordsData?.avatars?.map(loadAvatarTexture) ?? [];
    await Promise.all(avatarTexturePromises);
  }
}
