import { Container, FederatedPointerEvent } from "pixi.js";

export class ScrollManager {
  private scrollContainer: Container;
  private dialogueContainer: Container;
  private currentScrollY: number = 0;
  private targetScrollY: number = 0;
  private minScrollY: number = 0;
  private dialogueContentHeight: number = 0;
  private isPointerDown: boolean = false;
  private lastPointerY: number = 0;
  private isScrollingPaused: boolean = false;
  private scrollPauseTimeout: number | null = null;
  private readonly SCROLL_SMOOTHING = 0.1;
  private readonly SCROLL_PAUSE_DURATION = 2000;

  constructor(scrollContainer: Container, dialogueContainer: Container) {
    this.scrollContainer = scrollContainer;
    this.dialogueContainer = dialogueContainer;

    // Setup event listeners
    this.scrollContainer.eventMode = "static";
    this.scrollContainer.on("pointerdown", this.handlePointerDown.bind(this));
    this.scrollContainer.on("pointermove", this.handlePointerMove.bind(this));
    this.scrollContainer.on("pointerup", this.handlePointerUp.bind(this));
    this.scrollContainer.on(
      "pointerupoutside",
      this.handlePointerUp.bind(this)
    );
    window.addEventListener("wheel", this.handleWheelScroll.bind(this));
  }

  public updateScrollBounds(maskHeight: number): void {
    this.dialogueContentHeight = this.dialogueContainer.height;
    this.minScrollY = Math.min(0, maskHeight - this.dialogueContentHeight);
    this.targetScrollY = Math.max(
      this.minScrollY,
      Math.min(0, this.targetScrollY)
    );
  }

  public update(): void {
    if (!this.isScrollingPaused) {
      // Smooth scrolling animation
      const scrollDiff = this.targetScrollY - this.currentScrollY;
      if (Math.abs(scrollDiff) > 0.1) {
        this.currentScrollY += scrollDiff * this.SCROLL_SMOOTHING;
        this.dialogueContainer.y = this.currentScrollY;
      }
    }
  }

  private handlePointerDown(event: FederatedPointerEvent): void {
    this.isPointerDown = true;
    this.lastPointerY = event.y;
    this.pauseAutoScroll();
  }

  private handlePointerMove(event: FederatedPointerEvent): void {
    if (!this.isPointerDown) return;

    const dy = event.y - this.lastPointerY;
    this.targetScrollY = Math.max(
      this.minScrollY,
      Math.min(0, this.targetScrollY + dy)
    );
    this.lastPointerY = event.y;
  }

  private handlePointerUp(): void {
    this.isPointerDown = false;
    this.resumeAutoScroll();
  }

  private handleWheelScroll(event: WheelEvent): void {
    if (!this.scrollContainer.getBounds().contains(event.x, event.y)) return;

    event.preventDefault();
    this.targetScrollY = Math.max(
      this.minScrollY,
      Math.min(0, this.targetScrollY - event.deltaY)
    );
    this.pauseAutoScroll();
  }

  public scrollToBottom(immediate: boolean = false): void {
    if (this.isScrollingPaused) return;

    this.targetScrollY = this.minScrollY;
    if (immediate) {
      this.currentScrollY = this.targetScrollY;
      this.dialogueContainer.y = this.currentScrollY;
    }
  }

  private pauseAutoScroll(): void {
    this.isScrollingPaused = true;
    if (this.scrollPauseTimeout !== null) {
      window.clearTimeout(this.scrollPauseTimeout);
    }
    this.scrollPauseTimeout = window.setTimeout(
      () => this.resumeAutoScroll(),
      this.SCROLL_PAUSE_DURATION
    );
  }

  private resumeAutoScroll(): void {
    this.isScrollingPaused = false;
    if (this.scrollPauseTimeout !== null) {
      window.clearTimeout(this.scrollPauseTimeout);
      this.scrollPauseTimeout = null;
    }
  }

  public destroy(): void {
    // Remove event listeners
    this.scrollContainer.off("pointerdown", this.handlePointerDown.bind(this));
    this.scrollContainer.off("pointermove", this.handlePointerMove.bind(this));
    this.scrollContainer.off("pointerup", this.handlePointerUp.bind(this));
    this.scrollContainer.off(
      "pointerupoutside",
      this.handlePointerUp.bind(this)
    );
    window.removeEventListener("wheel", this.handleWheelScroll.bind(this));

    if (this.scrollPauseTimeout !== null) {
      window.clearTimeout(this.scrollPauseTimeout);
    }
  }
}
