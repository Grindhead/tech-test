import { Container, Text, Sprite, Graphics } from "pixi.js";
import { DialogueLine, LineRenderData, DialogueStyles } from "./types";
import { parseLine } from "../../utils/dialogueParser";
import { EmojiManager } from "./EmojiManager";
import { AvatarManager } from "./AvatarManager";

/**
 * Manages the creation, layout, and visibility updates for individual dialogue lines.
 * Handles parsing text for emojis, creating corresponding PixiJS objects (Text, Sprite),
 * and arranging them within a line container, including basic line breaking.
 * Also controls the visibility of line parts for the typing animation effect.
 */
export class DialogueLineManager {
  /** Shared dialogue styling configuration. */
  private readonly styles: DialogueStyles;
  /** Manager responsible for creating emoji sprites. */
  private readonly emojiManager: EmojiManager;
  /** Manager responsible for avatar logic (currently unused in layout but kept for potential future features). */
  private readonly avatarManager: AvatarManager;

  /**
   * Creates an instance of DialogueLineManager.
   *
   * @param styles - The styling configuration for dialogue elements.
   * @param emojiManager - The manager for handling emoji textures and creation.
   * @param avatarManager - The manager for handling avatar logic.
   */
  constructor(
    styles: DialogueStyles,
    emojiManager: EmojiManager,
    avatarManager: AvatarManager
  ) {
    this.styles = styles;
    this.emojiManager = emojiManager;
    this.avatarManager = avatarManager;
  }

  /**
   * Creates the display objects (Container, Text, Sprites) for a single dialogue line.
   * Parses the line text to separate words and emojis, creating corresponding Pixi objects.
   * Does not handle layout or positioning of these objects initially.
   *
   * @param line - The raw dialogue line data (character name and text).
   * @returns A partial {@link LineRenderData} object containing the newly created container, parsed parts, character name Text, and an array of part objects (Text/Sprite).
   * @throws If emoji creation fails via EmojiManager.
   */
  private createLineObjects(line: DialogueLine): Partial<LineRenderData> {
    const container = new Container();
    // Use default values if line data is incomplete
    const name = line?.name || "Unknown";
    const text = line?.text || "";

    // Create the character name Text object
    const characterText = new Text(name + ":", this.styles.charTextStyle);
    container.addChild(characterText);

    // Parse the raw text into text segments and emoji names
    const parts = parseLine(text);
    const partObjects: (Text | Sprite)[] = [];

    // Create Pixi display objects for each part
    parts.forEach((part) => {
      let partObject: Text | Sprite | null = null;
      try {
        if (part.type === "text") {
          // Create a Text object for text segments
          partObject = new Text(part.content, this.styles.textStyle);
        } else if (part.type === "emoji") {
          // Create a Sprite or fallback Text object for emojis using the EmojiManager
          // EmojiManager now handles substitutions and fallbacks internally.
          partObject = this.emojiManager.createEmojiObject(part.content);
        }

        if (partObject) {
          // Add to the line's container immediately, but don't position yet
          container.addChild(partObject);
          partObjects.push(partObject);
        }
      } catch (error) {
        // Handle errors during part creation (e.g., missing emoji texture)
        console.error(
          `Error creating dialogue part ('${part.content}'): ${error}`
        );
        // Add a visible placeholder in case of error
        const placeholder = new Text("[Error]", this.styles.textStyle);
        container.addChild(placeholder);
        partObjects.push(placeholder);
      }
    });

    // Return the created objects and parsed data
    return { container, parts, characterText, partObjects };
  }

  /**
   * Creates a complete, laid-out dialogue line.
   * First creates the necessary display objects using `createLineObjects`,
   * then arranges them within the specified width using `updateLineLayout`.
   *
   * @param line - The raw dialogue line data.
   * @param availableWidth - The maximum width available for the line content (excluding dialogue padding).
   * @returns The complete {@link LineRenderData} including the container, parsed parts, and positioned display objects.
   */
  public createDialogueLine(
    line: DialogueLine,
    availableWidth: number
  ): LineRenderData {
    // Create the objects first
    const lineData = this.createLineObjects(line) as LineRenderData;

    // Store speaker name for positioning
    lineData.speakerName = line.name;

    // Perform the initial layout
    this.updateLineLayout(lineData, availableWidth);
    return lineData;
  }

