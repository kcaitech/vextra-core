import { CurveMode, CurvePoint } from "./baseclasses";
import { CrdtIndex } from "./crdt";

function hasSetBit(val: number, mask: number): boolean {
    return !!(val & mask);
}
function setBit(val: number, mask: number, b: boolean): number {
    return b ? (val | mask) : (val & (~mask));
}

export const ResizingConstraints = {
    Mask: 0b111111,
    Unset: 0, // 0
    Right: 0b000001, // 1
    Width: 0b000010, // 2
    Left: 0b000100, // 4
    Bottom: 0b001000, // 8
    Height: 0b010000, // 16
    Top: 0b100000, // 32

    isUnset(val: number): boolean {
        return (val & this.Mask) === this.Unset;
    },

    hasRight(val: number): boolean {
        return hasSetBit(val, this.Right);
    },
    hasWidth(val: number): boolean {
        return hasSetBit(val, this.Width);
    },
    hasLeft(val: number): boolean {
        return hasSetBit(val, this.Left);
    },
    hasBottom(val: number): boolean {
        return hasSetBit(val, this.Bottom);
    },
    hasHeight(val: number): boolean {
        return hasSetBit(val, this.Height);
    },
    hasTop(val: number): boolean {
        return hasSetBit(val, this.Top);
    },

    setRight(val: number, b: boolean): number {
        return setBit(val, this.Right, b);
    },
    setWidth(val: number, b: boolean): number {
        return setBit(val, this.Width, b);
    },
    setLeft(val: number, b: boolean): number {
        return setBit(val, this.Left, b);
    },
    setBottom(val: number, b: boolean): number {
        return setBit(val, this.Bottom, b);
    },
    setHeight(val: number, b: boolean): number {
        return setBit(val, this.Height, b);
    },
    setTop(val: number, b: boolean): number {
        return setBit(val, this.Top, b);
    },
}

export const RECT_POINTS = (() => {
    const id1 = "f9bbacab-970e-4bb6-9df2-32b02ea26ccc"
    const id2 = "114f9903-1a14-4534-a7bf-ae10c77c39ff"
    const id3 = "a22094f2-6e4d-4d64-ab35-13fe5452f3a5"
    const id4 = "9407a2d0-e77b-4a44-a064-90f611342e39"
    const p1 = new CurvePoint(
        new CrdtIndex([0]),
        id1, 0, 0, CurveMode.Straight
    );
    const p2 = new CurvePoint(
        new CrdtIndex([1]),
        id2, 1, 0, CurveMode.Straight
    );
    const p3 = new CurvePoint(
        new CrdtIndex([2]),
        id3, 1, 1, CurveMode.Straight
    );
    const p4 = new CurvePoint(
        new CrdtIndex([3]),
        id4, 0, 1, CurveMode.Straight
    );
    return [p1, p2, p3, p4];
})()

// export const SHAPE_VAR_SLOT = {
//     visible: "visible",
//     text: "text", // text shape
//     style: "style",
//     unionSymbolRef: "unionSymbolRef", // symbolshape
//     symbolRef: "symbolRef", // symbolrefshape
// }

// export const STYLE_VAR_SLOT = {
//     fills: "fills",
//     borders: "borders",
// }
