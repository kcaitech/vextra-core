import { Color } from "../../../data";
import { IJSON } from "./basic";

export function importColor(color: IJSON, opacity: number = 1) {
    if (!color) color = {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
    };
    return new Color(color.a * opacity, Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255));
}