  /**
   * Arranges (or rearranges) the part objects (Text, Sprites) within a line's container.
   * Creates a chat bubble appearance with alternating left/right positioning based on speaker.
   * Calculates and returns the total height occupied by the laid-out line.
   *
   * @param lineData - The {@link LineRenderData} containing the container and part objects to layout.
   * @param availableWidth - The maximum width available for the line content (excluding dialogue padding).
   * @returns The calculated total height of the line after applying the layout.
   */
  public updateLineLayout(
    lineData: LineRenderData,
    availableWidth: number
  ): number {
    // Ensure necessary data exists
    if (!lineData || !lineData.characterText || !lineData.partObjects) {
      console.warn("updateLineLayout called with incomplete lineData");
      return 0;
    }

    // Calculate scale factor based on screen width
    const baseWidth = 800;
    const scaleFactor = Math.min(1, Math.max(0.8, availableWidth / baseWidth));

    // Check emoji positioning preference - default to inline if not specified
    const shouldPositionEmojisLeft = this.styles.emojiPosition === "left";

    // Define bubble properties with more conservative width to prevent overflow
    const bubbleWidth = Math.min(availableWidth * 0.75, 450); // Reduced from 0.8 and 500
    const bubblePadding = 15 * scaleFactor; // Padding inside bubble
    const bubbleRadius = 10 * scaleFactor; // Corner radius
    const avatarSize = this.styles.avatarSize * scaleFactor;

    // Clear existing children and create a new container structure
    lineData.container.removeChildren();

    // Create a chat bubble container
    const bubbleContainer = new Container();
    lineData.container.addChild(bubbleContainer);

    // Create a container for emojis to the left of text
    const emojiLeftContainer = new Container();
    lineData.container.addChild(emojiLeftContainer);

    // Determine alignment (left or right) based on speaker name
    // This creates the alternating chat pattern
    const speakerName = lineData.speakerName || "Unknown";
    let isRightAligned = false;

    // Create hash of speaker name to consistently position bubbles by speaker
    let nameHash = 0;
    for (let i = 0; i < speakerName.length; i++) {
      nameHash += speakerName.charCodeAt(i);
    }
    isRightAligned = nameHash % 2 === 0;

    // Get bubble color based on speaker (consistent color per speaker)
    const speakerColors = [
      0x3498db, 0x2ecc71, 0xe74c3c, 0xf39c12, 0x9b59b6, 0x1abc9c,
    ];
    const colorIndex = nameHash % speakerColors.length;
    const bubbleColor = speakerColors[colorIndex];

    // Check if avatar is available
    const avatar = this.avatarManager.getAvatar(speakerName);

    // Create bubble graphic
    const bubble = new Graphics();
    bubble.beginFill(bubbleColor, 0.8);
    bubbleContainer.addChild(bubble);

    // Create content container for all text
    const contentContainer = new Container();
    bubbleContainer.addChild(contentContainer);

    // Position character name at top of bubble
    lineData.characterText.scale.set(scaleFactor);
    lineData.characterText.style.fill = 0xffffff;
    lineData.characterText.style.fontWeight = "bold";
    contentContainer.addChild(lineData.characterText);

    // Scale and add all parts
    let currentX = bubblePadding;
    let currentY = lineData.characterText.height + 5 * scaleFactor; // Start below name
    let lineWidth = 0;
    let currentLineHeight = this.getLineHeight() * scaleFactor;

    // Collect emojis to display on the left
    const leftEmojis: Sprite[] = [];

    // Apply scaling to all parts
    lineData.parts.forEach((_part, index) => {
      const partObject = lineData.partObjects[index];
      if (!partObject) return;

      if (partObject instanceof Text) {
        partObject.scale.set(scaleFactor);
        partObject.style.fill = 0xffffff; // White text for visibility
      } else if (partObject instanceof Sprite) {
        // Scale emoji sprites
        const targetSize = this.styles.emojiSize * scaleFactor;
        partObject.width = targetSize;
        partObject.height = targetSize;

        // Make sure anchor is consistently set to align with text baseline
        partObject.anchor.set(0, 0.5);

        // If emojis should be on the left, collect them instead of positioning them inline
        if (shouldPositionEmojisLeft) {
          leftEmojis.push(partObject);
        }
      }
    });

    // Layout all parts inside bubble with word wrapping
    // Calculate the max content width accounting for possible margins on small screens
    const maxContentWidth = Math.max(bubbleWidth - bubblePadding * 2, 200);
    const spaceWidth = 5 * scaleFactor; // Width of a space between words
    const SAFETY_MARGIN = 2; // Small buffer for width checks

    // Process each part for layout
    lineData.parts.forEach((part, index) => {
      const partObject = lineData.partObjects[index];
      if (!partObject) return;

      if (part.type === "text" && partObject instanceof Text) {
        // Split into words for wrapping
        const words = part.content.split(" ");

        for (let i = 0; i < words.length; i++) {
          const word = words[i];

          // Create a temporary text to measure width
          const tempText = new Text(word, partObject.style);
          tempText.scale.set(scaleFactor);
          const wordWidth = tempText.width;
          tempText.destroy();

          // Handle extremely long words by breaking them
          if (wordWidth + SAFETY_MARGIN > maxContentWidth && word.length > 10) {
            // Add margin
            // If a single word is too long for the line, break it
            let remainingWord = word;
            let charsFit = 0;

            while (remainingWord.length > 0) {
              // Find how many characters fit
              for (charsFit = 1; charsFit <= remainingWord.length; charsFit++) {
                const segment = remainingWord.substring(0, charsFit);
                const segmentText = new Text(segment, partObject.style);
                segmentText.scale.set(scaleFactor);

                // Check if the segment fits within the max content width, including margin
                if (segmentText.width + SAFETY_MARGIN > maxContentWidth) {
                  // Add margin
                  // One character less will fit (or at least 1 char if even 1 is too long)
                  charsFit = Math.max(1, charsFit - 1);
                  segmentText.destroy();
                  break;
                }

                segmentText.destroy();
              }

              // Get the segment that fits
              const segment = remainingWord.substring(0, charsFit);

              // Create the segment text to measure its width
              const segmentText = new Text(segment, partObject.style);
              segmentText.scale.set(scaleFactor);
              const segmentWidth = segmentText.width;

              // Move to the next line if needed (before placing)
              if (
                currentX > bubblePadding &&
                currentX + segmentWidth + SAFETY_MARGIN > maxContentWidth // Add margin
              ) {
                currentX = bubblePadding;
                currentY += currentLineHeight + 2 * scaleFactor;
              }

              // Position the segment text
              segmentText.position.set(currentX, currentY);
              contentContainer.addChild(segmentText);

              // Update position and remaining word
              currentX += segmentWidth; // No space after broken segment
              remainingWord = remainingWord.substring(charsFit);

              // If there's more of the word, move to next line
              if (remainingWord.length > 0) {
                currentX = bubblePadding;
                currentY += currentLineHeight + 2 * scaleFactor;
              }

              lineWidth = Math.max(lineWidth, currentX);
            }
          } else {
            // Normal word handling - check if this word fits on current line
            if (
              currentX > bubblePadding && // Don't wrap if it's the first word on the line
              currentX + wordWidth + SAFETY_MARGIN > maxContentWidth // Add margin
            ) {
              // Move to next line
              currentX = bubblePadding;
              currentY += currentLineHeight + 2 * scaleFactor;
            }

            // Create text for this word
            const wordText = new Text(word, partObject.style);
            wordText.scale.set(scaleFactor);
            wordText.position.set(currentX, currentY);
            contentContainer.addChild(wordText);

            // Update position for the next element (word or space)
            currentX += wordWidth + spaceWidth; // Add space after word
            lineWidth = Math.max(lineWidth, currentX - spaceWidth); // Track max width used by content itself
          }
        }
      } else if (
        !shouldPositionEmojisLeft &&
        part.type === "emoji" &&
        partObject instanceof Sprite
      ) {
        // Position emoji inline with text if not using left positioning
        const emojiWidth = partObject.width; // Use measured width after scaling

        // Check if emoji fits on current line
        if (
          currentX > bubblePadding && // Don't wrap if it's the first element
          currentX + emojiWidth + SAFETY_MARGIN > maxContentWidth // Add margin
        ) {
          // Move to next line
          currentX = bubblePadding;
          currentY += currentLineHeight + 2 * scaleFactor;
        }

        // Position emoji - adjust Y to align with text baseline
        partObject.position.set(currentX, currentY + currentLineHeight / 2);

        // Add to content container
        contentContainer.addChild(partObject);

        // Update position with proper spacing
        currentX += emojiWidth + spaceWidth;
        lineWidth = Math.max(lineWidth, currentX - spaceWidth); // Track max width used by content itself
      }
    });

    // Calculate final bubble dimensions based on actual layout
    // Use the tracked lineWidth (max X reached by content) and clamp to maxContentWidth
    const finalContentWidth = Math.min(lineWidth, maxContentWidth);
    // Ensure finalContentWidth is at least bubblePadding if lineWidth was 0
    const actualBubbleContentWidth = Math.max(finalContentWidth, bubblePadding);
    const totalContentHeight = currentY + currentLineHeight + bubblePadding;

    // Calculate the width needed for the bubble graphic
    const bubbleDrawWidth = actualBubbleContentWidth + bubblePadding * 2;

    // Draw bubble with rounded corners
    bubble.clear();
    bubble.beginFill(bubbleColor, 0.8);

    // Adjust position based on alignment and avatar presence
    const avatarOffset = avatar ? avatarSize + 10 * scaleFactor : 0;
    // Additional offset for emojis on the left (only if using left positioning)
    const emojiOffset =
      shouldPositionEmojisLeft && leftEmojis.length > 0
        ? this.styles.emojiSize * scaleFactor + 10
        : 0;

    if (isRightAligned) {
      // Right-aligned bubble with tail on right
      bubble.drawRoundedRect(
        0,
        0,
        bubbleDrawWidth, // Use calculated draw width
        totalContentHeight,
        bubbleRadius
      );
      bubble.moveTo(
        bubbleDrawWidth, // Use calculated draw width
        totalContentHeight - 15 * scaleFactor
      );
      bubble.lineTo(
        bubbleDrawWidth + 10 * scaleFactor, // Use calculated draw width
        totalContentHeight
      );
      bubble.lineTo(bubbleDrawWidth, totalContentHeight); // Use calculated draw width

      // Position bubble on right side
      const rightPos = availableWidth - (bubbleDrawWidth + 15 * scaleFactor); // Use calculated draw width for positioning
      // Ensure bubble doesn't go off screen on the left
      bubbleContainer.x = Math.max(0, rightPos);

      // Add avatar if available (positioning unchanged)
      if (avatar) {
        avatar.position.set(
          5 * scaleFactor,
          totalContentHeight / 2 - avatarSize / 2
        );
        lineData.container.addChild(avatar);
      }
    } else {
      // Left-aligned bubble with tail on left
      bubble.drawRoundedRect(
        0,
        0,
        bubbleDrawWidth, // Use calculated draw width
        totalContentHeight,
        bubbleRadius
      );
      bubble.moveTo(0, totalContentHeight - 15 * scaleFactor);
      bubble.lineTo(-10 * scaleFactor, totalContentHeight);
      bubble.lineTo(0, totalContentHeight);

      // Position bubble on left side (positioning logic unchanged)
      bubbleContainer.x = Math.max(
        0,
        15 * scaleFactor + avatarOffset + emojiOffset
      );

      // Add avatar if available (positioning unchanged)
      if (avatar) {
        avatar.position.set(
          5 * scaleFactor,
          totalContentHeight / 2 - avatarSize / 2
        );
        lineData.container.addChild(avatar);
      }

      // Position emojis to the left of the bubble (logic unchanged)
      if (shouldPositionEmojisLeft && leftEmojis.length > 0) {
        const emojiContainer = new Container();
        const emojiStartX = avatarOffset + 5 * scaleFactor;
        let emojiY = bubblePadding;

        leftEmojis.forEach((emoji) => {
          const emojiClone = new Sprite(emoji.texture);
          emojiClone.width = emoji.width;
          emojiClone.height = emoji.height;
          emojiClone.position.set(0, emojiY);
          emojiContainer.addChild(emojiClone);
          emojiY += emoji.height + 5 * scaleFactor;
        });

        emojiContainer.position.set(emojiStartX, bubblePadding);
        emojiLeftContainer.addChild(emojiContainer);
      }
    }

    bubble.endFill();

    // Position content inside bubble (unchanged)
    contentContainer.x = bubblePadding;
    contentContainer.y = bubblePadding;

    // Update container height (unchanged)
    const finalHeight = totalContentHeight + 15 * scaleFactor; // Add space below bubble
    lineData.container.height = finalHeight;

    return finalHeight;
  }

