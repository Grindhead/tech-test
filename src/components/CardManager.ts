import { Container, Sprite } from "pixi.js";
import { ObjectPool } from "../utils/ObjectPool";
import { AnimationManager } from "../utils/AnimationManager";

/**
 * Manages a collection of card sprites, handling pooling, stacking and animations
 */
export class CardManager {
  private container: Container;
  private cardPool: ObjectPool<Sprite>;
  private animationManager: AnimationManager;

  // Card dimensions
  private cardWidth: number;
  private cardHeight: number;
  private stackOffsetY: number;

  // Stack positions and cards
  private stack1: Sprite[] = [];
  private stack2: Sprite[] = [];
  private stack1Pos = { x: 0, y: 0 };
  private stack2Pos = { x: 0, y: 0 };

  private isStack1Source = true;
  private animationDuration: number;
  private highestZIndex: number = 1000; // Start with a high value for moving cards

  /**
   * Creates a new CardManager
   *
   * @param container Container to add cards to
   * @param cardTextureName Name of the card texture resource
   * @param numCards Total number of cards to manage
   * @param cardWidth Width of each card
   * @param cardHeight Height of each card
   * @param stackOffsetY Vertical offset between stacked cards
   * @param animationDuration Duration of card movement animation in seconds
   */
  constructor(
    container: Container,
    cardTextureName: string,
    numCards: number,
    cardWidth: number,
    cardHeight: number,
    stackOffsetY: number,
    animationDuration: number
  ) {
    this.container = container;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.stackOffsetY = stackOffsetY;
    this.animationDuration = animationDuration;

    // Initialize the animation manager
    this.animationManager = new AnimationManager();

    // Initialize the card pool
    this.cardPool = new ObjectPool<Sprite>(
      // Factory function to create new cards
      () => {
        const card = Sprite.from(cardTextureName);
        card.anchor.set(0.5);
        return card;
      },
      // Reset function to prepare cards for reuse
      (card) => {
        card.visible = true;
        card.alpha = 1;
        if (card.parent !== this.container) {
          this.container.addChild(card);
        }
      },
      // Initial pool size
      numCards
    );

    // Initialize the cards in stack 1
    this.resetCards(numCards);
  }

  /**
   * Resets the cards, placing all cards in stack 1
   *
   * @param numCards Number of cards to create
   */
  public resetCards(numCards: number): void {
    // Return any existing cards to the pool
    this.stack1.forEach((card) => this.cardPool.release(card));
    this.stack2.forEach((card) => this.cardPool.release(card));

    // Clear the stacks
    this.stack1 = [];
    this.stack2 = [];

    // Get fresh cards from the pool for stack 1
    for (let i = 0; i < numCards; i++) {
      const card = this.cardPool.get();
      card.width = this.cardWidth;
      card.height = this.cardHeight;
      card.name = `card_${i}`;
      this.stack1.push(card);
      this.container.addChild(card);
    }

    // Position the cards in stack 1
    this.arrangeStack(this.stack1, this.stack1Pos);

    // Reset the source stack flag
    this.isStack1Source = true;
  }

  /**
   * Gets a unique card ID for animation tracking
   * @param card The sprite to get an ID for
   * @returns A unique ID for the card
   */
  private getCardId(card: Sprite): string {
    return (
      card.name || `card_${card.renderable ? "1" : "0"}_${card.x}_${card.y}`
    );
  }

  /**
   * Arranges cards in a stack, positioning them with the specified offset
   *
   * @param stack Array of card sprites
   * @param position Base position for the stack
   */
  public arrangeStack(
    stack: Sprite[],
    position: { x: number; y: number }
  ): void {
    stack.forEach((card, index) => {
      if (
        !card.destroyed &&
        !this.animationManager.isAnimating(this.getCardId(card))
      ) {
        card.x = position.x;
        card.y = position.y + index * this.stackOffsetY;
        card.zIndex = index;
      }
    });
  }

