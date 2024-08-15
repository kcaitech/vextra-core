

import { Color } from "../data/classes";
export { findOverrideAndVar } from "../data/utils";

export function isColorEqual(lhs: Color, rhs: Color): boolean {
    return lhs.equals(rhs);
}

export const DefaultColor = Color.DefaultColor;

export function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}
