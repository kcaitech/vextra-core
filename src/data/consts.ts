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
