import { Shape } from "../data/classes";
import { render as renderB } from "./contact_borders";

export function render(h: Function, shape: Shape, path: string, reflush?: number) {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const frame = shape.frame;
    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }
    props.transform = `translate(${frame.x},${frame.y})`
    let childs = new Array();
    // const tps = shape.getTemp(); // 路径计算时可能会经过的点

    // const tps = shape.green_points(); // 绿点
    // if (tps && tps.length) {
    //     const matrixx = new Matrix();
    //     matrixx.preScale(frame.width, frame.height);
    //     for (let i = 0; i < tps.length; i++) {
    //         const p = matrixx.computeCoord3(tps[i].point);
    //         childs.push(h('rect', { x: p.x - 5, y: p.y - 5, width: 10, height: 10, fill: 'green', rx: 5, ry: 5, 'fill-opacity': 0.6 }));
    //     }
    // }

    // const res = shape.getTemp2();
    // if (res) {
    //     const { points1, points2, points3 } = res;
    //     if (points1 && points1.length) {
    //         const matrixx = new Matrix();
    //         matrixx.preScale(frame.width, frame.height);
    //         for (let i = 0; i < points1.length; i++) {
    //             const p = matrixx.computeCoord3(points1[i].point);
    //             childs.push(h('rect', { x: p.x - 3, y: p.y - 3, width: 6, height: 6, fill: 'green', rx: 3, ry: 3, 'fill-opacity': 0.6 }));
    //         }
    //     }
    //     if (points2 && points2.length) {
    //         const matrixx = new Matrix();
    //         matrixx.preScale(frame.width, frame.height);
    //         for (let i = 0; i < points2.length; i++) {
    //             const p = matrixx.computeCoord3(points2[i].point);
    //             childs.push(h('rect', { x: p.x - 4, y: p.y - 4, width: 8, height: 8, fill: 'red', rx: 4, ry: 4, 'fill-opacity': 0.6 }));
    //         }
    //     }
    //     if (points3 && points3.length) {
    //         const matrixx = new Matrix();
    //         matrixx.preScale(frame.width, frame.height);
    //         for (let i = 0; i < points3.length; i++) {
    //             const p = matrixx.computeCoord3(points3[i].point);
    //             childs.push(h('rect', { x: p.x - 5, y: p.y - 5, width: 10, height: 10, fill: 'yellow', rx: 5, ry: 5, 'fill-opacity': 0.6 }));
    //         }
    //     }
    // }

    // const tps2 = shape.yellow_points(); // 黄色： points上真实存在的点 + 起始点
    // if (tps2 && tps2.length) {
    //     const matrixx = new Matrix();
    //     matrixx.preScale(frame.width, frame.height);
    //     for (let i = 0; i < tps2.length; i++) {
    //         const p = matrixx.computeCoord3(tps2[i].point);
    //         childs.push(h('rect', { x: p.x - 6, y: p.y - 6, width: 12, height: 12, fill: 'yellow', rx: 6, ry: 6, 'fill-opacity': 0.6 }));
    //     }
    // }
    // const tps3 = shape.getPoints(); // 最终在屏幕上展示的点
    // if (tps3 && tps3.length) {
    //     const matrixx = new Matrix();
    //     matrixx.preScale(frame.width, frame.height);
    //     for (let i = 0; i < tps3.length; i++) {
    //         const p = matrixx.computeCoord3(tps3[i].point);
    //         childs.push(h('rect', { x: p.x - 3, y: p.y - 3, width: 6, height: 6, fill: 'red', rx: 3, ry: 3, 'fill-opacity': 0.6 }));
    //     }
    // }

    // let mark_id: any;
    // if (!shape.mark) {
    //     const tps3 = shape.getPoints(); // 最终在屏幕上展示的点
    //     let points: { x: number, y: number }[] = []
    //     if (tps3 && tps3.length) {
    //         const matrixx = new Matrix();
    //         matrixx.preScale(frame.width, frame.height);
    //         for (let i = 0; i < tps3.length; i++) {
    //             points.push(matrixx.computeCoord3(tps3[i].point));
    //         }
    //     }
    //     const box = XYsBounding(points);
    //     mark_id = 'mask-' + objectId(shape);
    //     childs.push(renderM(h, shape, mark_id, box, { x: 0, y: 0 }));
    //     childs.push(renderTextLayout(h, shape.getTextLayout()));
    // }
    if (shape.style.borders.length) {
        childs.push(...renderB(h, shape.style, path, shape));
        return h('g', props, childs);
    } else {
        // props.stroke = '#808080';
        // props['stroke-width'] = 2;
        // props.d = path;
        // props.fill = "none"
        // return h('path', props);
    }
}