/**
 * Extract plain text from markdown content
 * Removes markdown syntax and returns readable text for TTS
 */
export function extractPlainText(markdown: string): string {
  if (!markdown) return "";

  let text = markdown;

  // Remove code blocks (```code```)
  text = text.replace(/```[\s\S]*?```/g, "");

  // Remove inline code (`code`)
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove links but keep text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");

  // Remove headers (# ## ###)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic markers (**text** -> text, *text* -> text)
  text = text.replace(/\*\*([^\*]+)\*\*/g, "$1");
  text = text.replace(/\*([^\*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove strikethrough (~~text~~ -> text)
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Remove horizontal rules (---)
  text = text.replace(/^---+$/gm, "");

  // Remove list markers (- * +)
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove blockquotes (>)
  text = text.replace(/^>\s+/gm, "");

  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim whitespace
  text = text.trim();

  return text;
}

/**
 * Preprocess text for more natural TTS speech
 * Adds pauses, handles punctuation, and improves flow for human-like speech
 */
export function preprocessTextForTTS(text: string): string {
  if (!text) return "";

  let processed = text;

  // Handle common contractions for more natural pronunciation
  processed = processed.replace(/\bdon't\b/gi, "do not");
  processed = processed.replace(/\bcan't\b/gi, "cannot");
  processed = processed.replace(/\bwon't\b/gi, "will not");
  processed = processed.replace(/\bit's\b/gi, "it is");
  processed = processed.replace(/\bthat's\b/gi, "that is");
  processed = processed.replace(/\bwhat's\b/gi, "what is");
  processed = processed.replace(/\bwho's\b/gi, "who is");
  processed = processed.replace(/\bwhere's\b/gi, "where is");
  processed = processed.replace(/\bhere's\b/gi, "here is");
  processed = processed.replace(/\bthere's\b/gi, "there is");
  processed = processed.replace(/\bI'm\b/g, "I am");
  processed = processed.replace(/\byou're\b/gi, "you are");
  processed = processed.replace(/\bwe're\b/gi, "we are");
  processed = processed.replace(/\bthey're\b/gi, "they are");
  processed = processed.replace(/\bI've\b/g, "I have");
  processed = processed.replace(/\byou've\b/gi, "you have");
  processed = processed.replace(/\bwe've\b/gi, "we have");
  processed = processed.replace(/\bI'll\b/g, "I will");
  processed = processed.replace(/\byou'll\b/gi, "you will");
  processed = processed.replace(/\bhe'll\b/gi, "he will");
  processed = processed.replace(/\bshe'll\b/gi, "she will");
  processed = processed.replace(/\bwe'll\b/gi, "we will");
  processed = processed.replace(/\bthey'll\b/gi, "they will");
  processed = processed.replace(/\bI'd\b/g, "I would");
  processed = processed.replace(/\byou'd\b/gi, "you would");
  processed = processed.replace(/\bhe'd\b/gi, "he would");
  processed = processed.replace(/\bshe'd\b/gi, "she would");
  processed = processed.replace(/\bwe'd\b/gi, "we would");
  processed = processed.replace(/\bthey'd\b/gi, "they would");

  // Add natural pauses after sentences (but not too long)
  processed = processed.replace(/([.!?])\s+/g, "$1 ");

  // Add slight pause after commas (but shorter for faster speech)
  processed = processed.replace(/,\s*/g, ", ");

  // Add pause after colons and semicolons
  processed = processed.replace(/[:;]\s*/g, ": ");

  // Handle ellipses - add brief pause
  processed = processed.replace(/\.\.\./g, "... ");

  // Add pause after dashes
  processed = processed.replace(/—\s*/g, "— ");
  processed = processed.replace(/–\s*/g, "– ");

  // Normalize spacing around parentheses
  processed = processed.replace(/\s*\(\s*/g, " (");
  processed = processed.replace(/\s*\)\s*/g, ") ");

  // Handle abbreviations - spell out for better pronunciation
  // Common tech abbreviations
  processed = processed.replace(/\bAPI\b/g, "A-P-I");
  processed = processed.replace(/\bURL\b/g, "U-R-L");
  processed = processed.replace(/\bHTML\b/g, "H-T-M-L");
  processed = processed.replace(/\bCSS\b/g, "C-S-S");
  processed = processed.replace(/\bJS\b/g, "J-S");
  processed = processed.replace(/\bJSX\b/g, "J-S-X");
  processed = processed.replace(/\bJSON\b/g, "J-S-O-N");
  processed = processed.replace(/\bHTTP\b/g, "H-T-T-P");
  processed = processed.replace(/\bHTTPS\b/g, "H-T-T-P-S");
  processed = processed.replace(/\bXML\b/g, "X-M-L");
  processed = processed.replace(/\bYAML\b/g, "Y-A-M-L");
  processed = processed.replace(/\bCLI\b/g, "C-L-I");
  processed = processed.replace(/\bGUI\b/g, "G-U-I");
  processed = processed.replace(/\bIDE\b/g, "I-D-E");
  processed = processed.replace(/\bSDK\b/g, "S-D-K");
  processed = processed.replace(/\bREST\b/g, "REST");
  processed = processed.replace(/\bGraphQL\b/g, "Graph-Q-L");
  processed = processed.replace(/\bSQL\b/g, "S-Q-L");
  processed = processed.replace(/\bNoSQL\b/g, "No-S-Q-L");

  // Handle numbers for more natural pronunciation
  // Convert years to words (optional - can be commented out if too verbose)
  // processed = processed.replace(/\b(19|20)\d{2}\b/g, (match) => {
  //   // Keep years as numbers for now
  //   return match;
  // });

  // Break up camelCase/PascalCase for better pronunciation
  // But be careful not to break up common words
  processed = processed.replace(/([a-z])([A-Z][a-z])/g, "$1 $2");

  // Handle common programming terms
  processed = processed.replace(/\bnull\b/gi, "null");
  processed = processed.replace(/\bundefined\b/gi, "undefined");
  processed = processed.replace(/\btrue\b/gi, "true");
  processed = processed.replace(/\bfalse\b/gi, "false");
  processed = processed.replace(/\bNaN\b/g, "N-A-N");
  processed = processed.replace(/\bInfinity\b/gi, "infinity");

  // Normalize multiple spaces to single space
  processed = processed.replace(/\s{2,}/g, " ");

  // Remove extra spaces at the start/end of sentences
  processed = processed.replace(/\s+([.!?])\s+/g, "$1 ");

  return processed.trim();
}

