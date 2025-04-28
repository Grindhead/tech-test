# System Patterns

## Architecture

- **Scene-Based:** The application is structured around different scenes (`BaseScene` interface).
- **Scene Manager:** A central `SceneManager` handles transitions between scenes.
- **UI Components:** Reusable UI elements like `Button` are created.
- **Configuration:** Centralized configuration for UI styles, padding, etc. (Currently being refactored).

## Key Patterns

- **Dependency Injection (Basic):** `SceneManager` is passed into scenes.
- **Object Pooling (Implicit):** Particle emitters manage particle lifecycles.
- **Configuration Objects:** Used for styling UI elements (e.g., `smallButtonConfig`).

## Architecture Overview

### Scene Management Pattern

```typescript
class SceneManager {
  currentScene: BaseScene;

  changeScene(SceneClass: new () => BaseScene): void;
  update(deltaMS: number): void;
  resize(): void;
}
```

### UI Component Pattern

```typescript
class BaseUIComponent extends Container {
  protected init(): void;
  public resize(): void;
  public destroy(): void;
}
```

### Asset Management Pattern

```typescript
class AssetCache {
  static preload(): Promise<void>;
  static get<T>(key: string): T;
}
```

### Object Pooling Pattern

```typescript
class ObjectPool<T> {
  private objects: T[] = [];

  constructor(factory: () => T, reset: (obj: T) => void, initialSize?: number);

  get(): T;
  release(obj: T): void;
  releaseMany(objs: T[]): void;
  clear(): void;
}
```

### Animation Management Pattern

```typescript
class AnimationManager {
  private animations: Map<string, gsap.core.Tween>;

  animate(
    target: object,
    id: string,
    props: object,
    options?: object
  ): gsap.core.Tween | null;
  isAnimating(id: string): boolean;
  stop(id: string): void;
  stopAll(): void;
}
```

### Component-Based Pattern

```typescript
class CardManager {
  private container: Container;
  private cardPool: ObjectPool<Sprite>;
  private animationManager: AnimationManager;

  constructor(
    container: Container,
    cardTextureName: string,
    numCards: number,
    ...config
  );

  resetCards(numCards: number): void;
  moveTopCard(): boolean;
  updateDimensions(width: number, height: number, offsetY: number): void;
  updateStackPositions(
    stack1X: number,
    stack1Y: number,
    stack2X: number,
    stack2Y: number
  ): void;
  destroy(): void;
}
```

### Responsive Design Pattern

```typescript
// Responsive sizing based on screen dimensions
private calculateDimensions(screenWidth: number, screenHeight: number): void {
  const minDimension = Math.min(screenWidth, screenHeight);
  const scaleFactor = Math.max(0.6, Math.min(1.2, minDimension / 800));

  this.currentWidth = this.BASE_WIDTH * scaleFactor;
  this.currentHeight = this.BASE_HEIGHT * scaleFactor;
}

// Position elements based on screen size
private positionElements(screenWidth: number, screenHeight: number): void {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;

  this.element1.x = centerX - this.spacing / 2;
  this.element1.y = centerY;
  this.element2.x = centerX + this.spacing / 2;
  this.element2.y = centerY;
}
```

### Animation Pattern

```typescript
// Using the Animation Manager for GSAP tweens with improved z-index handling
this.animationManager.animate(
  sprite,
  sprite.name,
  {
    x: targetX,
    y: targetY,
    duration: this.ANIMATION_DURATION,
    ease: "power1.inOut",
  },
  {
    temporaryZIndex: true, // Automatically handles z-index during animation
    onStart: () => {
      // Additional actions when animation starts
    },
    onComplete: () => {
      // Ensure exact final position
      sprite.x = targetX;
      sprite.y = targetY;
    },
  }
);
```

### Z-Index Management Pattern

```typescript
// Ensure container supports sortable children
container.sortableChildren = true;

// Set high z-index during animation
sprite.zIndex = this.highestZIndex++;

// Force container to re-sort children
container.sortChildren();

// Reset z-index when animation completes
sprite.zIndex = originalZIndex;
container.sortChildren();
```

## Core Design Patterns

1. **Scene-Based Architecture**

   - Each scene is a self-contained module
   - Scenes handle their own lifecycle
   - Clean separation of concerns

2. **Component-Based UI**

   - Reusable UI components
   - Consistent styling through config
   - Event-driven interactions

3. **Centralized Configuration**

   - Single source of truth for settings
   - Type-safe configuration objects
   - Easy maintenance and updates

