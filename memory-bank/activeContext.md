# Active Context

## Current Focus

- Documenting recent analysis findings and JSDoc additions.
- Addressing the identified issue where `DialogueManager` does not relayout dialogue lines on resize, only updates the mask.

## Task

Implement a robust resize handling mechanism in `DialogueManager` and continue improving documentation coverage.

## Next Steps

1.  Implement dialogue relayout logic within `DialogueManager.resize()` to handle changes in screen width correctly.
2.  Continue adding JSDoc comments to remaining core components and scenes (e.g., `AceOfShadowsScene`, `MagicWordsScene`, `ParticleManager`, `DialogueManager` sub-components, `AssetCache`, `ObjectPool`).
3.  Review and potentially refactor `DialogueManager`'s resize logic for performance if relayout proves too costly.

## Recent Analysis

- **`PhoenixFlameScene.ts`**: Confirmed that object pooling for particles is already implemented correctly via the `ParticleManager` component. No refactoring needed for pooling.
- **`MagicWordsScene.ts`**: File size (226 lines) is acceptable. Core logic is delegated to `DialogueManager`. No immediate refactoring needed for size/structure.
- **Resize Issue**: Identified that `MagicWordsScene` calls `DialogueManager.resize()`, but `DialogueManager` only updates its mask, it does _not_ relayout the dialogue lines based on the new width. This will cause rendering issues on resize.
- **Documentation**: Added JSDoc comments to `SceneManager`, `Button`, and `PhoenixFlameScene`.

### Strengths

1. **Clean Architecture**

   - Well-organized scene-based structure
   - Clear separation of concerns
   - Type-safe configuration
   - Improved component reusability

2. **UI Components**

   - Reusable button system
   - Consistent styling
   - Responsive design
   - Better positioning logic

3. **Asset Management**

   - Centralized asset loading
   - Type-safe asset access
   - Efficient caching

4. **Performance Optimizations**
   - Object pooling for better memory usage
   - Animation management for efficient GSAP usage
   - Card management for better sprite organization
   - Improved memory management

### Areas for Improvement

1. **Code Organization**

   - Break down large files (MagicWordsScene.ts analysis complete - no immediate action needed)
   - Implement more reusable component patterns
   - Extract common animation logic

2. **Performance Optimization**

   - Add texture atlas support
   - Optimize particle system memory usage (Pooling confirmed in PhoenixFlame via ParticleManager)
   - Apply object pooling to PhoenixFlameScene (Done via ParticleManager)
   - **Investigate performance implications of dialogue relayout on resize**

3. **Functionality**

   - **Implement correct dialogue relayout in `DialogueManager` on resize**

4. **Documentation**
   - Add JSDoc comments to all public methods and classes (In Progress)
   - Update API documentation
   - Improve usage examples

## Active Decisions

1. **Architecture**

   - Maintain the scene-based architecture
   - Enhance responsive design for better mobile experience
   - Keep using GSAP for complex animations
   - Utilize object pooling for frequently created objects

2. **Performance**

   - Focus on animation performance optimization
   - Implement more efficient memory management
   - Consider sprite batching for improved rendering

3. **Development**
   - Continue strict TypeScript usage with better typing
   - Follow consistent code style across components
   - Improve error handling and edge cases

## Project Insights

1. **Technical Patterns**

   - Scene management architecture works well for this application
   - Config-driven UI approach provides flexibility
   - GSAP integration helps with complex animations
   - Object pooling significantly improves performance
   - Centralized animation management prevents common issues

2. **Challenges**

   - Responsive design for varying screen sizes requires careful handling
   - Animation performance needs optimization for lower-end devices
   - Memory management for particle systems needs improvement

3. **Learnings**
   - Using a consistent config system improves maintainability
   - GSAP animation timelines offer better control than direct tweens
   - Responsive card sizing improves mobile experience
   - Object pooling significantly reduces garbage collection
   - Centralized animation management prevents memory leaks
   - **Delegating complex UI logic (like dialogue rendering/scrolling) to dedicated components (`DialogueManager`) keeps Scene classes cleaner.**
   - **Resize handling needs to consider not just masking but also content relayout, especially for text-based components.**

## Current Work Focus

Optimizing scenes to improve animation performance and responsive behavior. Recent improvements:

1. Added ObjectPool utility for efficient object reuse
2. Implemented AnimationManager for better GSAP animation handling
3. Created CardManager component to handle card sprites and animations
4. Refactored AceOfShadowsScene to use the new components
5. Improved memory management by reusing sprites
6. Fixed z-index handling in card animations for better visual layering

## Recent Changes

- Added object pooling system for efficient sprite reuse
- Implemented centralized animation management for better GSAP control
- Created CardManager component for better card handling
- Refactored AceOfShadowsScene to use the new component-based approach
- Improved animation handling with better state tracking
- Enhanced memory management in card animations
- Fixed potential memory leaks in animation handling
- Made animation code more maintainable and reusable
- Improved code organization with better separation of concerns
- Created ParticleManager component for optimized particle effects
- Replaced complex external particle emitter with more efficient custom implementation
- Applied object pooling to particle system for better performance
- Simplified particle animations with better memory management
- Fixed z-index issues in card animations to ensure moving cards display correctly on top
- Enhanced AnimationManager with improved z-index handling during animations
- Added proper container sorting to maintain visual layering during animations
- **Added call to `dialogueManager.resize()` in `MagicWordsScene.resize()`**
- **Added JSDoc comments to `SceneManager`, `Button`, `PhoenixFlameScene`**
- **Improved `SceneManager.changeScene` to handle async `init` correctly**
