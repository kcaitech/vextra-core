// Handle Canvas APIs for Node.js environment
let Path2D: typeof globalThis.Path2D;
let OffscreenCanvas: typeof globalThis.OffscreenCanvas;
let Image: typeof globalThis.Image;
let DOMMatrix: typeof globalThis.DOMMatrix;
if (typeof window === 'undefined') {
    // Node.js environment - skia-canvas doesn't export OffscreenCanvas, use Canvas instead
    const skiaCanvas = require('skia-canvas');
    Path2D = skiaCanvas.Path2D;
    OffscreenCanvas = skiaCanvas.Canvas; // Use Canvas as OffscreenCanvas equivalent
    Image = skiaCanvas.Image;
    DOMMatrix = skiaCanvas.DOMMatrix;
} else {
    // Browser environment
    Path2D = globalThis.Path2D;
    OffscreenCanvas = globalThis.OffscreenCanvas;
    Image = globalThis.Image;
    DOMMatrix = globalThis.DOMMatrix;
}
export { Path2D, OffscreenCanvas, DOMMatrix, Image };