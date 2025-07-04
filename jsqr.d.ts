declare module 'jsqr' {
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): {
    binaryData?: Uint8ClampedArray;
    data?: string;
    location?: {
      topLeftCorner: { x: number; y: number };
      topRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
    };
  } | null;
}