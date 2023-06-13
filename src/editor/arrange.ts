import { translate } from "./frame";
import { Shape } from "data/shape";
// shapes 排列
export interface PositonAdjust {
    target: Shape
    transX: number
    transY: number
}
export function arrange(pas: PositonAdjust[]) {
    for (let i = 0; i < pas.length; i++) {
        const action = pas[i];
        translate(action.target, action.transX, action.transY)
    }
}