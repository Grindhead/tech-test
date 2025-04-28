import { Container, Text, Texture, Application, Sprite } from "pixi.js";
import { BaseScene } from "./BaseScene";
import { SceneManager } from "./SceneManager";
import { Button } from "../ui/Button";
import { MenuScene } from "./MenuScene";
import { appConfig } from "../config/index"; // Import only appConfig
import { AssetCache } from "../AssetCache";
import { DialogueManager } from "../components/magic-words/DialogueManager";
import { DialogueStyles, DialogueLine } from "../components/magic-words/types";

// --- Interfaces for API Data Structure ---
// These define the expected shape of the data fetched from the API
// or loaded from the AssetCache for this scene.

/** Represents a single emoji definition from the API. */
interface Emoji {
  /** The identifier used in text (e.g., ":smile:"). */
  name: string;
  /** The URL from which to load the emoji texture. */
  url: string;
}

/** Represents avatar data from the API (optional). */
interface AvatarData {
  /** The name associated with the avatar (likely matches a character name). */
  name: string;
  /** The URL from which to load the avatar texture. */
  url: string;
  /** The side of the dialogue line where the avatar should appear. */
  position: "left" | "right";
}

/** Represents the complete data structure for the Magic Words scene. */
interface MagicWordsData {
  /** An array of available emoji definitions. */
  emojies: Emoji[];
  /** An array of dialogue lines making up the conversation. */
  dialogue: DialogueLine[];
  /** Optional array of avatar definitions. */
  avatars?: AvatarData[];
}

/**
 * Represents the "Magic Words" scene, displaying an interactive dialogue.
 * This scene fetches dialogue data (including lines, emoji, and optional avatars)
 * which is expected to be preloaded via {@link AssetCache}.
 * It uses the {@link DialogueManager} component to render the dialogue with a typing effect,
 * handle inline emojis and avatars, and enable scrolling.
 * Implements the {@link BaseScene} interface.
 */
export class MagicWordsScene implements BaseScene {
  /** The main PixiJS container for all display objects rendered by this scene. Added to the stage by SceneManager. */
  public container: Container;
  /** The {@link SceneManager} instance used for scene transitions. */
  private sceneManager: SceneManager;
  /** The PixiJS {@link Application} instance, providing access to renderer, ticker, etc. */
  private app: Application;
  /** The button used to navigate back to the main menu. */
  private backButton: Button | null = null;
  /** Temporary text element used to display loading messages or errors during initialization. */
  private loadingText: Text | null = null;
  /** The fetched and parsed dialogue data loaded from {@link AssetCache}. */
  private dialogueData: MagicWordsData | null = null;
  /** A map storing loaded emoji textures (from {@link AssetCache}), keyed by emoji name (e.g., ":smile:"). */
  private emojiTextures: Record<string, Texture> = {};
  /** A map storing loaded avatar textures (from {@link AssetCache}), keyed by avatar name. */
  private avatarTextures: Record<string, Texture> = {};

  /** The {@link DialogueManager} instance handling the display and interaction of the dialogue. */
  private dialogueManager: DialogueManager | null = null;

  /** The index of the current message being displayed */
  private currentMessageIndex: number = 0;

  /** The map to track avatar sprites by message index for proper updating */
  private messageAvatars: Map<number, Sprite> = new Map();

  /**
   * Creates an instance of MagicWordsScene.
   *
   * @param sceneManager - The {@link SceneManager} instance for handling scene transitions.
   * @param app - The PixiJS {@link Application} instance.
   */
  constructor(sceneManager: SceneManager, app: Application) {
    this.sceneManager = sceneManager;
    this.app = app;
    this.container = new Container();
    this.container.sortableChildren = true; // Enable zIndex sorting for UI layering
  }

