/** Unicode Mathematical Alphanumeric Symbols used by MathML Core. */
type AlphabetRange = [uppercaseStart: number, lowercaseStart: number, digitStart?: number];

const bases: Record<string, AlphabetRange> = {
  "bold-italic": [0x1d468, 0x1d482, 0x1d7ce],
  "bold-script": [0x1d4d0, 0x1d4ea],
  "bold-fraktur": [0x1d56c, 0x1d586],
  "sans-serif-bold": [0x1d5d4, 0x1d5ee, 0x1d7ec],
  "sans-serif-italic": [0x1d608, 0x1d622, 0x1d7e2],
  "sans-serif-bold-italic": [0x1d63c, 0x1d656, 0x1d7ec],
  bold: [0x1d400, 0x1d41a, 0x1d7ce],
  italic: [0x1d434, 0x1d44e],
  "sans-serif": [0x1d5a0, 0x1d5ba, 0x1d7e2],
  monospace: [0x1d670, 0x1d68a, 0x1d7f6],
  fraktur: [0x1d504, 0x1d51e],
  script: [0x1d49c, 0x1d4b6],
  "double-struck": [0x1d538, 0x1d552, 0x1d7d8],
};

const greek = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡϴΣΤΥΦΧΨΩ∇αβγδεζηθικλμνξοπρςστυφχψω∂ϵϑϰϕϱϖ";
const greekBases: Record<string, number> = {
  bold: 0x1d6a8,
  italic: 0x1d6e2,
  "bold-italic": 0x1d71c,
  "sans-serif-bold": 0x1d756,
  "sans-serif-bold-italic": 0x1d790,
};

type FontFamily = "serif" | "sans-serif" | "fraktur" | "script" | "monospace" | "double-struck";

type FontStyle = {
  family?: FontFamily;
  bold?: boolean;
  italic?: boolean;
};

const variantStyles: Record<string, FontStyle> = {
  normal: { italic: false },
  bold: { bold: true },
  italic: { italic: true },
  "bold-italic": { bold: true, italic: true },
  "sans-serif": { family: "sans-serif" },
  "sans-serif-bold": { family: "sans-serif", bold: true },
  "sans-serif-italic": { family: "sans-serif", italic: true },
  "sans-serif-bold-italic": { family: "sans-serif", bold: true, italic: true },
  fraktur: { family: "fraktur" },
  "bold-fraktur": { family: "fraktur", bold: true },
  script: { family: "script" },
  "bold-script": { family: "script", bold: true },
  monospace: { family: "monospace" },
  "double-struck": { family: "double-struck" },
};

export function combineFontVariant(outer: string | undefined, inner: string): string {
  if (!Object.hasOwn(variantStyles, inner)) {
    return inner;
  }

  const inherited = outer && Object.hasOwn(variantStyles, outer) ? variantStyles[outer] : {};
  const specified = variantStyles[inner];
  const family = specified.family ?? inherited.family ?? "serif";
  const bold = specified.bold ?? inherited.bold ?? false;
  const italic = specified.italic ?? inherited.italic ?? false;

  switch (family) {
    case "serif":
      if (bold) {
        return italic ? "bold-italic" : "bold";
      }
      return italic ? "italic" : "normal";

    case "sans-serif":
      if (bold) {
        return italic ? "sans-serif-bold-italic" : "sans-serif-bold";
      }
      return italic ? "sans-serif-italic" : "sans-serif";

    // Unicode has bold, but no separate italic alphabets for these families.
    case "fraktur":
      return bold ? "bold-fraktur" : "fraktur";
    case "script":
      return bold ? "bold-script" : "script";

    // Unicode provides only one alphabet for each of these families.
    case "monospace":
    case "double-struck":
      return family;
  }
}

const exceptions: Record<string, Record<string, string>> = {
  italic: { h: "ℎ" },
  script: {
    B: "ℬ",
    E: "ℰ",
    F: "ℱ",
    H: "ℋ",
    I: "ℐ",
    L: "ℒ",
    M: "ℳ",
    R: "ℛ",
    e: "ℯ",
    g: "ℊ",
    o: "ℴ",
  },
  fraktur: { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" },
  "double-struck": { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" },
};

export function toMathAlphanumeric(value: string, variant: string): string {
  const range = Object.hasOwn(bases, variant) ? bases[variant] : undefined;
  if (!range) {
    return value;
  }

  // Math alphabet mappings are defined per Unicode scalar, not per grapheme.
  return Array.from(value)
    .map((character) => mapMathCharacter(character, variant, range))
    .join("");
}

function mapMathCharacter(character: string, variant: string, range: AlphabetRange): string {
  const exception = exceptions[variant]?.[character];
  if (exception) {
    return exception;
  }

  const greekIndex = greek.indexOf(character);
  if (greekIndex >= 0 && Object.hasOwn(greekBases, variant)) {
    return String.fromCodePoint(greekBases[variant] + greekIndex);
  }

  const codePoint = character.codePointAt(0)!;
  const [uppercaseStart, lowercaseStart, digitStart] = range;

  if (codePoint >= 65 && codePoint <= 90) {
    return String.fromCodePoint(uppercaseStart + codePoint - 65);
  }
  if (codePoint >= 97 && codePoint <= 122) {
    return String.fromCodePoint(lowercaseStart + codePoint - 97);
  }
  if (digitStart !== undefined && codePoint >= 48 && codePoint <= 57) {
    return String.fromCodePoint(digitStart + codePoint - 48);
  }

  return character;
}
