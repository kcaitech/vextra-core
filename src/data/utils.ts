import { Matrix } from "../basic/matrix";
import { Shape } from "./shape";

/**
 * @description root -> 图形自身上且单位为比例系数的矩阵
 */
export function gen_matrix1(shape: Shape) {
    const f = shape.frame;
    let m = shape.matrix2Root();
    m.preScale(f.width, f.height);
    m = new Matrix(m.inverse);
    return m;
}
/**
 * @description 检查p3是否在p1和p2之间，如果是，则p2为无效点，需要去除
 */
export function is_p1_p3_p2(p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }) {

}