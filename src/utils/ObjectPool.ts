/**
 * A generic object pool implementation.
 * Helps reduce garbage collection pressure by reusing frequently created and destroyed objects.
 * Objects retrieved from the pool should be returned using `release()` when no longer needed.
 *
 * @template T The type of objects that this pool will manage.
 *
 * @example
 * // Pool for managing PixiJS Sprites
 * const spritePool = new ObjectPool<Sprite>(\n *   () => new Sprite(Texture.from(\'myTexture.png\')), // Factory: creates new sprites\n *   (sprite) => { // Reset: prepares sprite for reuse\n *     sprite.position.set(0, 0);\n *     sprite.visible = true;\n *     sprite.alpha = 1;\n *     sprite.tint = 0xFFFFFF;\n *     sprite.transform.rotation = 0;\n *     sprite.transform.scale.set(1, 1);\n *     sprite.parent?.removeChild(sprite); // Remove from previous parent\n *     gsap.killTweensOf(sprite); // Kill any active animations\n *   },\n *   50, // Initial size: pre-populate with 50 sprites\n *   200 // Max size: pool won\'t store more than 200 inactive sprites\n * );\n *
 *
 * // Get a sprite from the pool
 * const mySprite = spritePool.get();
 * myContainer.addChild(mySprite);\n * // ... use the sprite ...
 *
 * // Return the sprite to the pool when done
 * spritePool.release(mySprite);\n */
export class ObjectPool<T> {
  /** The internal array storing the available (inactive) objects in the pool. */
  private pool: T[] = [];
  /** The function used to create a new object instance when the pool is empty. */
  private factory: () => T;
  /** The function used to reset an object\'s state before it is returned to the pool or reused. */
  private resetFn: (obj: T) => void;
  /** The maximum number of inactive objects allowed to be stored in the pool. Prevents unbounded growth. */
  private readonly maximumSize: number;

  /**
   * Creates a new ObjectPool instance.
   *
   * @param factory - A function that creates and returns a new object of type `T`. Called when `get()` is invoked and the pool is empty.
   * @param reset - A function that takes an object of type `T` and resets its state to a default/initial configuration. Called before an object is returned to the pool via `release()`.
   * @param initialSize - (Optional) The number of objects to pre-populate the pool with initially. Defaults to 0.
   * @param maxSize - (Optional) The maximum number of inactive objects to store in the pool. Objects released when the pool is full are not added. Defaults to 1000.
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 0,
    maxSize = 1000
  ) {
    this.factory = factory;
    this.resetFn = reset;
    this.maximumSize = Math.max(0, maxSize); // Ensure maxSize is not negative

    // Pre-populate the pool up to the initial size
    const actualInitialSize = Math.min(initialSize, this.maximumSize);
    for (let i = 0; i < actualInitialSize; i++) {
      try {
        this.pool.push(this.factory());
      } catch (error) {
        console.error(
          "ObjectPool: Error during initial object factory call:",
          error
        );
        // Stop pre-population if factory fails
        break;
      }
    }
  }

  /**
   * Retrieves an object from the pool.
   * If the pool has available objects, it returns one from the end of the internal array.
   * If the pool is empty, it calls the `factory` function to create a new object.
   *
   * @returns An object of type `T` (either recycled or newly created).
   */
  public get(): T {
    if (this.pool.length > 0) {
      // Retrieve the last object added (LIFO)
      return this.pool.pop()!;
    }
    // Pool is empty, create a new object using the factory
    try {
      return this.factory();
    } catch (error) {
      console.error("ObjectPool: Error during factory call in get():", error);
      throw error; // Re-throw error as we cannot provide an object
    }
  }

  /**
   * Returns a previously obtained object back to the pool for potential reuse.
   * The object\'s `reset` function is called before it is added back to the pool.
   * If the pool is already at its `maxSize`, the object is not added (and may be garbage collected).
   *
   * @param obj - The object of type `T` to release back into the pool.
   */
  public release(obj: T): void {
    // Only add back if the pool is not full
    if (this.pool.length < this.maximumSize) {
      try {
        this.resetFn(obj); // Reset the object\'s state
        this.pool.push(obj); // Add it back to the pool
      } catch (error) {
        console.error(
          "ObjectPool: Error during reset call in release():",
          error
        );
        // Do not push the object if reset failed, let it be GC\'d
      }
    } else {
      // Optional: Log a warning if the pool is full and an object is discarded?
      // console.warn("ObjectPool: Pool is full, released object not added.");
    }
  }

  /**
   * Releases an array of objects back to the pool.
   * Calls `release()` for each object in the provided array.
   *
   * @param objs - An array of objects of type `T` to return to the pool.
   */
  public releaseMany(objs: T[]): void {
    // Use Array.isArray for robustness
    if (!Array.isArray(objs)) {
      console.warn("ObjectPool: releaseMany called with non-array argument.");
      return;
    }
    // Release each object individually
    for (const obj of objs) {
      this.release(obj);
    }
  }

  /**
   * Gets the number of currently available (inactive) objects stored in the pool.
   *
   * @returns The number of objects currently in the pool.
   */
  public get currentSize(): number {
    return this.pool.length;
  }

  /**
   * Removes all stored objects from the pool.
   * Does **not** call the reset function on the removed objects.
   * References to the objects are dropped, allowing them to be garbage collected if not referenced elsewhere.
   * Useful for explicit cleanup when the pool is no longer needed.
   */
  public clear(): void {
    console.log(`ObjectPool: Clearing pool with ${this.pool.length} objects.`);
    this.pool = [];
  }
}
