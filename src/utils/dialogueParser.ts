/**
 * Represents a segment of parsed dialogue text, which can be either plain text or an emoji.
 */
export type DialoguePart = {
  /** The type of segment (text or emoji). */
  type: "text" | "emoji" | "avatar" | "missing_emoji";
  /** The content of the segment (either the text string or the emoji name). */
  content: string;
};

/**
 * Parses a line of text containing potential emoji characters.
 *
 * @param text - The input text string to parse.
 * @returns An array of DialoguePart objects representing the parsed segments in order.
 */
export function parseLine(text: string): DialoguePart[] {
  if (!text) {
    // console.warn("Empty text provided to parseLine"); // Keep console logs for debugging if needed
    return [{ type: "text", content: "" }];
  }

  // Support multiple emoji formats: {emoji_name}, :emoji_name:, or [emoji_name]
  const pattern = /(?:\{([^}]+)\})|(?:\:([^:]+)\:)|(?:\[([^\]]+)\])/g;
  const parts: DialoguePart[] = [];
  let lastIndex = 0;
  let match;

  // console.log("Parsing line:", text);
  // console.log("Available emoji textures:", Object.keys(textures || {})); // Keep for debugging if needed

  while ((match = pattern.exec(text)) !== null) {
    // Add preceding text part if it exists
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.index),
      });
    }

    // Extract emoji name from whichever group matched
    const emojiName = match[1] || match[2] || match[3];
    // console.log( // Keep for debugging if needed
    //   `Found emoji pattern in text: ${match[0]}, extracted name: ${emojiName}`
    // );

    // Always push as type "emoji" - EmojiManager will handle existence/fallback
    parts.push({ type: "emoji", content: emojiName });

    // REMOVED Texture Check and Substitution Logic:
    // if (textures && textures[emojiName]) {
    //   console.log(`Found texture for emoji: ${emojiName}`);
    //   parts.push({ type: "emoji", content: emojiName });
    // } else {
    //   // Try common substitutions for missing emojis
    //   const substitutions: Record<string, string> = {
    //     affirmative: "satisfied",
    //     win: "satisfied",
    //     happy: "smile",
    //     sad: "cry",
    //     angry: "mad",
    //   };
    //
    //   const substituteName = substitutions[emojiName];
    //   if (substituteName && textures && textures[substituteName]) {
    //     console.log(`Substituting ${emojiName} with ${substituteName}`);
    //     parts.push({ type: "emoji", content: substituteName }); // This was potentially incorrect, should let EmojiManager substitute
    //   } else {
    //     console.log(
    //       `No texture found for emoji: ${emojiName}, available textures: ${Object.keys(
    //         textures || {}
    //       ).join(", ")}`
    //     );
    //     // Display missing emoji as text with brackets
    //     parts.push({ type: "missing_emoji", content: emojiName }); // This is now handled by EmojiManager
    //   }
    // }
    lastIndex = pattern.lastIndex;
  }

  // Add remaining text part if any exists
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.substring(lastIndex) });
  }

  // If no parts were created, return empty text part
  if (parts.length === 0) {
    parts.push({ type: "text", content: "" });
  }

  // console.log("Parsed parts:", parts);
  return parts;
}
