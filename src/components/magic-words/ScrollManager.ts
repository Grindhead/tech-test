import { Container, Graphics, FederatedPointerEvent } from "pixi.js";

/**
 * Manages touch/mouse-based scrolling for a masked container.
 * Provides smooth scrolling interpolation and automatic scrolling to the bottom,
 * with logic to pause auto-scroll during user interaction.
 * Designed for the Magic Words dialogue display.
 */
export class ScrollManager {
  /** The outer container that listens for pointer events and has the mask applied. */
  private scrollContainer: Container;
  /** The inner container holding the scrollable content (dialogue lines). Its Y position is adjusted. */
  private dialogueContainer: Container;
  /** The Graphics object used as the mask for the `scrollContainer`. Defines the visible area. */
  private dialogueMask: Graphics;

  /** The current interpolated scroll position (Y offset of `dialogueContainer`). */
  private currentScrollY: number = 0;
  /** The target scroll position (set by user drag or `scrollToBottom`). */
  private targetScrollY: number = 0;
  /** The minimum scroll position (usually 0). */
  private readonly minScrollY: number = 0; // Content cannot scroll above the top
  /** The calculated total height of the content within `dialogueContainer`. */
  private dialogueContentHeight: number = 0;

  /** Flag indicating if the user is currently dragging within the `scrollContainer`. */
  private isPointerDown: boolean = false;
  /** Stores the Y coordinate of the last pointer event during a drag. */
  private lastPointerY: number = 0;
  /** Flag indicating if automatic scrolling to the bottom is temporarily paused due to user interaction. */
  private isScrollingPaused: boolean = false;
  /** Timeout ID for resuming auto-scroll after user interaction stops. */
  private scrollPauseTimeout: number | null = null;

  /** Smoothing factor for scroll interpolation (0 to 1). Lower values mean smoother, slower scrolling. */
  private readonly SCROLL_SMOOTHING = 0.1;
  /** Duration (in milliseconds) to wait after user interaction before resuming auto-scroll to bottom. */
  private readonly SCROLL_PAUSE_DURATION = 2000;

  /**
   * Creates an instance of ScrollManager.
   *
   * @param scrollContainer - The outer container that receives pointer events and is masked.
   * @param dialogueContainer - The inner container holding the actual scrollable content.
   * @param dialogueMask - The Graphics object used as the mask.
   */
  constructor(
    scrollContainer: Container,
    dialogueContainer: Container,
    dialogueMask: Graphics
  ) {
    this.scrollContainer = scrollContainer;
    this.dialogueContainer = dialogueContainer;
    this.dialogueMask = dialogueMask;

    this.setupEventListeners();
  }

  /**
   * Sets up the necessary pointer event listeners on the `scrollContainer`.
   * Enables interaction for the container.
   */
  private setupEventListeners(): void {
    // Enable pointer events for the scroll area
    this.scrollContainer.eventMode = "static";
    // Bind listeners to this instance
    this.scrollContainer.on("pointerdown", this.onPointerDown, this);
    this.scrollContainer.on("pointermove", this.onPointerMove, this);
    this.scrollContainer.on("pointerup", this.onPointerUp, this);
    this.scrollContainer.on("pointerupoutside", this.onPointerUp, this);
  }

  /**
   * Handles the 'pointerdown' event.
   * Records the initial pointer position and pauses automatic scrolling.
   *
   * @param event - The PixiJS pointer event.
   */
  private onPointerDown(event: FederatedPointerEvent): void {
    this.isPointerDown = true;
    this.lastPointerY = event.globalY;
    this.pauseAutoScroll(); // Pause auto-scroll when user starts interacting
  }

