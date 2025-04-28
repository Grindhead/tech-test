import { Text } from "pixi.js";
import { LineRenderData } from "./DialogueTypes";

export class TypingAnimator {
  private linesData: LineRenderData[] = [];
  private currentLineIndex: number = 0;
  private currentPartIndex: number = 0;
  private currentCharacterIndex: number = 0;
  private lineRevealAccumulator: number = 0;
  private isTypingComplete: boolean = false;
  private readonly typingSpeed: number;

  constructor(typingSpeedCharsPerSec: number) {
    this.typingSpeed = typingSpeedCharsPerSec;
  }

  public setLines(linesData: LineRenderData[]): void {
    this.linesData = linesData;
    this.reset();
  }

  public reset(): void {
    this.currentLineIndex = 0;
    this.currentPartIndex = 0;
    this.currentCharacterIndex = 0;
    this.lineRevealAccumulator = 0;
    this.isTypingComplete = false;

    // Hide all text initially
    this.linesData.forEach((lineData) => {
      lineData.characterText.visible = false;
      lineData.partObjects.forEach((obj) => {
        obj.visible = false;
      });
    });
  }

  public update(deltaMS: number): void {
    if (this.isTypingComplete) return;

    const currentLine = this.linesData[this.currentLineIndex];
    if (!currentLine) {
      this.isTypingComplete = true;
      return;
    }

    // Show character name immediately for current line
    currentLine.characterText.visible = true;

    // Accumulate time for character reveal
    this.lineRevealAccumulator += deltaMS;
    const charactersToReveal = Math.floor(
      (this.lineRevealAccumulator / 1000) * this.typingSpeed
    );

    if (charactersToReveal > 0) {
      this.lineRevealAccumulator = 0;
      this.revealNextCharacters(charactersToReveal);
    }
  }

  private revealNextCharacters(count: number): void {
    while (count > 0 && !this.isTypingComplete) {
      const currentLine = this.linesData[this.currentLineIndex];
      const currentPart = currentLine.parts[this.currentPartIndex];
      const currentObject = currentLine.partObjects[this.currentPartIndex];

      if (!currentPart || !currentObject) {
        // Move to next line
        this.currentLineIndex++;
        this.currentPartIndex = 0;
        this.currentCharacterIndex = 0;

        if (this.currentLineIndex >= this.linesData.length) {
          this.isTypingComplete = true;
          return;
        }
        continue;
      }

      if (currentPart.type === "emoji") {
        // Show emoji immediately and move to next part
        currentObject.visible = true;
        this.currentPartIndex++;
        this.currentCharacterIndex = 0;
        count--;
        continue;
      }

      // Text part
      if (currentObject instanceof Text) {
        this.currentCharacterIndex++;
        currentObject.visible = true;
        const fullText = currentPart.content;
        currentObject.text = fullText.substring(0, this.currentCharacterIndex);

        if (this.currentCharacterIndex >= fullText.length) {
          this.currentPartIndex++;
          this.currentCharacterIndex = 0;
        }
      }

      count--;
    }
  }

  public skipToEnd(): void {
    this.linesData.forEach((lineData) => {
      lineData.characterText.visible = true;
      lineData.partObjects.forEach((obj, index) => {
        obj.visible = true;
        if (obj instanceof Text && lineData.parts[index].type === "text") {
          obj.text = lineData.parts[index].content;
        }
      });
    });
    this.isTypingComplete = true;
  }

  public get complete(): boolean {
    return this.isTypingComplete;
  }
}
