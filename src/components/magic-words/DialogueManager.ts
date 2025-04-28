import { Container, Graphics, Texture, Application } from "pixi.js";
import {
  MagicWordsData,
  DialogueStyles,
  LineRenderData,
  DialogueLine,
} from "./types";
import { DialogueLineManager } from "./DialogueLineManager";
import { EmojiManager } from "./EmojiManager";
import { AvatarManager } from "./AvatarManager";
import { ScrollManager } from "./ScrollManager";

export class DialogueManager {
  private app: Application;
  private dialogueData: MagicWordsData;
  private styles: DialogueStyles;

  private container: Container;
  private scrollContainer: Container;
  private dialogueContainer: Container;
  private dialogueMask: Graphics;

  private lineManager: DialogueLineManager;
  private emojiManager: EmojiManager;
  private avatarManager: AvatarManager;
  private scrollManager: ScrollManager;

  private linesData: LineRenderData[] = [];
  private currentLineIndex: number = 0;
  private currentPartIndex: number = 0;
  private currentCharacterIndex: number = 0;
  private lineRevealAccumulator: number = 0;
  private isTypingComplete: boolean = false;

  // Getter to expose typing completion status
  public get IsTypingComplete(): boolean {
    return this.isTypingComplete;
  }

  constructor(
    app: Application,
    dialogueData: MagicWordsData,
    emojiTextures: Record<string, Texture>,
    avatarTextures: Record<string, Texture>,
    styles: DialogueStyles
  ) {
    this.app = app;
    this.dialogueData = dialogueData;
    this.styles = styles;

    // Create main containers
    this.container = new Container();
    this.scrollContainer = new Container();
    this.dialogueContainer = new Container();

    // Create mask
    this.dialogueMask = new Graphics();
    this.updateMask(app.screen.width, app.screen.height);

    // Initialize managers
    this.emojiManager = new EmojiManager(
      emojiTextures,
      styles.emojiSize,
      styles.missingEmojiStyle
    );

    this.avatarManager = new AvatarManager(
      avatarTextures,
      styles.avatarSize,
      styles.avatarPadding
    );

    this.lineManager = new DialogueLineManager(
      styles,
      this.emojiManager,
      this.avatarManager
    );

    // Setup containers
    this.setupContainers();

    // Initialize scroll manager
    this.scrollManager = new ScrollManager(
      this.scrollContainer,
      this.dialogueContainer,
      this.dialogueMask
    );

    // Start rendering dialogue
    this.initializeDialogue();
  }

  private setupContainers(): void {
    // Add containers to main container
    this.container.addChild(this.scrollContainer);
    this.scrollContainer.addChild(this.dialogueContainer);

    // Setup mask
    this.scrollContainer.mask = this.dialogueMask;
    this.container.addChild(this.dialogueMask);
  }

  private updateMask(width: number, height: number): void {
    const padding = this.styles.dialoguePadding;
    // Create a responsive mask based on screen dimensions
    // Use 10% padding on smaller screens, with a minimum of the configured padding
    const responsivePadding = Math.max(
      padding,
      Math.min(width * 0.08, height * 0.08)
    );

    this.dialogueMask.clear();
    this.dialogueMask.beginFill(0xffffff);
    this.dialogueMask.drawRect(
      responsivePadding,
      responsivePadding,
      width - responsivePadding * 2,
      height - responsivePadding * 2
    );
    this.dialogueMask.endFill();

    // Position the dialogue container with the same padding
    this.dialogueContainer.x = responsivePadding;
    this.dialogueContainer.y = responsivePadding;
  }

  private initializeDialogue(): void {
    // Create all dialogue lines with proper vertical spacing
    let currentY = 0;

    this.dialogueData.dialogue.forEach((line) => {
      // Create and layout the dialogue line
      const lineData = this.lineManager.createDialogueLine(
        line,
        this.app.screen.width - this.styles.dialoguePadding * 2
      );

      // Position the line
      lineData.container.y = currentY;

      // Add to dialogue container and store data
      this.dialogueContainer.addChild(lineData.container);
      this.linesData.push(lineData);

      // Calculate Y position for next line with reduced spacing
      currentY += lineData.container.height + this.styles.lineSpacing;

      // Initially hide all parts
      this.lineManager.updateLineVisibility(lineData, 0, 0);
    });

    // Update content height for scroll manager
    this.scrollManager.updateContentHeight(currentY);
  }