  /**
   * Handles the 'pointermove' event during a drag.
   * Calculates the scroll delta based on pointer movement and updates the `targetScrollY`,
   * clamping it within valid scroll bounds.
   *
   * @param event - The PixiJS pointer event.
   */
  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isPointerDown) return; // Only process if dragging

    const deltaY = event.globalY - this.lastPointerY;
    // Update target scroll position based on drag delta
    this.targetScrollY += deltaY;

    // Clamp targetScrollY within the allowed bounds (0 to -maxScroll)
    this.targetScrollY = Math.max(
      Math.min(this.targetScrollY, this.minScrollY), // Cannot scroll above top (0)
      -this.getMaxScroll() // Cannot scroll below bottom
    );

    this.lastPointerY = event.globalY; // Update last position for next delta calculation
  }

  /**
   * Handles the 'pointerup' and 'pointerupoutside' events.
   * Ends the drag state and schedules the resumption of auto-scrolling.
   */
  private onPointerUp(): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    this.resumeAutoScrollAfterDelay(); // Resume auto-scroll after a delay
  }

  /**
   * Calculates the maximum possible scroll distance (content height minus mask height).
   *
   * @returns The maximum scroll value (as a positive number).
   */
  private getMaxScroll(): number {
    // Ensure mask height is valid before calculation
    const maskHeight = this.dialogueMask?.height ?? 0;
    // Max scroll is the difference between content height and visible area height
    return Math.max(0, this.dialogueContentHeight - maskHeight);
  }

  /**
   * Updates the scroll position interpolation.
   * Should be called on every frame (e.g., from the application ticker).
   * Smoothly moves `currentScrollY` towards `targetScrollY`.
   *
   * @param _deltaMS - Time elapsed since the last frame (currently unused, but could be used for time-based smoothing).
   */
  public updateScroll(_deltaMS: number): void {
    // Interpolate current scroll position towards the target for smooth effect
    const scrollDiff = this.targetScrollY - this.currentScrollY;
    // Apply smoothing (can be adjusted for different feel)
    this.currentScrollY += scrollDiff * this.SCROLL_SMOOTHING;

    // Prevent micro-movements when very close to target
    if (Math.abs(scrollDiff) < 0.1) {
      this.currentScrollY = this.targetScrollY;
    }

    // Apply the calculated Y position to the dialogue container
    this.dialogueContainer.y = this.currentScrollY;
  }

  /**
   * Sets the target scroll position to the bottom of the content.
   * Only takes effect if auto-scrolling is not currently paused by user interaction.
   */
  public scrollToBottom(): void {
    if (this.isScrollingPaused) return; // Don't auto-scroll if user is interacting
    this.targetScrollY = -this.getMaxScroll(); // Target the bottom
  }

  /**
   * Immediately pauses the automatic scrolling behavior.
   * Clears any pending resume timeout.
   */
  private pauseAutoScroll(): void {
    this.isScrollingPaused = true;
    // Clear any existing timeout to prevent premature resumption
    if (this.scrollPauseTimeout !== null) {
      window.clearTimeout(this.scrollPauseTimeout);
      this.scrollPauseTimeout = null;
    }
  }

  /**
   * Schedules the resumption of automatic scrolling after a specified delay.
   * Clears any previous pending resume timeout.
   */
  private resumeAutoScrollAfterDelay(): void {
    // Clear any existing timeout first
    if (this.scrollPauseTimeout !== null) {
      window.clearTimeout(this.scrollPauseTimeout);
    }
    // Set a new timeout to resume auto-scrolling
    this.scrollPauseTimeout = window.setTimeout(() => {
      this.isScrollingPaused = false;
      // Optionally, trigger scrollToBottom immediately upon resume
      // this.scrollToBottom();
    }, this.SCROLL_PAUSE_DURATION);
  }

  /**
   * Updates the manager with the new total height of the dialogue content.
   * Recalculates scroll limits and potentially triggers a scroll to the bottom.
   *
   * @param height - The new total height of the content within the `dialogueContainer`.
   */
  public updateContentHeight(height: number): void {
    this.dialogueContentHeight = height;
    // Clamp target scroll after content height changes
    this.targetScrollY = Math.max(
      Math.min(this.targetScrollY, this.minScrollY),
      -this.getMaxScroll()
    );
    // Scroll to bottom if not paused (e.g., after initial load or resize)
    if (!this.isScrollingPaused) {
      this.scrollToBottom();
    }
  }

  /**
   * Cleans up resources used by the ScrollManager.
   * Removes event listeners and clears any active timeouts.
   */
  public destroy(): void {
    // Clear timeout if it exists
    if (this.scrollPauseTimeout !== null) {
      window.clearTimeout(this.scrollPauseTimeout);
      this.scrollPauseTimeout = null;
    }
    // Remove listeners using the bound instance (`this`) to ensure correct removal
    this.scrollContainer.off("pointerdown", this.onPointerDown, this);
    this.scrollContainer.off("pointermove", this.onPointerMove, this);
    this.scrollContainer.off("pointerup", this.onPointerUp, this);
    this.scrollContainer.off("pointerupoutside", this.onPointerUp, this);
  }

  /**
   * Scrolls to a specific Y position within the content.
   *
   * @param position - The desired Y position to scroll to (position of the item within the content)
   */
  public scrollToPosition(position: number): void {
    // Clamp the position to ensure it's within valid scroll bounds
    const maxScroll = this.getMaxScroll();
    const maskHeight = this.dialogueMask?.height ?? 0;

    // Calculate target scroll position - ensure it's visible and centered if possible
    let targetY = -position + maskHeight / 3; // Position the item 1/3 from the top

    // Clamp to valid scroll bounds
    targetY = Math.max(Math.min(targetY, this.minScrollY), -maxScroll);

    // Set target scroll position
    this.targetScrollY = targetY;

    // Temporarily pause auto-scrolling while manually positioned
    this.pauseAutoScroll();
    this.resumeAutoScrollAfterDelay();
  }
}
