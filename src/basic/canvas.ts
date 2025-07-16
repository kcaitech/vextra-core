let Path2D: typeof globalThis.Path2D;
let OffscreenCanvas: typeof globalThis.OffscreenCanvas;
let Image: typeof globalThis.Image;
let DOMMatrix: typeof globalThis.DOMMatrix;


export function setExternalCanvas(canvas: {
    Path2D: typeof globalThis.Path2D;
    OffscreenCanvas: typeof globalThis.OffscreenCanvas;
    Image: typeof globalThis.Image;
    DOMMatrix: typeof globalThis.DOMMatrix;
}) {
    Path2D = canvas.Path2D;
    OffscreenCanvas = canvas.OffscreenCanvas;
    Image = canvas.Image;
    DOMMatrix = canvas.DOMMatrix;
}

if (typeof window !== 'undefined') {
    Path2D = globalThis.Path2D;
    OffscreenCanvas = globalThis.OffscreenCanvas;
    Image = globalThis.Image;
    DOMMatrix = globalThis.DOMMatrix;
}
export { Path2D, OffscreenCanvas, DOMMatrix, Image };