import { Color } from "./classes";

export function isColorEqual(lhs: Color, rhs: Color): boolean {
    return lhs.alpha === rhs.alpha &&
        lhs.blue === rhs.blue &&
        lhs.green === rhs.green &&
        lhs.red === rhs.red;
}