// Satori needs TTF/OTF: ask Google Fonts for exactly the glyphs we draw.
export async function font(family: string, axes: string, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axes}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null; // no network at build: fall back to the default font
  }
}