4. **Asset Management**

   - Centralized asset loading
   - Type-safe asset access
   - Memory-efficient caching

5. **Object Pooling**

   - Reusing objects instead of creating new ones
   - Reducing garbage collection
   - Improving performance for frequent operations

6. **Animation Management**

   - Centralized tracking of animations
   - Prevention of animation conflicts
   - Proper cleanup and resource management

7. **Event System**

   - Native PIXI events
   - Custom event handling
   - Clean event cleanup

8. **Responsive Layout System**

   - Proportional sizing based on screen dimensions
   - Dynamic positioning for different screen sizes
   - Consistent spacing using configuration constants

## Implementation Guidelines

1. **Scene Implementation**

   ```typescript
   class GameScene extends BaseScene {
     init(): Promise<void>;
     update(deltaMS: number): void;
     resize(): void;
     cleanup(): void;
   }
   ```

2. **UI Components**

   ```typescript
   class Button extends BaseUIComponent {
     constructor(config: ButtonConfig);
     onClick: () => void;
     setText(text: string): void;
   }
   ```

3. **Asset Loading**

   ```typescript
   await AssetCache.preload();
   const texture = AssetCache.get<Texture>("sprite");
   ```

4. **Responsive Design**

   ```typescript
   // Calculate sizes based on screen dimensions
   resize(width: number, height: number): void {
     this.calculateDimensions(width, height);
     this.positionElements(width, height);
     this.updateLayout();
   }
   ```

5. **Animation Management**

   ```typescript
   // Track and manage active animations
   private beginAnimation(): void {
     this.stopActiveAnimations(); // Clean up existing animations
     this.createNewAnimation();
     this.trackAnimation();
   }

   private stopActiveAnimations(): void {
     this.activeTweens.forEach(tween => tween.kill());
     this.activeTweens = [];
   }
   ```

## Best Practices

1. **Performance**

   - Use object pooling for frequent creation/destruction
   - Batch similar operations
   - Minimize garbage collection
   - Track and manage animations properly

2. **Memory Management**

   - Proper cleanup in destroy methods
   - Clear event listeners
   - Remove children from display tree
   - Return objects to pools when done
   - Stop animations when cleaning up

3. **Code Organization**

   - Feature-based directory structure
   - Clear file naming conventions
   - Consistent code style
   - Component-based approach for reusability

4. **Responsive Design**

   - Calculate element sizes proportionally to screen dimensions
   - Center important elements in the viewport
   - Use consistent spacing relative to screen size
   - Test on various device sizes and orientations

5. **Animation Optimization**
   - Use animation manager to track and manage active animations
   - Prevent animating elements that are already in motion
   - Set explicit final positions in onComplete callbacks
   - Kill animations during scene destruction
   - Use temporary z-index for better visual layering
   - Maintain proper visual ordering with container.sortChildren()
   - Use higher z-index values for elements that should appear on top

## Optimization Strategies

1. **Rendering**

   - Use sprite batching
   - Implement culling for off-screen objects
   - Optimize texture atlas usage

2. **Animation**

   - Use GSAP for complex animations
   - Implement frame-based updates
   - Pool animation objects
   - Centralize animation management

3. **Object Management**

   - Use object pooling for frequently created objects
   - Reuse sprites instead of destroying and recreating
   - Implement proper reset functions for reused objects

4. **Asset Loading**

   - Progressive loading
   - Asset bundling
   - Texture compression

5. **Responsive Performance**
   - Scale complexity based on device capabilities
   - Reduce particle counts on lower-end devices
   - Optimize animation complexity for mobile

## Component Architecture

1. **Base Components**

   - BaseUIComponent
   - BaseScene
   - BaseParticleSystem

2. **UI Components**

   - Button
   - FPSTracker
   - FullscreenToggle

3. **Game Components**

   - CardManager
   - ParticleEmitter
   - WordContainer

4. **Utility Components**

   - ObjectPool
   - AnimationManager
   - AssetCache

5. **Scene Components**
   - MenuScene
   - GameScene
   - PreloaderScene

## Performance Guidelines

1. **Memory Management**

   - Implement object pooling for frequently created/destroyed objects
   - Clear references in destroy methods
   - Use weak references where appropriate

2. **Rendering Optimization**

   - Use sprite batching for similar objects
   - Implement texture atlases
   - Cull off-screen objects

3. **Animation Performance**

   - Use GSAP timelines for complex animations
   - Pool tween objects
   - Optimize animation callbacks
   - Track and manage active animations

4. **Asset Optimization**
   - Compress textures appropriately
   - Use sprite sheets
   - Implement progressive loading