  /**
   * Initializes the Magic Words scene asynchronously.
   * Sets up the back button and loading text.
   * Retrieves preloaded dialogue data and textures from {@link AssetCache}.
   * Initializes the {@link DialogueManager} with the data and configuration.
   * Adds the DialogueManager's container to the scene.
   * Handles potential errors during asset loading.
   *
   * @returns A Promise that resolves when initialization is complete, or rejects if essential assets are missing.
   * @throws An error if the dialogue data from AssetCache is missing or if an error occurred during preloading.
   */
  public async init(): Promise<void> {
    this.cleanup(); // Ensure a clean state
    this.dialogueData = null;
    this.messageAvatars = new Map(); // Reset avatar tracking

    // --- Back Button Setup ---
    this.backButton = new Button({
      text: "< Back",
      width: appConfig.buttons.small.WIDTH,
      height: appConfig.buttons.small.HEIGHT,
      fillColor: appConfig.buttons.small.FILL_COLOR,
      hoverColor: appConfig.buttons.small.HOVER_COLOR,
      textStyle: appConfig.buttons.small.TEXT_STYLE,
      onClick: () => this.sceneManager.changeScene(MenuScene),
    });
    this.backButton.zIndex = 5000; // Set a high z-index for UI elements to ensure they render above scene content
    this.container.addChild(this.backButton);

    // --- Loading Text Placeholder ---
    this.loadingText = new Text(
      "Initializing Scene...",
      appConfig.textStyles.LOADING_TEXT
    );
    this.loadingText.anchor.set(0.5);
    this.container.addChild(this.loadingText);

    // --- Initial Positioning (Loading Text & Button) ---
    this.resize(this.app.renderer.width, this.app.renderer.height);

    // --- Asset Loading Check ---
    // Check if AssetCache encountered an error during preloading for this scene
    if (AssetCache.magicWordsError) {
      this.showError("Failed to load dialogue assets.");
      throw AssetCache.magicWordsError; // Rethrow to signal failure to SceneManager
    }

    // Retrieve preloaded data and textures from AssetCache
    this.dialogueData = AssetCache.magicWordsData;
    this.emojiTextures = AssetCache.emojiTextures;
    this.avatarTextures = AssetCache.avatarTextures;

    // Validate essential data
    if (!this.dialogueData) {
      const errorMsg = "Magic Words data not found in AssetCache.";
      this.showError(errorMsg);
      throw new Error(errorMsg);
    }

    // Verify emoji textures
    this.verifyEmojiTextures();

    // Debug avatar textures to see what's available in the AssetCache
    this.debugAvatarTextures();

    // --- Modify dialogue data for sequential display ---
    // Create a copy of dialogue data without avatars for message display
    const initialDialogueData = {
      ...this.dialogueData,
      dialogue:
        this.dialogueData.dialogue.length > 0
          ? [this.dialogueData.dialogue[0]] // Start with only the first message
          : [],
      // Keep avatars in dialogue data for reference
      avatars: this.dialogueData.avatars,
    };

    // --- Dialogue Manager Setup ---
    // Create configuration object for dialogue styling and behavior
    const dialogueStyles: DialogueStyles = {
      textStyle: appConfig.textStyles.DIALOGUE,
      charTextStyle: appConfig.textStyles.DIALOGUE_CHAR,
      missingEmojiStyle: appConfig.textStyles.MISSING_EMOJI,
      emojiSize: appConfig.scenes.magicWords.EMOJI_SIZE,
      avatarSize: appConfig.scenes.magicWords.AVATAR_SIZE * 0.8, // Restore avatar size back to 80% of config size
      avatarPadding: 20, // Padding between avatar and message text
      lineSpacing: appConfig.scenes.magicWords.LINE_SPACING,
      dialoguePadding: appConfig.scenes.magicWords.DIALOGUE_PADDING,
      typingSpeed: appConfig.scenes.magicWords.TYPING_SPEED_CHARS_PER_SEC,
      emojiPosition: "inline", // Position emojis inline with text
    };

    // Initialize the DialogueManager component with the initial dialogue
    try {
      this.dialogueManager = new DialogueManager(
        this.app,
        initialDialogueData, // Use only the first message initially
        this.emojiTextures, // Keep emoji textures for inline emoji rendering
        this.avatarTextures, // Provide avatar textures
        dialogueStyles
      );

      // Start with message index at 0 (first message)
      this.currentMessageIndex = 0;
      // The DialogueManager will handle its own typing state.
      // this.readyForNextMessage = true; // Not needed
      // this.nextMessageTimer = 0; // Not needed
    } catch (error) {
      const errorMsg = "Failed to initialize DialogueManager.";
      console.error(errorMsg, error);
      this.showError(errorMsg);
      throw error; // Propagate error
    }

    // Add the DialogueManager's main container to the scene
    const dialogueContainer = this.dialogueManager.getContainer();
    dialogueContainer.zIndex = 10;
    this.container.addChild(dialogueContainer);

    // --- Cleanup Loading Text ---
    this.cleanupText(); // Remove the "Initializing..." text
  }

