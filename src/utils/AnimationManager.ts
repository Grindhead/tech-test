import gsap from "gsap";

/**
 * Manages GSAP animations to improve performance and prevent memory leaks
 */
export class AnimationManager {
  private animations: Map<string, gsap.core.Tween> = new Map();
  private highestZIndex: number = 1000; // Start with a high base value

  /**
   * Animates an object with GSAP while managing tracking and preventing conflicts
   *
   * @param target Object to animate
   * @param id Unique identifier for this animation target
   * @param props Animation properties (same as gsap.to)
   * @param options Additional options for animation management
   * @returns The created GSAP tween
   */
  public animate(
    target: object,
    id: string,
    props: object,
    options: {
      temporaryZIndex?: boolean;
      onStart?: () => void;
      onComplete?: () => void;
    } = {}
  ): gsap.core.Tween | null {
    // If target is already being animated and we don't want to override, return null
    if (this.isAnimating(id)) {
      return null;
    }

    // Capture the original z-index if we're using temporary z-index
    const originalZIndex =
      options.temporaryZIndex && "zIndex" in target
        ? (target as { zIndex: number }).zIndex
        : undefined;

    // If using temporary z-index, set it to be above other elements
    if (options.temporaryZIndex && "zIndex" in target) {
      // Increment the highest z-index to ensure this animation is on top
      this.highestZIndex += 1;
      (target as { zIndex: number }).zIndex = this.highestZIndex;

      // If target is in a container with sortableChildren, try to sort it
      if (
        "parent" in target &&
        (target as any).parent &&
        "sortChildren" in (target as any).parent
      ) {
        (target as any).parent.sortChildren();
      }
    }

    // Create a copy of the props to avoid modifying the original
    const animProps = { ...props } as any;

    // Wrap the onStart callback
    const originalOnStart = animProps.onStart;
    animProps.onStart = () => {
      // If using temporary z-index, ensure it's set at the start as well
      // This is a safeguard in case the z-index was changed between
      // creating the animation and starting it
      if (options.temporaryZIndex && "zIndex" in target) {
        (target as { zIndex: number }).zIndex = this.highestZIndex;

        // Sort children if possible
        if (
          "parent" in target &&
          (target as any).parent &&
          "sortChildren" in (target as any).parent
        ) {
          (target as any).parent.sortChildren();
        }
      }

      if (options.onStart) options.onStart();
      if (originalOnStart) originalOnStart();
    };

    // Wrap the onComplete callback to handle cleanup
    const originalOnComplete = animProps.onComplete;
    animProps.onComplete = () => {
      // Call the original onComplete if it exists
      if (originalOnComplete) originalOnComplete();
      if (options.onComplete) options.onComplete();

      // Restore the original z-index if we modified it
      if (
        options.temporaryZIndex &&
        originalZIndex !== undefined &&
        "zIndex" in target
      ) {
        (target as { zIndex: number }).zIndex = originalZIndex;

        // Sort children if possible
        if (
          "parent" in target &&
          (target as any).parent &&
          "sortChildren" in (target as any).parent
        ) {
          (target as any).parent.sortChildren();
        }
      }

      // Remove from tracking
      this.animations.delete(id);
    };

    // Create and track the tween
    const tween = gsap.to(target, animProps);
    this.animations.set(id, tween);

    return tween;
  }

  /**
   * Checks if an object is currently being animated
   *
   * @param id Unique identifier for the animation target
   * @returns True if the object is being animated
   */
  public isAnimating(id: string): boolean {
    return this.animations.has(id);
  }

  /**
   * Stops a specific animation
   *
   * @param id Unique identifier for the animation target
   */
  public stop(id: string): void {
    const tween = this.animations.get(id);
    if (tween) {
      tween.kill();
      this.animations.delete(id);
    }
  }

  /**
   * Stops all active animations
   */
  public stopAll(): void {
    this.animations.forEach((tween) => tween.kill());
    this.animations.clear();
  }

  /**
   * Gets the count of currently active animations
   */
  public activeCount(): number {
    return this.animations.size;
  }
}
