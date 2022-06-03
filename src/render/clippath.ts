import { Shape } from "@/data/shape";
import { EL, el } from "./element";

// let g_clippath_id = 0; // 要用稳定的id，避免不必要的dom更新
/**
 * return a clipPath el
 * @param shape 
 */
export function render(shape: Shape, id: string, path?: string): EL {
    const e = el("clipPath", {id});
    e.push(el("path", {d: path || shape.getPath()}));
    return e;
}