  public update(deltaMS: number): void {
    if (this.isTypingComplete) {
      this.scrollManager.updateScroll(deltaMS);
      return;
    }

    // Update typing animation
    this.lineRevealAccumulator += deltaMS;
    const charRevealTime = 1000 / this.styles.typingSpeed;

    while (this.lineRevealAccumulator >= charRevealTime) {
      this.lineRevealAccumulator -= charRevealTime;
      this.advanceTyping();
    }

    // Update scroll
    this.scrollManager.updateScroll(deltaMS);
    if (!this.isTypingComplete) {
      this.scrollManager.scrollToBottom();
    }
  }

  private advanceTyping(): void {
    if (this.isTypingComplete) return;

    const currentLine = this.linesData[this.currentLineIndex];
    if (!currentLine) {
      this.isTypingComplete = true;
      return;
    }

    const currentPart = currentLine.parts[this.currentPartIndex];
    if (!currentPart) {
      // Move to next line if no more parts in current line
      this.currentLineIndex++;
      this.currentPartIndex = 0;
      this.currentCharacterIndex = 0;

      // Check if we've finished all lines
      if (this.currentLineIndex >= this.linesData.length) {
        this.isTypingComplete = true;
        return;
      }

      // Update visibility for the new line
      const nextLine = this.linesData[this.currentLineIndex];
      if (nextLine) {
        this.lineManager.updateLineVisibility(
          nextLine,
          this.currentPartIndex,
          this.currentCharacterIndex
        );
      }

      return;
    }

    // Handle different part types
    if (currentPart.type === "text") {
      this.currentCharacterIndex++;
      if (this.currentCharacterIndex > currentPart.content.length) {
        // Move to next part
        this.currentCharacterIndex = 0;
        this.currentPartIndex++;
      }
    } else if (currentPart.type === "emoji") {
      // For emojis, show them immediately
      this.currentCharacterIndex = 1; // Mark as fully visible
      this.currentPartIndex++; // Move to next part
    }

    // Update visibility of current line
    this.lineManager.updateLineVisibility(
      currentLine,
      this.currentPartIndex,
      this.currentCharacterIndex
    );

    // Check if we've finished current line
    if (this.currentPartIndex >= currentLine.parts.length) {
      // Move to next line
      this.currentLineIndex++;
      this.currentPartIndex = 0;
      this.currentCharacterIndex = 0;

      // Check if we've finished all lines
      if (this.currentLineIndex >= this.linesData.length) {
        this.isTypingComplete = true;
      }
    }
  }

  public resize(width: number, height: number): void {
    // 1. Update the mask dimensions
    this.updateMask(width, height);

    // 2. Calculate responsive scale factor
    const baseWidth = 800;
    const scaleFactor = Math.min(1, Math.max(0.8, width / baseWidth));

    // 3. Update styles with scaled font sizes for better readability
    const responsiveTextStyle = { ...this.styles.textStyle };
    const responsiveCharStyle = { ...this.styles.charTextStyle };
    const responsiveMissingStyle = { ...this.styles.missingEmojiStyle };

    // Scale font sizes if they're numbers
    if (typeof responsiveTextStyle.fontSize === "number") {
      responsiveTextStyle.fontSize = Math.round(
        (this.styles.textStyle.fontSize as number) * scaleFactor
      );
    }

    if (typeof responsiveCharStyle.fontSize === "number") {
      responsiveCharStyle.fontSize = Math.round(
        (this.styles.charTextStyle.fontSize as number) * scaleFactor
      );
    }

    if (typeof responsiveMissingStyle.fontSize === "number") {
      responsiveMissingStyle.fontSize = Math.round(
        (this.styles.missingEmojiStyle.fontSize as number) * scaleFactor
      );
    }

    // 4. Calculate responsive line spacing and padding
    const responsiveLineSpacing = this.styles.lineSpacing * scaleFactor;
    const availableWidth = width - this.styles.dialoguePadding * 2;

    // 5. Reset containers for clean relayout
    this.dialogueContainer.removeChildren();

    // 6. Rebuild and relayout all lines
    let currentY = 0;
    this.linesData.forEach((_lineData, idx) => {
      // Recreate line container and objects for better layout control
      const newLineData = this.lineManager.createDialogueLine(
        this.dialogueData.dialogue[idx],
        availableWidth
      );

      // Copy relevant properties to avoid losing state
      newLineData.container.y = currentY;

      // Add to dialog container
      this.dialogueContainer.addChild(newLineData.container);

      // Update line data reference
      this.linesData[idx] = newLineData;

      // Update Y position for next line
      currentY += newLineData.container.height + responsiveLineSpacing;

      // Update line visibility based on current typing progress
      if (idx < this.currentLineIndex) {
        // For completed lines, make all parts visible
        this.lineManager.updateLineVisibility(
          newLineData,
          newLineData.parts.length, // All parts visible
          0
        );
      } else if (idx === this.currentLineIndex) {
        // For current line, show parts up to current progress
        this.lineManager.updateLineVisibility(
          newLineData,
          this.currentPartIndex,
          this.currentCharacterIndex
        );
      } else {
        // For future lines, hide all parts
        this.lineManager.updateLineVisibility(newLineData, 0, 0);
      }
    });

    // 7. Update scroll manager with new total content height
    this.scrollManager.updateContentHeight(currentY);

    // 8. Scroll to current typing position
    if (
      !this.isTypingComplete &&
      this.currentLineIndex < this.linesData.length
    ) {
      const currentLineY =
        this.linesData[this.currentLineIndex]?.container.y || 0;
      this.scrollManager.scrollToPosition(currentLineY);
    }
  }

