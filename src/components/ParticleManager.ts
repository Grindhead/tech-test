import { Container, Sprite } from "pixi.js";
import { ObjectPool } from "../utils/ObjectPool";
import gsap from "gsap";

/**
 * Configuration options for initializing a {@link ParticleManager}.
 */
export interface ParticleManagerConfig {
  /** The maximum number of particles allowed to be active (visible and animating) simultaneously. */
  maxParticles: number;

  /** The name/ID of the texture to use for particle sprites (must be preloaded, e.g., via AssetCache). */
  textureName: string;

  /** The desired width of each particle sprite in pixels. */
  particleWidth: number;

  /** The desired height of each particle sprite in pixels. */
  particleHeight: number;

  /** The average duration (in seconds) a particle should remain visible and animate before being recycled. */
  particleLifetime: number;

  /** The base speed (in pixels per second) at which particles move away from their spawn point. Random variance is often added. */
  particleSpeed: number;

  /** The PixiJS {@link Container} into which the particle sprites will be added as children. */
  container: Container;

  /** The width (in pixels) of the rectangular area within the `container` where particles will initially spawn. */
  areaWidth: number;

  /** The height (in pixels) of the rectangular area within the `container` where particles will initially spawn. */
  areaHeight: number;
}

/**
 * Manages a simple particle system with integrated object pooling for performance.
 * Creates, animates, and recycles particle sprites based on the provided configuration.
 * Uses GSAP for particle animation (movement, fade, rotation).
 *
 * @example
 * const particleConfig: ParticleManagerConfig = {
 *   maxParticles: 50,
 *   textureName: "particle.png",
 *   particleWidth: 16,
 *   particleHeight: 16,
 *   particleLifetime: 3.0,
 *   particleSpeed: 50,
 *   container: mySceneContainer, // The container to add particles to
 *   areaWidth: 100,
 *   areaHeight: 50,
 * };
 * const particleManager = new ParticleManager(particleConfig);
 *
 * // In the game loop (ticker update):
 * particleManager.update(deltaMS);
 *
 * // When the scene is destroyed:
 * particleManager.destroy();
 */
export class ParticleManager {
  /** The configuration object provided during instantiation. */
  private config: ParticleManagerConfig;
  /** The object pool used to manage and reuse particle sprites. */
  private particlePool: ObjectPool<Sprite>;
  /** An array holding references to the currently active (visible and animating) particle sprites. */
  private activeParticles: Sprite[] = [];
  /** Accumulator tracking time since the last particle was spawned. */
  private timeSinceLastSpawn: number = 0;
  /** Calculated time interval (in milliseconds) between particle spawns to maintain `maxParticles`. */
  private spawnInterval: number = 0;

  /**
   * Creates a new ParticleManager instance.
   * Initializes the particle object pool and calculates the spawn interval.
   *
   * @param config - The configuration settings for this particle system. See {@link ParticleManagerConfig}.
   */
  constructor(config: ParticleManagerConfig) {
    this.config = config;

    // Calculate the ideal time between spawns to maintain maxParticles over the lifetime
    this.spawnInterval = (config.particleLifetime * 1000) / config.maxParticles;
    // Ensure a minimum spawn interval to prevent division by zero or excessively fast spawning
    this.spawnInterval = Math.max(1, this.spawnInterval); // At least 1ms interval

    // Initialize the object pool for particle sprites
    this.particlePool = new ObjectPool<Sprite>(
      // --- Factory Function --- Creates a new particle sprite when the pool is empty.
      () => {
        const particle = Sprite.from(config.textureName);
        particle.anchor.set(0.5);
        particle.width = config.particleWidth;
        particle.height = config.particleHeight;
        // Add to container immediately upon creation if not already there
        // This simplifies the reset logic.
        if (particle.parent !== config.container) {
          config.container.addChild(particle);
        }
        return particle;
      },
      // --- Reset Function --- Prepares a recycled particle sprite for reuse.
      (particle) => {
        // Reset visual properties
        particle.visible = true;
        particle.alpha = 1;
        particle.rotation = 0;
        particle.scale.set(1);
        particle.position.set(0, 0); // Reset position to origin (will be set in spawnParticle)

        // Kill any lingering GSAP animations targeting this particle
        gsap.killTweensOf(particle);

        // Ensure it's in the correct container (might have been removed)
        if (particle.parent !== config.container) {
          config.container.addChild(particle);
        }
      },
      // Initialize the pool with a size matching maxParticles for efficiency
      config.maxParticles
    );
  }

