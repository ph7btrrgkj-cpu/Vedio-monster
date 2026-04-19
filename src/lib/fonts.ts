export interface CustomFont {
  family: string;
  url: string;
  format: string;
}

const loadedFonts = new Set<string>();

export async function loadCustomFont(font: CustomFont): Promise<boolean> {
  if (loadedFonts.has(font.family)) return true;

  try {
    const fontFace = new FontFace(font.family, `url(${font.url})`);
    const loadedFace = await fontFace.load();
    (document.fonts as any).add(loadedFace);
    loadedFonts.add(font.family);
    console.log(`Font loaded successfully: ${font.family}`);
    return true;
  } catch (error) {
    console.error(`Failed to load font: ${font.family}`, error);
    return false;
  }
}

export function handleFontUpload(file: File): Promise<CustomFont> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const family = file.name.split('.')[0].replace(/\s+/g, '-');
      const format = file.name.split('.').pop() || 'ttf';
      resolve({ family, url, format });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
