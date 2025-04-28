import { Container } from "pixi.js";
import { BaseScene } from "./BaseScene";
import { Button } from "../ui/Button";
import { SceneManager } from "./SceneManager";
import { MenuScene } from "./MenuScene";
import { appConfig } from "../config/index";
import { CardManager } from "../components/CardManager";

/**
 * Represents the "Ace of Shadows" game scene, demonstrating card animation.
 * This scene utilizes the {@link CardManager} component to manage a deck of cards,
 * displaying them in two stacks and animating the top card moving from one stack to the other
 * at regular intervals. It implements the {@link BaseScene} interface.
 */
export class AceOfShadowsScene implements BaseScene {
  /** The main container for all visual elements in this scene. Added to the stage by SceneManager. */
  public container: Container;
  /** Reference to the SceneManager instance for scene transitions. */
  private sceneManager: SceneManager;
  /** The button used to navigate back to the main menu scene. */
  private backButton: Button | null = null;
  /** The CardManager instance responsible for managing and animating the cards. */
  private cardManager: CardManager | null = null;

  // --- Configuration Constants (from appConfig) ---
  /** Base width of a card sprite before scaling. */
  private readonly BASE_CARD_WIDTH: number =
    appConfig.scenes.aceOfShadows.CARD_WIDTH;
  /** Base height of a card sprite before scaling. */
  private readonly BASE_CARD_HEIGHT: number =
    appConfig.scenes.aceOfShadows.CARD_HEIGHT;
  /** Base vertical offset between cards in a stack before scaling. */
  private readonly STACK_OFFSET_Y: number =
    appConfig.scenes.aceOfShadows.STACK_OFFSET_Y;
  /** Total number of cards to manage. */
  private readonly NUM_CARDS = appConfig.scenes.aceOfShadows.NUM_CARDS;
  /** Time interval (in milliseconds) between card move animations. */
  private readonly MOVE_INTERVAL = appConfig.scenes.aceOfShadows.MOVE_INTERVAL;
  /** Duration (in seconds) of the card movement animation. */
  private readonly ANIMATION_DURATION =
    appConfig.scenes.aceOfShadows.ANIMATION_DURATION;

  // --- Mutable State ---
  /** Current width of card sprites after responsive scaling. */
  private currentCardWidth: number = this.BASE_CARD_WIDTH;
  /** Current height of card sprites after responsive scaling. */
  private currentCardHeight: number = this.BASE_CARD_HEIGHT;
  /** Current vertical offset between cards in a stack after scaling. */
  private currentStackOffsetY: number = this.STACK_OFFSET_Y;

  /** Calculated position for the center of the first card stack. */
  private stack1Pos = { x: 0, y: 0 };
  /** Calculated position for the center of the second card stack. */
  private stack2Pos = { x: 0, y: 0 };

  /** Timer to track time until the next card move animation. */
  private moveTimer = 0;

