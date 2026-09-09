const HEX_COLOR = /^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i;

export function withOpacity(color: string, opacity: number): string {
  const match = color.match(HEX_COLOR);
  if (!match) return color;

  let hex = match[1];
  if (hex.length === 3) hex = [...hex].map((value) => value + value).join("");
  if (hex.length === 8) hex = hex.slice(0, 6);

  const value = Number.parseInt(hex, 16);
  const red = value >> 16;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const alpha = Math.min(1, Math.max(0, opacity));

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