  /**
   * Attempts to move the top card from the source stack to the destination stack
   *
   * @returns True if a card was moved, false otherwise
   */
  public moveTopCard(): boolean {
    const sourceStack = this.isStack1Source ? this.stack1 : this.stack2;
    const destinationStack = this.isStack1Source ? this.stack2 : this.stack1;
    const destinationPos = this.isStack1Source
      ? this.stack2Pos
      : this.stack1Pos;

    if (sourceStack.length === 0) {
      // No cards to move
      this.isStack1Source = !this.isStack1Source;
      return false;
    }

    const topCard = sourceStack[sourceStack.length - 1];
    if (this.animationManager.isAnimating(this.getCardId(topCard))) {
      // Card is already being animated
      this.isStack1Source = !this.isStack1Source;
      return false;
    }

    // Remove the card from the source stack
    const cardToMove = sourceStack.pop()!;
    const cardId = this.getCardId(cardToMove);

    // Calculate target position
    const targetX = destinationPos.x;
    const targetY =
      destinationPos.y + destinationStack.length * this.stackOffsetY;

    // Ensure the card has the highest zIndex during animation
    this.highestZIndex += 1;
    cardToMove.zIndex = this.highestZIndex;

    // Force the container to sort children by zIndex
    this.container.sortChildren();

    // Add to destination stack
    destinationStack.push(cardToMove);

    // Animate the card
    this.animationManager.animate(
      cardToMove,
      cardId,
      {
        x: targetX,
        y: targetY,
        duration: this.animationDuration,
        ease: "power1.inOut",
      },
      {
        temporaryZIndex: true,
        onStart: () => {
          // Ensure the card is at the top when animation starts
          cardToMove.zIndex = this.highestZIndex;
          this.container.sortChildren();
        },
        onComplete: () => {
          // Ensure exact final position
          cardToMove.x = targetX;
          cardToMove.y = targetY;
          // Set final zIndex based on position in destination stack
          cardToMove.zIndex = destinationStack.length - 1;
          this.container.sortChildren();
        },
      }
    );

    // Toggle source stack for next move
    this.isStack1Source = !this.isStack1Source;
    return true;
  }

  /**
   * Updates the card dimensions and stack positions based on screen size
   *
   * @param cardWidth New card width
   * @param cardHeight New card height
   * @param stackOffsetY New vertical offset between cards
   */
  public updateDimensions(
    cardWidth: number,
    cardHeight: number,
    stackOffsetY: number
  ): void {
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.stackOffsetY = stackOffsetY;

    // Update card dimensions
    [...this.stack1, ...this.stack2].forEach((card) => {
      card.width = cardWidth;
      card.height = cardHeight;
    });
  }

  /**
   * Updates the positions of the card stacks
   *
   * @param stack1X X position of stack 1
   * @param stack1Y Y position of stack 1
   * @param stack2X X position of stack 2
   * @param stack2Y Y position of stack 2
   */
  public updateStackPositions(
    stack1X: number,
    stack1Y: number,
    stack2X: number,
    stack2Y: number
  ): void {
    this.stack1Pos.x = stack1X;
    this.stack1Pos.y = stack1Y;
    this.stack2Pos.x = stack2X;
    this.stack2Pos.y = stack2Y;

    // Rearrange cards in stacks
    this.arrangeStack(this.stack1, this.stack1Pos);
    this.arrangeStack(this.stack2, this.stack2Pos);
  }

  /**
   * Stops all card animations
   */
  public stopAnimations(): void {
    this.animationManager.stopAll();
  }

  /**
   * Cleans up resources
   */
  public destroy(): void {
    this.stopAnimations();

    // Return all cards to the pool
    [...this.stack1, ...this.stack2].forEach((card) => {
      if (!card.destroyed) {
        this.cardPool.release(card);
      }
    });

    this.stack1 = [];
    this.stack2 = [];
  }
}
