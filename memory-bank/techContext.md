# Tech Context

- **Framework/Library:** PixiJS (v7.4.3)
- **Language:** TypeScript 5.8
- **Animation:** GSAP (GreenSock Animation Platform) 3.12.7
- **Build/Bundling:** Vite
- **Package Manager:** PNPM
- **Core Dependencies:** `pixi.js`, `gsap`
- **Development Setup:** Node.js with TypeScript and Vite.
- **Constraints:** Browser-based application with WebGL support required.

# Technical Context

## Technologies

- **Language:** TypeScript
- **Rendering Engine:** PixiJS (v7 or later likely)
- **Particle Effects:** @pixi/particle-emitter
- **Build Tool:** Vite (assumed based on common practice)
- **Package Manager:** npm or yarn (assumed)

## Development Setup

- Assumed standard Node.js environment.
- Development server likely run via `npm run dev` or `yarn dev`.

## Constraints

- Must run in modern web browsers.
- Performance considerations for particle effects.

## Core Technologies

- **Language:** TypeScript 5.8
- **Rendering Engine:** PixiJS 7.4.3
- **Environment:** Web Browser
- **Animation Library:** GSAP 3.12.7
- **Package Manager:** PNPM
- **Build Tool:** Vite

## Development Environment

- **Node.js environment**
- **TypeScript compiler**
- **Vite dev server with HMR**
- **Modern browser target (WebGL support required)**
- **VSCode with TypeScript and Prettier extensions (recommended)**

## Key Technical Requirements

- **Responsiveness:** Dynamic calculation of UI element sizes and positions based on viewport dimensions, with special attention to mobile devices.
- **Fullscreen:** Browser fullscreen API integration with toggle button.
- **FPS Counter:** Real-time FPS tracking and display with proper positioning.
- **API Integration:** Data fetching from `https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords` for the "Magic Words" scene.
- **Animation Management:** GSAP for complex animations with proper state tracking and memory management.
- **Asset Usage:**
  - "Ace of Shadows": Use 144 card sprites with efficient animation between stacks.
  - "Phoenix Flame": Particle system with a maximum of 10 simultaneous sprites.

## Key Dependencies

- **@pixi/assets:** Asset loading and management
- **@pixi/particle-emitter:** Particle system for Phoenix Flame scene
- **GSAP:** Advanced animation capabilities with timeline and tweening
- **PixiJS core:** 2D rendering engine with WebGL support

## Animation Techniques

- **GSAP Tweening:** Direct property animation using `gsap.to()` with custom easing functions
- **Animation State Tracking:** Using AnimationManager to track active animations for proper management
- **Z-Index Management:** Temporarily increasing z-index during animations for visual layering
- **Animation Conflict Prevention:** Using animation tracking to prevent animating elements already in motion
- **Explicit Final Positioning:** Setting exact positions in `onComplete` callbacks to ensure precision
- **Animation Cleanup:** Proper killing of tweens during scene destruction to prevent memory leaks

## Optimization Techniques

- **Object Pooling:** Reusing objects instead of creating and destroying them to reduce garbage collection
- **Animation Management:** Centralized tracking and control of animations to prevent memory leaks
- **Component-Based Architecture:** Extracting reusable components for better code organization
- **Memory Lifecycle Management:** Proper cleanup of resources when components are destroyed
- **Efficient Sprite Management:** Using object pools for sprites that are frequently created/destroyed

## Responsive Design Implementation

- **Dynamic Scaling:** Calculating element dimensions proportionally to screen size
- **Viewport-Based Positioning:** Centering elements relative to current viewport dimensions
- **Consistent Spacing:** Using configurable spacing constants that scale with screen size
- **Aspect Ratio Handling:** Adjusting layouts to maintain visual consistency across different aspect ratios
- **Resize Event Handling:** Proper recalculation of all dimensions and positions on window resize

## Architecture Overview

1. **Scene-based architecture**

   - **SceneManager for scene transitions**
   - **Individual scene classes with lifecycle methods**
   - **Preloader system for asset management**

2. **UI Component System**

   - **Reusable Button components with configuration**
   - **FPS tracking with proper positioning**
   - **Fullscreen management with state tracking**

3. **Asset Management**

   - **Centralized asset loading through AssetCache**
   - **Type-safe asset references**
   - **Efficient resource management**

4. **Optimization Systems**
   - **Object pooling for reusing sprites**
   - **Animation management for GSAP tweens**
   - **Component-based approach for better code organization**

## Performance Considerations

1. **WebGL rendering optimization**
2. **Asset preloading for smoother experience**
3. **Memory management during scene transitions**
4. **Animation performance optimization**
5. **Responsive scaling for different devices**
6. **Efficient particle system implementation**
7. **Object pooling to reduce garbage collection**
8. **Centralized animation tracking to prevent memory leaks**

## Build and Deploy

- **Development:** `pnpm dev`
- **Production build:** `pnpm build`
- **Preview:** `pnpm preview`

## Technical Constraints

1. **WebGL support required for rendering**
2. **Modern browser features needed (Fullscreen API, etc.)**
3. **Responsive design for multiple screen sizes**
4. **Performance targets (60 FPS on most devices)**
5. **Memory efficiency considerations for mobile devices**

## Dependencies

- `pixi.js`: Version 7.4.3
- `gsap`: Version 3.12.7
- `typescript`: Version 5.8.x
- `vite`: For development and building
