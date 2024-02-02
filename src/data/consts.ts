import { CurveMode, CurvePoint, Point2D } from "./baseclasses";

function hasSetBit(val: number, mask: number): boolean {
    return !(val & mask);
}
function setBit(val: number, mask: number, b: boolean): number {
    return b ? (val ^ mask) : (val ^ (~~mask));
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
    hasLR(val: number): boolean {
        return this.hasLeft(val) && this.hasRight(val)
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
    setLR(val: number, b: boolean): number {
        return this.setRight(val, b) & this.setLeft(val, b)
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
    setTB(val: number, b: boolean): number {
        return this.setTop(val, b) & this.setBottom(val, b)
    },
}

export const ResizingConstraints2 = {
    Mask: 0b111111,
    Right: 0b000001, // 1
    Width: 0b000010, // 2
    Left: 0b000100, // 4
    Bottom: 0b001000, // 8
    Height: 0b010000, // 16
    Top: 0b100000, // 32

    // horizontal
    isFixedToLeft(val: number): boolean { // 1. 只要是靠左但是不靠右，那一定是靠左固定，不需要考虑其他
        val = this.Mask ^ val;
        return (val & this.Left) === this.Left && (val & this.Right) !== this.Right;
    },

    isFixedToRight(val: number): boolean { // 2. 只要是靠右但不靠左，那一定是靠右固定，不需要考虑其他
        val = this.Mask ^ val;
        return (val & this.Left) !== this.Left && (val & this.Right) === this.Right;
    },

    isFixedLeftAndRight(val: number): boolean { // 3. 只要是既是靠左又是靠右，那一定是左右固定，不需要考虑其他
        val = this.Mask ^ val;
        return (val & this.Left) === this.Left && (val & this.Right) === this.Right;
    },

    isHorizontalJustifyCenter(val: number): boolean { // 4. 既不靠左、也不靠右，但是宽度固定，就是居中
        val = this.Mask ^ val;
        return (val & this.Left) !== this.Left && (val & this.Right) !== this.Right && (val & this.Width) === this.Width;
    },

    isFlexWidth(val: number): boolean { // 5. 既不靠左、也不靠右、而且宽度还不固定，就是跟随缩放
        val = this.Mask ^ val;
        return (val & this.Left) !== this.Left && (val & this.Right) !== this.Right && (val & this.Width) !== this.Width;
    },

    /**
     * @description 是否宽度被固定，固定宽度是靠左、靠右、居中自带的，并且与跟随缩放互斥
     */
    isFixedWidth(val: number): boolean {
        val = this.Mask ^ val;
        return (val & this.Width) === this.Width;
    },

    /**
     * @description 1. 设置为靠右固定
     */
    setToFixedLeft(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Right; // 有靠右则取消靠右

        status = status | this.Left;
        status = status | this.Width; // 自带宽度固定

        return this.Mask ^ status;
    },

    /**
     * @description 2. 设置为靠右固定
     */
    setToFixedRight(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Left;

        status = status | this.Right;
        status = status | this.Width; // 自带宽度固定

        return this.Mask ^ status;
    },

    /**
     * @description 3. 设置为靠左靠右固定
     */
    setToFixedLeftAndRight(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Width; // 与宽度固定互斥

        status = status | this.Right;
        status = status | this.Left;

        return this.Mask ^ status;
    },

    /**
     * @description 4. 设置为水平居中
     */
    setToHorizontalJustifyCenter(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Left;
        status = status & ~this.Right;

        status = status | this.Width; // 一定要有宽度固定，不然就成了跟随缩放了

        return this.Mask ^ status;
    },

    /**
     * @description 5. 设置为水平跟随缩放
     */
    setToWidthFlex(status: number) { // 设置为水平方向上跟随缩放，即不左、不右、不定宽
        status = this.Mask ^ status;

        status = status & ~this.Width; // 水平上的值都不要有
        status = status & ~this.Left;
        status = status & ~this.Right;

        return this.Mask ^ status;
    },

    /**
     * @deprecated 固定宽度是和左、右、中同时存在并和左右互斥的，所以应该不能有固定宽度这个选项
     */
    setToWidthFixed(status: number) {
        status = this.Mask ^ status;

        if ((status & this.Left) === this.Left && (status & this.Right) === this.Right) {
            status = status ^ this.Left;
            status = status ^ this.Right;
        }
        // if ((status & this.Right) === this.Right) {
        //     status = status ^ this.Right;
        // }

        if ((status & this.Width) !== this.Width) {
            status = status ^ this.Width;
        }

        return this.Mask ^ status;
    },

    // Vertical
    isFixedToTop(val: number): boolean {
        val = this.Mask ^ val;
        return (val & this.Top) === this.Top && (val & this.Bottom) !== this.Bottom;
    },

    isFixedToBottom(val: number): boolean {
        val = this.Mask ^ val;
        return (val & this.Top) !== this.Top && (val & this.Bottom) === this.Bottom;
    },

    isFixedTopAndBottom(val: number): boolean {
        val = this.Mask ^ val;
        return (val & this.Top) === this.Top && (val & this.Bottom) === this.Bottom;
    },

    isVerticalJustifyCenter(val: number): boolean {
        val = this.Mask ^ val;
        return (val & this.Top) !== this.Top && (val & this.Bottom) !== this.Bottom && (val & this.Height) === this.Height
    },

    isFlexHeight(val: number) {
        val = this.Mask ^ val
        return (val & this.Top) !== this.Top && (val & this.Bottom) !== this.Bottom && (val & this.Height) !== this.Height
    },

    isFixedHeight(val: number): boolean {
        val = this.Mask ^ val;
        return (val & this.Height) === this.Height;
    },

    setToFixedTop(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Bottom;

        status = status | this.Top;
        status = status | this.Height;

        return this.Mask ^ status;
    },

    setToFixedBottom(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Top

        status = status | this.Bottom
        status = status | this.Height;

        return this.Mask ^ status;
    },

    setToFixedTopAndBottom(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Height

        status = status | this.Top;
        status = status | this.Bottom;

        return this.Mask ^ status;
    },

    setToVerticalJustifyCenter(status: number) {
        status = this.Mask ^ status;

        status = status & ~this.Top
        status = status & ~this.Bottom

        status = status | this.Height

        return this.Mask ^ status;
    },

    setToHeightFlex(status: number) {
        status = this.Mask ^ status

        status = status & ~this.Top
        status = status & ~this.Bottom
        status = status & ~this.Height

        return this.Mask ^ status
    },

    /**
     * 
     * @deprecated
     */
    setToHeightFixed(status: number) {
        status = this.Mask ^ status;

        if ((status & this.Top) === this.Top && (status & this.Bottom) === this.Bottom) {
            status = status ^ this.Top;
            status = status ^ this.Bottom;
        }
        // if ((status & this.Bottom) === this.Bottom) {
        //     status = status ^ this.Bottom;
        // }

        if ((status & this.Height) !== this.Height) {
            status = status ^ this.Height;
        }

        return this.Mask ^ status;
    },

}

export const RECT_POINTS = (() => {
    const id1 = "f9bbacab-970e-4bb6-9df2-32b02ea26ccc"
    const id2 = "114f9903-1a14-4534-a7bf-ae10c77c39ff"
    const id3 = "a22094f2-6e4d-4d64-ab35-13fe5452f3a5"
    const id4 = "9407a2d0-e77b-4a44-a064-90f611342e39"
    const p1 = new CurvePoint(
        id1, 0, 0, CurveMode.Straight
    );
    const p2 = new CurvePoint(
        id2, 1, 0, CurveMode.Straight
    );
    const p3 = new CurvePoint(
        id3, 1, 1, CurveMode.Straight
    );
    const p4 = new CurvePoint(
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