  public destroy(): void {
    this.scrollManager.destroy();
    this.container.destroy({ children: true });
  }

  public getContainer(): Container {
    return this.container;
  }

  /**
   * Forces the ScrollManager to scroll to the bottom of the content,
   * regardless of typing state.
   */
  public forceScrollToBottom(): void {
    if (this.scrollManager) {
      // Temporarily reset the pause flag to ensure scrolling works
      const wasPaused = this.scrollManager["isScrollingPaused"];
      this.scrollManager["isScrollingPaused"] = false;

      // Call scrollToBottom
      this.scrollManager.scrollToBottom();

      // Restore original pause state
      this.scrollManager["isScrollingPaused"] = wasPaused;
    }
  }

  /**
   * Returns the Y positions of each dialogue message in the container
   * Used for accurate avatar positioning in MagicWordsScene
   * @returns An array of {y: number} objects representing message positions
   */
  public getMessagePositions(): { y: number }[] {
    return this.linesData.map((lineData) => {
      // Return local position relative to dialogue container
      return {
        y: lineData.container.y,
      };
    });
  }

  /**
   * Returns an array of all message containers in the dialogue
   * Used to attach avatars directly to message containers
   * @returns Array of Container objects for each message
   */
  public getMessageContainers(): Container[] {
    return this.linesData.map((lineData) => lineData.container);
  }

  /**
   * Appends a new dialogue line to the existing dialogue display.
   * Creates the line, positions it, adds it to the container,
   * updates internal state, and resets typing for the new line.
   *
   * @param line The DialogueLine object to append.
   */
  public appendMessage(line: DialogueLine): void {
    if (!this.lineManager || !this.dialogueContainer || !this.scrollManager) {
      console.error(
        "Cannot append message: DialogueManager not fully initialized."
      );
      return;
    }

    // 1. Calculate Y position for the new line with reduced spacing
    let currentY = 0;
    if (this.linesData.length > 0) {
      const lastLine = this.linesData[this.linesData.length - 1];
      currentY =
        lastLine.container.y +
        lastLine.container.height +
        this.styles.lineSpacing;
    }

    // 2. Create the new dialogue line
    const availableWidth =
      this.app.screen.width - this.styles.dialoguePadding * 2;
    const newLineData = this.lineManager.createDialogueLine(
      line,
      availableWidth
    );

    // 3. Position the new line
    newLineData.container.y = currentY;

    // 4. Add to dialogue container and internal data
    this.dialogueContainer.addChild(newLineData.container);
    this.linesData.push(newLineData);

    // 5. Update dialogue data (optional, but good for consistency if resize happens)
    this.dialogueData.dialogue.push(line);

    // 6. Initially hide all parts of the new line
    this.lineManager.updateLineVisibility(newLineData, 0, 0);

    // 7. Update content height for scroll manager
    const totalHeight = currentY + newLineData.container.height;
    this.scrollManager.updateContentHeight(totalHeight);

    // 8. Reset typing state to allow the new line to start typing
    //    - If typing was complete, reset it.
    //    - Set currentLineIndex to the index of the newly added line.
    //    - Reset part and character index.
    if (this.isTypingComplete) {
      this.isTypingComplete = false;
      this.lineRevealAccumulator = 0; // Reset accumulator if starting typing again
    }
    // Ensure typing restarts from the beginning of the *new* line
    this.currentLineIndex = this.linesData.length - 1;
    this.currentPartIndex = 0;
    this.currentCharacterIndex = 0;

    // 9. Force immediate scroll to bottom to show the start of the new line
    this.forceScrollToBottom();
  }
}
