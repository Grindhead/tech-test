import { Container, Text, Sprite, TextStyle } from "pixi.js";
import { DialoguePart } from "../../utils/dialogueParser";

export interface Emoji {
  name: string;
  url: string;
}

export interface DialogueLine {
  name: string;
  text: string;
}

export interface AvatarData {
  name: string;
  url: string;
  position: "left" | "right";
}

export interface MagicWordsData {
  emojies: Emoji[];
  dialogue: DialogueLine[];
  avatars?: AvatarData[];
}

export interface LineRenderData {
  container: Container;
  parts: DialoguePart[];
  characterText: Text;
  partObjects: (Text | Sprite)[];
  speakerName?: string;
}

export interface DialogueStyles {
  textStyle: Partial<TextStyle>;
  charTextStyle: Partial<TextStyle>;
  missingEmojiStyle: Partial<TextStyle>;
  emojiSize: number;
  avatarSize: number;
  avatarPadding: number;
  lineSpacing: number;
  dialoguePadding: number;
  typingSpeed: number; // Characters per second
  emojiPosition?: "inline" | "left";
}
