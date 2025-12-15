export const hslRegex = /^hsl\((\d+),\s?(\d+)%,\s?(\d+)%\)$/gim;
export const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export const parseHSL = (hsl: string) => {
    const match = hslRegex.exec(hsl);
    if (!match) {
        return null;
    }
    const [, h, s, l] = match;
    return { h: parseInt(h), s: parseInt(s), l: parseInt(l) };
};

export const formatHSL = (h: number, s: number, l: number) => {
    return `hsl(${h}, ${s}%, ${l}%)`;
};

export const formatRGB = (r: number, g: number, b: number) => {
    return `rgb(${r}, ${g}, ${b})`;
};

export const formatHex = (hex: string) => {
    return `#${hex}`;
};

// Convert hex colors to RGB format
export const hexToRgb = (hex: string) => {
    const result = hexRegex.exec(
        hex
    );
    return result
        ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
        : null;
};