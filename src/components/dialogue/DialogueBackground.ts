import { Graphics } from "pixi.js";
import { DialogueConfig } from "./DialogueTypes";

export class DialogueBackground {
  private background: Graphics;
  private config: DialogueConfig;

  constructor(config: DialogueConfig) {
    this.background = new Graphics();
    this.config = config;
  }

  public update(width: number, contentHeight: number): void {
    const padding = this.config.dialoguePadding;
    const totalHeight = contentHeight + padding * 2;

    this.background.clear();
    this.background.beginFill(0x000000, 0.7);
    this.background.drawRoundedRect(0, 0, width, totalHeight, 10);
    this.background.endFill();
  }

  public get container(): Graphics {
    return this.background;
  }

  public destroy(): void {
    this.background.destroy();
  }
}
