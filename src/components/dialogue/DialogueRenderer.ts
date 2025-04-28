import { Container, Text, Sprite, Texture } from "pixi.js";
import {
  DialogueConfig,
  DialogueLine,
  DialoguePart,
  LineRenderData,
  MagicWordsData,
} from "./DialogueTypes";
import { parseLine } from "../../utils/dialogueParser";

export class DialogueRenderer {
  private container: Container;
  private config: DialogueConfig;
  private emojiTextures: Record<string, Texture>;
  private avatarTextures: Record<string, Texture>;
  private linesData: LineRenderData[] = [];

  constructor(
    config: DialogueConfig,
    emojiTextures: Record<string, Texture>,
    avatarTextures: Record<string, Texture>
  ) {
    this.container = new Container();
    this.config = config;
    this.emojiTextures = emojiTextures;
    this.avatarTextures = avatarTextures;
  }

  public renderDialogue(data: MagicWordsData): LineRenderData[] {
    this.cleanup();
    let currentY = 0;

    data.dialogue.forEach((line: DialogueLine) => {
      const lineContainer = new Container();
      lineContainer.y = currentY;

      // Add character name
      const characterText = new Text(
        line.name + ":",
        this.config.charTextStyle
      );
      characterText.x = 0;
      characterText.y = 0;
      lineContainer.addChild(characterText);

      // Parse and render dialogue text with emojis
      const parts = parseLine(line.text);
      const partObjects: (Text | Sprite)[] = [];
      let currentX = characterText.width + 10;

      parts.forEach((part: DialoguePart) => {
        if (part.type === "emoji") {
          const texture = this.emojiTextures[part.content];
          if (texture) {
            const emoji = new Sprite(texture);
            emoji.width = this.config.emojiSize;
            emoji.height = this.config.emojiSize;
            emoji.x = currentX;
            emoji.y = 0;
            lineContainer.addChild(emoji);
            partObjects.push(emoji);
            currentX += this.config.emojiSize + 5;
          } else {
            // Fallback for missing emoji
            const missingEmoji = new Text(
              part.content,
              this.config.missingEmojiStyle
            );
            missingEmoji.x = currentX;
            missingEmoji.y = 0;
            lineContainer.addChild(missingEmoji);
            partObjects.push(missingEmoji);
            currentX += missingEmoji.width + 5;
          }
        } else if (part.type === "missing_emoji") {
          const missingEmoji = new Text(
            part.content,
            this.config.missingEmojiStyle
          );
          missingEmoji.x = currentX;
          missingEmoji.y = 0;
          lineContainer.addChild(missingEmoji);
          partObjects.push(missingEmoji);
          currentX += missingEmoji.width + 5;
        } else {
          const text = new Text(part.content, this.config.textStyle);
          text.x = currentX;
          text.y = 0;
          lineContainer.addChild(text);
          partObjects.push(text);
          currentX += text.width + 2;
        }
      });

      // Add avatars if available
      if (data.avatars) {
        const avatar = data.avatars.find((a) => a.name === line.name);
        if (avatar && this.avatarTextures[avatar.name]) {
          const avatarSprite = new Sprite(this.avatarTextures[avatar.name]);
          avatarSprite.width = this.config.avatarSize;
          avatarSprite.height = this.config.avatarSize;

          if (avatar.position === "left") {
            avatarSprite.x =
              -this.config.avatarSize - this.config.avatarPadding;
          } else {
            avatarSprite.x = lineContainer.width + this.config.avatarPadding;
          }

          avatarSprite.y = (lineContainer.height - this.config.avatarSize) / 2;
          lineContainer.addChild(avatarSprite);
        }
      }

      this.container.addChild(lineContainer);
      this.linesData.push({
        container: lineContainer,
        parts,
        characterText,
        partObjects,
      });

      currentY += lineContainer.height + this.config.lineSpacing;
    });

    return this.linesData;
  }

  public get dialogueContainer(): Container {
    return this.container;
  }

  public cleanup(): void {
    this.linesData = [];
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      child.destroy({ children: true });
      this.container.removeChild(child);
    }
  }

  public destroy(): void {
    this.cleanup();
    this.container.destroy();
  }
}