  /**
   * Updates the visibility and content of parts within a line for the typing animation effect.
   * Shows parts/characters up to the specified indices.
   * Assumes the layout of parts has already been determined by `updateLineLayout`.
   *
   * @param lineData - The {@link LineRenderData} for the line being animated.
   * @param partIndex - The index of the dialogue part (word/emoji) currently being revealed.
   * @param charIndex - The index of the character within the current text part being revealed.
   */
  public updateLineVisibility(
    lineData: LineRenderData,
    partIndex: number,
    charIndex: number
  ): void {
    if (
      !lineData ||
      !lineData.characterText ||
      !lineData.partObjects ||
      !lineData.parts
    ) {
      return;
    }

    // Character name is always visible once the line starts appearing
    lineData.characterText.visible = true;

    // Iterate through parts and update visibility based on progress
    lineData.parts.forEach((part, index) => {
      const object = lineData.partObjects[index];
      if (!object) return; // Skip if object creation failed

      if (index < partIndex) {
        // Parts before the current one are fully visible
        object.visible = true;
        // Ensure full text content is restored if it was previously partial
        if (object instanceof Text && object.text !== part.content) {
          object.text = part.content;
        }
      } else if (index === partIndex && part.type === "text") {
        // Current text part: show substring based on charIndex
        object.visible = true;
        if (object instanceof Text) {
          object.text = part.content.substring(0, charIndex);
        }
      } else if (index === partIndex && part.type === "emoji") {
        // Current emoji part: show only if charIndex > 0 (i.e., we've started revealing it)
        object.visible = charIndex > 0;
      } else {
        // Parts after the current one are hidden
        object.visible = false;
      }
    });
  }

  /**
   * Calculates the maximum default height needed for a line based on text and emoji sizes.
   * Used to determine initial line height and spacing.
   *
   * @returns The calculated default line height in pixels.
   */
  public getLineHeight(): number {
    // Get font sizes, providing default values if not specified in styles
    const textFontSize =
      typeof this.styles.textStyle.fontSize === "number"
        ? this.styles.textStyle.fontSize
        : 16; // Default text size
    const charFontSize =
      typeof this.styles.charTextStyle.fontSize === "number"
        ? this.styles.charTextStyle.fontSize
        : 16; // Default char name size

    // Return the maximum height among text, character name, and emoji size
    return Math.max(textFontSize, charFontSize, this.styles.emojiSize);
  }
}
