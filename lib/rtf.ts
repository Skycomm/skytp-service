/**
 * Convert markdown-formatted letter text to RTF.
 * Handles: bold (**text**), numbered lists, bullet points, paragraph breaks.
 */
export function markdownToRtf(markdown: string): string {
  const lines = markdown.split("\n");
  const rtfLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      rtfLines.push("\\par\\par");
      continue;
    }

    let rtfLine = escapeRtf(line);

    // Bold: **text** → {\b text}
    rtfLine = rtfLine.replace(/\*\*(.+?)\*\*/g, "{\\b $1}");

    // Numbered list: "1. text" → bullet
    const numberedMatch = rtfLine.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      rtfLine = `${numberedMatch[1]}. ${numberedMatch[2]}`;
    }

    // Bullet point: "- text"
    const bulletMatch = rtfLine.match(/^-\s(.+)/);
    if (bulletMatch) {
      rtfLine = `\\bullet  ${bulletMatch[1]}`;
    }

    rtfLines.push(`${rtfLine}\\par`);
  }

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\f0\\fs24
${rtfLines.join("\n")}
}`;
}

function escapeRtf(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    // Undo double-escape for RTF commands we add later
    // (we'll add RTF commands after escaping)
    ;
}

// Re-apply: the escapeRtf runs first, then we add RTF commands.
// Since bold markers ** don't contain \, {, or }, they survive escaping intact.
