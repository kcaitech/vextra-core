import { ImageShape } from "@/data/data/shape";

export function render(h: Function, shape: ImageShape, url: string, reflush?: number) {
    // <image :xlink:href="url" :x="frame.x" :y="frame.y" :width="frame.width" :height="frame.height" :reflush="reflush" />)
    const frame = shape.frame;
    return h("image", {"xlink:href": url, x: frame.x, y: frame.y, width: frame.width, height: frame.height, reflush});
}