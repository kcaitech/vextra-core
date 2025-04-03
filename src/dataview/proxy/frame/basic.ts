import { ShapeView } from "../../shape";
import { XYsBounding } from "../../../io/cilpboard";
import { Shape, ShapeFrame } from "../../../data";
export function updateFrame(frame: ShapeFrame, x: number, y: number, w: number, h: number): boolean {
    if (frame.x !== x || frame.y !== y || frame.width !== w || frame.height !== h) {
        frame.x = x;
        frame.y = y;
        frame.width = w;
        frame.height = h;
        return true;
    }
    return false;
}

export class FrameCpt {
    static frame2Root(view: ShapeView | Shape) {
        const m = view.matrix2Root();
        const frame = view.frame;
        const points = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height },
        ].map(p => m.computeCoord3(p));
        const box = XYsBounding(points);
        return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
    }

    static frame2Parent(view: ShapeView | Shape) {
        const m = view.matrix2Parent();
        const frame = view.frame;
        const points = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height },
        ].map(p => m.computeCoord3(p));
        const box = XYsBounding(points);
        return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
    }
}