  /**
   * Updates the particle system state.
   * Should be called on every frame (e.g., from the application ticker).
   * Handles timing for spawning new particles.
   *
   * @param deltaMS - The time elapsed since the last frame update, in milliseconds.
   */
  public update(deltaMS: number): void {
    // Accumulate time since the last spawn
    this.timeSinceLastSpawn += deltaMS;

    // Check if it's time to spawn a new particle, respecting the maxParticles limit
    while (
      this.timeSinceLastSpawn >= this.spawnInterval &&
      this.activeParticles.length < this.config.maxParticles
    ) {
      this.spawnParticle();
      this.timeSinceLastSpawn -= this.spawnInterval; // Decrement accumulator
    }
    // Prevent accumulator from growing indefinitely if spawning is paused (e.g., max particles reached)
    if (this.activeParticles.length >= this.config.maxParticles) {
      this.timeSinceLastSpawn = 0;
    }
  }

  /**
   * Spawns a single new particle.
   * Retrieves a particle sprite from the pool, sets its initial properties (position, rotation, scale, alpha),
   * calculates a random movement direction and speed, and starts its GSAP animation timeline.
   * Adds the particle to the `activeParticles` list.
   */
  private spawnParticle(): void {
    // Get a particle from the pool (creates one if pool is empty)
    const particle = this.particlePool.get();

    // Add to the list of active particles
    this.activeParticles.push(particle);

    // --- Set Initial State ---
    // Position randomly within the specified spawn area (relative to the manager's container origin)
    particle.x = (Math.random() - 0.5) * this.config.areaWidth;
    particle.y = (Math.random() - 0.5) * this.config.areaHeight;

    // Set random initial rotation
    particle.rotation = Math.random() * Math.PI * 2;

    // Set randomized initial scale and alpha for visual variety
    particle.scale.set(0.5 + Math.random() * 0.5);
    particle.alpha = 0.7 + Math.random() * 0.3;

    // --- Calculate Animation Properties ---
    // Random movement direction (angle in radians)
    const angle = Math.random() * Math.PI * 2 - Math.PI; // Typically upwards for fire (-PI/2 direction bias?)
    // Randomize speed slightly based on config base speed
    const speed = (0.7 + Math.random() * 0.6) * this.config.particleSpeed;
    // Calculate target end position based on angle, speed, and lifetime
    const distanceX = Math.cos(angle) * speed * this.config.particleLifetime;
    const distanceY = Math.sin(angle) * speed * this.config.particleLifetime;
    const targetX = particle.x + distanceX;
    const targetY = particle.y + distanceY;

    // --- Create GSAP Animation Timeline ---
    const timeline = gsap.timeline({
      onComplete: () => {
        // --- Recycle Particle --- Executed when the entire timeline finishes
        // Remove particle from the active list
        this.activeParticles = this.activeParticles.filter(
          (p) => p !== particle
        );
        // Release the particle back to the pool for reuse
        this.particlePool.release(particle);
      },
    });

    // 1. Movement Animation: Move particle to target position over its lifetime
    timeline.to(particle, {
      x: targetX,
      y: targetY,
      rotation: particle.rotation + (Math.random() - 0.5) * Math.PI * 4, // Add some spin
      duration: this.config.particleLifetime,
      ease: "power1.out", // Start fast, slow down
    });

    // 2. Fade Out Animation: Fade particle alpha and scale down towards the end of its life
    //    Starts slightly before the movement animation finishes.
    const fadeDuration = this.config.particleLifetime * 0.3;
    timeline.to(
      particle,
      {
        alpha: 0,
        scale: particle.scale.x * 0.5, // Shrink as it fades
        duration: fadeDuration,
        ease: "power2.in", // Slow start, fast end
      },
      `-=${fadeDuration}` // Start this tween relative to the end of the previous one
    );
  }

  /**
   * Allows updating the dimensions of the particle spawn area dynamically.
   * Note: This currently only affects where *new* particles spawn.
   *
   * @param width - The new width of the spawn area in pixels.
   * @param height - The new height of the spawn area in pixels.
   */
  public updateDimensions(width: number, height: number): void {
    this.config.areaWidth = width;
    this.config.areaHeight = height;
  }

  /**
   * Stops the particle system and cleans up resources.
   * Kills all active particle animations and returns the sprites to the pool.
   * Does NOT destroy the pool itself, assuming the manager might be reused.
   */
  public destroy(): void {
    // Stop all ongoing GSAP animations for active particles
    gsap.killTweensOf(this.activeParticles);

    // Release all currently active particles back into the pool
    this.particlePool.releaseMany(this.activeParticles);

    // Clear the list of active particles
    this.activeParticles = [];
    this.timeSinceLastSpawn = 0; // Reset spawn timer

    // Note: We don't clear the pool itself here (this.particlePool.clear()),
    // as the pool might be intended to persist if the manager is re-initialized.
    // If complete cleanup including textures is needed, the pool's clear method
    // and potentially texture cache clearing would be necessary elsewhere.
  }
}
