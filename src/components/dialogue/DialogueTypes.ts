import { Container, Text, Sprite, TextStyle } from "pixi.js";

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
}

export interface DialogueConfig {
  lineSpacing: number;
  emojiSize: number;
  avatarSize: number;
  avatarPadding: number;
  dialoguePadding: number;
  textStyle: Partial<TextStyle>;
  charTextStyle: Partial<TextStyle>;
  missingEmojiStyle: Partial<TextStyle>;
}

export interface DialoguePart {
  type: "text" | "emoji" | "avatar" | "missing_emoji";
  content: string;
}
