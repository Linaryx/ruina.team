/**
 * Remark plugin that assigns custom IDs to Markdown headings.
 *
 * Supports explicit IDs via syntax:
 *   ## Heading text {#custom-id}
 *
 * Falls back to transliterating the heading text to a Latin slug when no
 * explicit ID is provided.
 */

const cyrToLat = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(text) {
  return text
    .toLowerCase()
    .split("")
    .map((char) => cyrToLat[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getText(node) {
  if (node.type === "text") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(getText).join("");
  }
  return "";
}

function setText(node, text) {
  if (node.type === "text") {
    node.value = text;
    return;
  }
  if (Array.isArray(node.children)) {
    const full = getText(node);
    if (full === text) return;
    // Replace all inline text with a single text node; preserves simplicity
    // over full AST reconstruction since headings are usually plain text.
    node.children = [{ type: "text", value: text }];
  }
}

function visit(node, type, callback) {
  if (node.type === type) callback(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child, type, callback);
  }
}

export default function remarkHeadingIds() {
  return (tree) => {
    visit(tree, "heading", (node) => {
      const rawText = getText(node);
      // Allow an optional trailing colon/period/exclamation after the ID marker.
      const match = /\{#([^}]+)\}[.!?:]*\s*$/.exec(rawText);

      let id;
      let displayText;

      if (match) {
        id = match[1].trim();
        displayText = rawText.slice(0, match.index).trim();
      } else {
        id = transliterate(rawText);
        displayText = rawText;
      }

      if (!id) return;

      node.data ??= {};
      node.data.hProperties ??= {};
      node.data.hProperties.id = id;

      // Strip the explicit ID marker from the rendered heading text.
      if (match) {
        setText(node, displayText);
      }
    });
  };
}