  /**
   * Creates an instance of AceOfShadowsScene.
   *
   * @param sceneManager - The {@link SceneManager} instance responsible for managing this scene.
   */
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    // Ensure sortableChildren is enabled for proper z-index ordering during animations
    this.container.sortableChildren = true;
  }

  /**
   * Initializes the scene elements.
   * Creates the back button, calculates initial dimensions, initializes the {@link CardManager},
   * sets stack positions, and performs an initial resize.
   * Called by the {@link SceneManager} when this scene becomes active.
   *
   * @returns {Promise<void>} Resolves immediately as initialization is synchronous.
   */
  public init(): Promise<void> {
    this.moveTimer = this.MOVE_INTERVAL; // Initialize timer

    // --- Back Button ---
    this.backButton = new Button({
      text: "< Back",
      width: appConfig.buttons.small.WIDTH,
      height: appConfig.buttons.small.HEIGHT,
      fillColor: appConfig.buttons.small.FILL_COLOR,
      hoverColor: appConfig.buttons.small.HOVER_COLOR,
      textStyle: appConfig.buttons.small.TEXT_STYLE,
      onClick: () => this.sceneManager.changeScene(MenuScene),
    });
    // Set a high z-index for UI elements to ensure they render above scene content
    this.backButton.zIndex = 5000;
    this.container.addChild(this.backButton);

    // --- Initial Dimensions & Positioning ---
    // Use renderer dimensions from the app instance via SceneManager
    const screenWidth = (this.sceneManager as any)["app"].renderer.width;
    const screenHeight = (this.sceneManager as any)["app"].renderer.height;

    // Calculate responsive dimensions based on initial screen size
    this.calculateCardDimensions(screenWidth, screenHeight);

    // --- Card Manager Initialization ---
    this.cardManager = new CardManager(
      this.container, // Parent container for card sprites
      "card.png", // Texture name (assuming preloaded)
      this.NUM_CARDS,
      this.currentCardWidth,
      this.currentCardHeight,
      this.currentStackOffsetY,
      this.ANIMATION_DURATION
    );

    // --- Calculate Stack Positions ---
    this.positionStacks(screenWidth, screenHeight);
    // CardManager needs initial stack positions after creation
    this.cardManager.updateStackPositions(
      this.stack1Pos.x,
      this.stack1Pos.y,
      this.stack2Pos.x,
      this.stack2Pos.y
    );

    // --- Initial Resize & Sort ---
    // Call resize to position the back button correctly
    this.resize(screenWidth, screenHeight);
    // Force container to sort children by zIndex initially
    this.container.sortChildren();

    // Return a resolved promise as init is synchronous
    return Promise.resolve();
  }

  /**
   * Calculates responsive dimensions for cards and stack offsets based on screen size.
   * Ensures cards remain proportionally sized but readable on smaller screens.
   * Updates the {@link CardManager} with the new dimensions.
   *
   * @param screenWidth - The current width of the renderer view.
   * @param screenHeight - The current height of the renderer view.
   */
  private calculateCardDimensions(
    screenWidth: number,
    screenHeight: number
  ): void {
    // Base scaling on the smaller screen dimension to ensure visibility
    const minDimension = Math.min(screenWidth, screenHeight);
    // Define scale factor with min/max limits for readability
    const scaleFactor = Math.max(0.6, Math.min(1.2, minDimension / 800));

    // Apply scale factor to base dimensions
    this.currentCardWidth = this.BASE_CARD_WIDTH * scaleFactor;
    this.currentCardHeight = this.BASE_CARD_HEIGHT * scaleFactor;
    this.currentStackOffsetY = this.STACK_OFFSET_Y * scaleFactor;

    // Update card manager with the newly calculated dimensions
    this.cardManager?.updateDimensions(
      this.currentCardWidth,
      this.currentCardHeight,
      this.currentStackOffsetY
    );
  }

  /**
   * Calculates the target x/y positions for the two card stacks.
   * Positions the stacks symmetrically around the center of the screen.
   * Updates the {@link CardManager} with the new stack positions.
   *
   * @param screenWidth - The current width of the renderer view.
   * @param screenHeight - The current height of the renderer view.
   */
  private positionStacks(screenWidth: number, screenHeight: number): void {
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    // Calculate horizontal spacing based on scaled card width
    const spacing =
      this.currentCardWidth *
      appConfig.scenes.aceOfShadows.STACK_X_SPACING_FACTOR;

    // Calculate vertical offset to center the stack height
    const totalStackOffsetY = (this.NUM_CARDS - 1) * this.currentStackOffsetY;
    const verticalOffset = totalStackOffsetY / 2;

    // Set stack positions
    this.stack1Pos.x = centerX - spacing / 2;
    this.stack1Pos.y = centerY - verticalOffset;
    this.stack2Pos.x = centerX + spacing / 2;
    this.stack2Pos.y = centerY - verticalOffset;

    // Update card manager with the newly calculated positions
    this.cardManager?.updateStackPositions(
      this.stack1Pos.x,
      this.stack1Pos.y,
      this.stack2Pos.x,
      this.stack2Pos.y
    );
  }

  /**
   * Updates the scene state on each frame.
   * Increments the move timer and triggers a card move animation via {@link CardManager}
   * when the interval is reached.
   *
   * @param deltaMS - The time elapsed since the last frame update, in milliseconds.
   */
  public update(deltaMS: number): void {
    this.moveTimer += deltaMS;

    // Check if it's time to move a card
    if (this.moveTimer >= this.MOVE_INTERVAL) {
      this.moveTimer -= this.MOVE_INTERVAL; // Reset timer, accounting for overshoot
      this.cardManager?.moveTopCard();
    }
  }

  /**
   * Cleans up and destroys the scene and its resources.
   * Destroys the {@link CardManager}, the back button, and removes all children
   * from the main container. Resets the move timer.
   * Called by the {@link SceneManager} when switching away from this scene.
   */
  public destroy(): void {
    // Destroy the card manager first to stop animations and release pooled objects
    this.cardManager?.destroy();
    this.cardManager = null;

    // Destroy the back button if it exists and hasn't been destroyed already
    this.backButton?.destroy();
    this.backButton = null;

    // Remove any remaining children from the container (though manager/button should be main ones)
    this.container.removeChildren();
    // Reset timer
    this.moveTimer = 0;
  }

  /**
   * Handles application resize events.
   * Recalculates card dimensions and stack positions based on the new screen size.
   * Repositions the back button.
   * Ensures the container's children are re-sorted by zIndex.
   *
   * @param screenWidth - The new width of the renderer view in pixels.
   * @param screenHeight - The new height of the renderer view in pixels.
   */
  public resize(screenWidth: number, screenHeight: number): void {
    // Recalculate dimensions and positions based on new screen size
    this.calculateCardDimensions(screenWidth, screenHeight);
    this.positionStacks(screenWidth, screenHeight);

    // Reposition the back button based on layout config
    if (this.backButton) {
      this.backButton.x =
        appConfig.layout.sceneWithBackButton.X_OFFSET_FROM_LEFT +
        this.backButton.getWidth() / 2; // Center pivot offset
      this.backButton.y =
        appConfig.layout.sceneWithBackButton.Y_OFFSET_FROM_TOP +
        this.backButton.getHeight() / 2; // Center pivot offset
    }

    // Ensure child elements are properly sorted by zIndex after potential changes
    this.container.sortChildren();
  }
}
