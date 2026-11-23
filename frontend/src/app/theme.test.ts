import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const root = css.slice(
  css.indexOf(":root {"),
  css.indexOf("}", css.indexOf(":root {")),
);
const PALETTE = [
  "abyss",
  "surface",
  "wine",
  "wine-bright",
  "champagne",
  "champagne-soft",
  "cream",
  "sand",
];

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "ui" ? [] : tsxFiles(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

describe("theme", () => {
  it("US-16 AC2: shadcn colors point at the parlor palette", () => {
    for (const token of [
      "background",
      "foreground",
      "card",
      "popover",
      "primary",
      "secondary",
      "muted",
      "accent",
      "border",
      "input",
      "ring",
    ]) {
      const value = new RegExp(`--${token}: var\\(--([a-z-]+)\\);`).exec(root);
      expect(value, `--${token}`).not.toBeNull();
      expect(PALETTE).toContain(value![1]);
    }
  });

  it("US-16 AC3: components use design tokens, never color literals", () => {
    const offenders = tsxFiles(join(SRC, "components"))
      .concat(tsxFiles(join(SRC, "app")))
      .flatMap((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .filter((line) => /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(line))
          // <meta name="theme-color"> cannot read CSS variables.
          .filter((line) => !line.includes("themeColor"))
          .map((line) => `${file.replace(SRC, "src")}: ${line.trim()}`),
      );
    expect(offenders).toEqual([]);
  });
});