## Architecture

- **Scene-Based Architecture:** The application is structured around distinct scenes (`MenuScene`, `AceOfShadowsScene`, etc.), each managed by a central `SceneManager`.
- **Component-Based UI:** UI elements like Buttons (`src/ui/Button.ts`) and FPS counters (`src/ui/FPSTracker.ts`) are treated as reusable components.
- **Responsive Design:** All UI elements and game components adjust their size and position based on screen dimensions.

## Key Technical Decisions

- **PixiJS for Rendering:** Chosen for its 2D rendering capabilities and performance.
- **TypeScript for Type Safety:** Enhances code maintainability and reduces runtime errors.
- **GSAP for Animation:** Used for complex or timed animations (e.g., card movement in `AceOfShadowsScene`). Simple animations might use PixiJS's ticker directly.
- **Vite for Build/Dev:** Provides a fast development server and optimized builds.
- **pnpm for Package Management:** Used for managing dependencies.
- **Config-Driven Layout:** Using configuration constants for positioning, sizing, and styling UI elements.

## Design Patterns

- **Scene Management Pattern:** Centralized control for switching between application states/views.
- **Component Pattern:** Encapsulating UI logic and rendering into reusable units.
- **Configuration-Driven:** Using a central `config.ts` for constants and settings (e.g., UI sizes, animation parameters) promotes maintainability.
- **Responsive Layout Pattern:** Dynamically calculating element dimensions and positions based on screen size.
- **Animation State Management:** Tracking active animations and ensuring proper cleanup.

## Component Relationships

- `main.ts`: Initializes the PixiJS Application, `SceneManager`, and loads the initial scene. Also handles global UI elements like the FPS tracker and fullscreen button, adding them directly to the stage.
- `SceneManager`: Holds a reference to the PixiJS `Application` and manages the lifecycle (init, update, destroy, resize) of the `currentScene`.
- `BaseScene` (Interface): Defines the contract for all scenes.
- Scene Implementations (`MenuScene`, `AceOfShadowsScene`, etc.): Contain scene-specific logic, assets, and UI elements. They interact with `SceneManager` for navigation.
- UI Components (`Button`, `FPSTracker`): Added as children to scene containers or the main stage.

## Initial Architecture (Planned)

- **Type:** Single Page Application (SPA).
- **Structure:** Modular, scene-based architecture.

## Core Components

- **`Application` / `Game`:** The main entry point. Initializes Pixi.js, manages the renderer, ticker (game loop), and stage. Handles global concerns like resizing and fullscreen toggling.
- **`SceneManager`:** Responsible for loading, unloading, and transitioning between different application states/scenes (Menu, Task1, Task2, Task3).
- **`BaseScene` (Abstract Class/Interface):** Defines the common interface for all scenes (e.g., `init`, `update`, `destroy`, `resize` methods).
- **`MenuScene`:** The initial scene displayed. Contains UI elements (e.g., buttons) to navigate to the task scenes.
- **`AceOfShadowsScene`:** Encapsulates all logic and rendering specific to the "Ace of Shadows" task.
- **`MagicWordsScene`:** Encapsulates all logic and rendering specific to the "Magic Words" task, including API fetching and custom text rendering.
- **`PhoenixFlameScene`:** Encapsulates all logic and rendering specific to the "Phoenix Flame" particle effect task.
- **`FPSCounter`:** A dedicated component/class responsible for calculating and displaying the FPS, likely added directly to the main stage.
- **`AssetLoader`:** (Potential) A utility or service for preloading required assets (images, fonts, etc.) before scenes start.

## Design Patterns (Anticipated)

- **State Pattern:** The `SceneManager` will likely implement the State pattern to manage the active scene.
- **Observer Pattern:** Potentially used for handling events like resize or scene changes.

## Data Flow

- Global state (like screen dimensions) managed by the main `Application`.
- Scene-specific state managed within each scene class.
- "Magic Words" scene fetches external data via HTTP request.

* **Canvas Responsiveness**: Utilize the `resizeTo: window` option in the PixiJS `Application` constructor to automatically resize the canvas with the browser window.
* **Full-Screen Canvas**: Use CSS (`html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; } canvas { display: block; }`) to make the canvas fill the viewport and prevent scrolling.
* **FPS Display**: Encapsulate FPS logic in a dedicated module (e.g., `src/ui/FPSTracker.ts`). Create a `Pixi.Text` object, add it to the stage (`app.stage.addChild`), and update its `text` property within an `app.ticker.add` callback using `app.ticker.FPS`.