  /**
   * Verifies that emoji textures are properly loaded and logs their status.
   * This helps diagnose issues with emoji rendering. If required emojis are
   * missing, it will display an error message on screen.
   */
  private verifyEmojiTextures(): void {
    // Check if there's dialogue data and if it includes emoji definitions
    if (!this.dialogueData?.emojies || this.dialogueData.emojies.length === 0) {
      console.log("No emoji definitions found in dialogue data to verify.");
      return; // Nothing to verify
    }

    console.log("Verifying emoji textures...");
    const definedCount = this.dialogueData.emojies.length;
    console.log(`Defined emojis in data: ${definedCount}`);
    const loadedCount = Object.keys(this.emojiTextures).length;
    console.log(`Loaded emoji textures: ${loadedCount}`);

    // Identify any emojis defined in the data that don't have a loaded texture
    const missingEmojis: string[] = [];
    this.dialogueData.emojies.forEach((emoji) => {
      if (!this.emojiTextures[emoji.name]) {
        missingEmojis.push(emoji.name);
      }
    });

    // If missing textures are found, report the error
    if (missingEmojis.length > 0) {
      const errorMsg = `Missing textures for required emojis: ${missingEmojis.join(
        ", "
      )}`;
      console.error(errorMsg); // Log a detailed error to the console
      // Display a user-facing error message on the screen
      this.showError(
        `Error: Missing ${missingEmojis.length} emoji texture(s).`
      );
      // Optional: Halt scene initialization if emojis are critical
      // throw new Error(errorMsg);
    } else {
      console.log("All defined emoji textures loaded successfully!");
    }

    // Log all available emoji names for debugging purposes
    console.log(
      "Available emoji texture names:",
      Object.keys(this.emojiTextures)
    );
  }

  /**
   * Updates the scene state on each frame.
   * Delegates the update logic to the {@link DialogueManager} to handle typing animation and scrolling.
   * Also manages the sequential display of messages.
   *
   * @param deltaMS - Elapsed time since the last update in milliseconds.
   */
  public update(deltaMS: number): void {
    // Delegate update logic to the DialogueManager for the current message
    this.dialogueManager?.update(deltaMS);

    // Handle sequential message display by appending
    if (this.dialogueData && this.dialogueManager) {
      // Check if the current message is fully typed AND there are more messages to show
      if (
        this.dialogueManager.IsTypingComplete && // Check manager's state
        this.currentMessageIndex < this.dialogueData.dialogue.length - 1
      ) {
        // Move to the next message index
        this.currentMessageIndex++;

        // Get the next message data
        const nextMessage =
          this.dialogueData.dialogue[this.currentMessageIndex];

        // Append the next message to the dialogue manager
        if (nextMessage) {
          this.dialogueManager.appendMessage(nextMessage);
          // DialogueManager's appendMessage now handles resetting typing state and scrolling
        }

        // Optional: Add a slight delay *before* appending the next message if desired
        // This would require a separate timer mechanism, but avoids the complexity
        // of the previous readyForNextMessage flag. For now, messages append immediately
        // after the previous one finishes typing.
      }
    }
  }

  /**
   * Handles application resize events.
   * Repositions the back button and any loading/error text.
   * Notifies the {@link DialogueManager} of the resize so it can update its layout and mask.
   *
   * @param screenWidth - The new screen width in pixels.
   * @param screenHeight - The new screen height in pixels.
   */
  public resize(screenWidth: number, screenHeight: number): void {
    // Reposition loading/error text if visible
    if (this.loadingText) {
      this.loadingText.x = screenWidth / 2;
      this.loadingText.y = screenHeight / 2;
    }

    // Reposition the back button based on layout config (standardized with other scenes)
    if (this.backButton) {
      this.backButton.x =
        appConfig.layout.sceneWithBackButton.X_OFFSET_FROM_LEFT +
        this.backButton.getWidth() / 2; // Center pivot offset
      this.backButton.y =
        appConfig.layout.sceneWithBackButton.Y_OFFSET_FROM_TOP +
        this.backButton.getHeight() / 2; // Center pivot offset
    }

    // Notify the DialogueManager about the resize
    // DialogueManager is responsible for updating its internal layout (mask, text wrapping etc.)
    if (this.dialogueManager) {
      this.dialogueManager.resize(screenWidth, screenHeight);
    }
  }

  /**
   * Displays an error message in the center of the screen using the loadingText element.
   * @param message - The error message to display.
   */
  private showError(message: string): void {
    if (!this.loadingText) {
      // Create if it was already cleaned up
      this.loadingText = new Text(message, appConfig.textStyles.ERROR_TEXT);
      this.loadingText.anchor.set(0.5);
      this.container.addChild(this.loadingText);
    } else {
      // Reuse existing text element
      this.loadingText.style = appConfig.textStyles.ERROR_TEXT;
      this.loadingText.text = message;
    }
    this.resize(this.app.renderer.width, this.app.renderer.height);
    console.error("MagicWordsScene Error:", message);
  }

  /**
   * Removes and destroys the loading/error text element if it exists.
   */
  private cleanupText(): void {
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = null;
    }
  }

  /**
   * Cleans up resources specific to this scene instance before initialization or destruction.
   * Destroys the back button and the dialogue manager.
   */
  private cleanup(): void {
    this.cleanupText(); // Remove loading/error text

    // Destroy button
    this.backButton?.destroy();
    this.backButton = null;

    // Clean up avatar sprites
    this.messageAvatars.forEach((sprite) => {
      if (sprite && !sprite.destroyed) {
        sprite.destroy();
      }
    });
    this.messageAvatars.clear();

    // Destroy dialogue manager
    this.dialogueManager?.destroy();
    this.dialogueManager = null;
  }

  /**
   * Destroys the scene and releases all associated resources.
   * Called by the {@link SceneManager} when switching away from this scene.
   */
  public destroy(): void {
    this.cleanup(); // Perform standard cleanup
    // Destroy the main container and its children (including dialogue manager's container if not already removed)
    this.container.destroy({ children: true });
  }

  /**
   * Debug helper to inspect avatar textures from AssetCache
   */
  private debugAvatarTextures(): void {
    console.log("=============== Avatar Textures Debug ===============");

    // Log the avatar textures we have
    console.log("Avatar Textures Map Keys:", Object.keys(this.avatarTextures));

    // Log the avatar data from the dialogue data
    if (this.dialogueData?.avatars) {
      console.log("Avatar Data from dialogueData:", this.dialogueData.avatars);

      // Check if avatars in dialogueData match textures
      this.dialogueData.avatars.forEach((avatar) => {
        const textureName = avatar.name;
        const textureUrl = avatar.url;

        if (this.avatarTextures[textureName]) {
          console.log(`✅ Found texture for ${textureName} using name`);
        } else if (this.avatarTextures[textureUrl]) {
          console.log(
            `✅ Found texture for ${textureName} using URL: ${textureUrl}`
          );
        } else {
          console.log(`❌ Missing texture for ${textureName} (${textureUrl})`);
        }
      });
    } else {
      console.log("No avatar data found in dialogueData");
    }

    // Log the raw AssetCache avatar textures
    console.log("AssetCache.avatarTextures:", AssetCache.avatarTextures);

    console.log("===============================================");
  }
}
