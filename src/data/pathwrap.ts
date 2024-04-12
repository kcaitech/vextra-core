import { Point2D } from "./typesdefine";

function S(p0: Point2D, p1: Point2D, x: number, y: number) {
    // -(x1y2 - x2y1)
    const x1 = p1.x - p0.x;
    const y1 = p1.y - p0.y;
    const x2 = x - p0.x;
    const y2 = y - p0.y;
    return -(x1 * y2 - x2 * y1); // 反转的坐标系
    // return (p0.x - x) * (p1.y - y) - (p0.y - y) * (p1.x - x);
}

function equal(p0: Point2D, p1: Point2D) {
    return p0.x === p1.x && p0.y === p1.y;
}

// 计算两条线段中线距离交点特定距离的线段前进方向的左右两点
function calccenterp(p0: Point2D, p1: Point2D, p2: Point2D, delta: number): Point2D[] {

    if (equal(p0, p1)) return calcleftp(p1, p2, delta);
    if (equal(p1, p2)) return calcrightp(p0, p1, delta);

    const d = (p0.x + p2.x - 2 * p1.x);
    const a = d === 0 ? 0 : (p0.y + p2.y - 2 * p1.y) / d;
    const b = d === 0 ? 0 : Math.sqrt(delta ** 2 / (a ** 2 + 1));

    const x0 = (b + p1.x);
    const x1 = (-b + p1.x);

    // 求y
    const y0 = d === 0 ? (p1.y + delta) : a * (x0 - p1.x) + p1.y;
    const y1 = d === 0 ? (p1.y - delta) : a * (x1 - p1.x) + p1.y;

    // 判断左右
    const _s = S(p0, p1, x0, y0);
    if (_s > 0) {
        return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
    } else if (_s < 0) {
        return [{ x: x1, y: y1 }, { x: x0, y: y0 }];
    } else {
        throw new Error();
    }
}

// 计算线段在起点的垂直线距离交点特定距离的线段前进方向的左右两点
function calcleftp(p0: Point2D, p1: Point2D, delta: number): Point2D[] {
    const d = (p1.y - p0.y);
    const a = d === 0 ? 0 : (- (p1.x - p0.x) / d);
    const b = d === 0 ? 0 : Math.sqrt(delta ** 2 / (a ** 2 + 1));

    const x0 = (b + p0.x);
    const x1 = (-b + p0.x);

    // 求y
    const y0 = d === 0 ? (p0.y + delta) : a * (x0 - p0.x) + p0.y;
    const y1 = d === 0 ? (p0.y - delta) : a * (x1 - p0.x) + p0.y;

    // 判断左右
    const _s = S(p1, p0, x0, y0);
    if (_s > 0) {
        return [{ x: x1, y: y1 }, { x: x0, y: y0 }];
    } else if (_s < 0) {
        return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
    } else {
        throw new Error();
    }
}

// 计算线段在终点的垂直线距离交点特定距离的线段前进方向的左右两点
function calcrightp(p0: Point2D, p1: Point2D, delta: number): Point2D[] {
    return calcleftp(p1, p0, delta).reverse();
}

// 连接两条路径
function join(points0: (string | number)[][], points1: (string | number)[][], width: number, endstyle: any) {
    // todo endstyle
    // 需要把move删除
    const p0 = points1[0];
    points0.push(['L', p0[1], p0[2]], ...points1.slice(1));
}

// 闭合路径
function close(points: (string | number)[][], width: number, endstyle: any) {
    // todo
    points.push(['Z']);
}

// 反转路径
function revert(points: (string | number)[][]) {
    // points.reverse().forEach(p => {
    //     const fromX = p.fromX;
    //     const fromY = p.fromY;
    //     const toX = p.toX;
    //     const toY = p.toY;
    //     const hasFrom = p.hasFrom;
    //     const hasTo = p.hasTo;
    //     p.hasFrom = undefined;
    //     p.hasTo = undefined;
    //     if (hasFrom) {
    //         p.hasTo = true;
    //         p.toY = fromY;
    //         p.toX = fromX;
    //     }
    //     if (hasTo) {
    //         p.hasFrom = true;
    //         p.fromY = toY;
    //         p.fromX = toX;
    //     }
    // })

    const getlastp = (item: (string | number)[]) => {
        switch (item[0]) {
            case 'M':
                return { x: item[1], y: item[2] }
            case 'L':
                return { x: item[1], y: item[2] }
            case 'C':
                return { x: item[5], y: item[6] }
            case 'Z':
            default:
                throw new Error();
        }
    }

    const ret: (string | number)[][] = [];
    // let isClosed = false;
    for (let i = points.length - 1; i >= 0; --i) {
        const item = points[i];
        switch (item[0]) {
            case 'M':
                break;
            case 'L':
                if (ret.length === 0) {
                    ret.push(['M', item[1], item[2]]);
                }
                if (i > 0) {
                    const prep = getlastp(points[i - 1]);
                    ret.push(['L', prep.x, prep.y]);
                } else {
                    throw new Error();
                }
                break;
            case 'C':
                if (ret.length === 0) {
                    ret.push(['M', item[5], item[6]]);
                }
                if (i > 0) {
                    const prep = getlastp(points[i - 1]);
                    ret.push(['C', item[3], item[4], item[1], item[2], prep.x, prep.y]);
                } else {
                    throw new Error();
                }
                break;
            case 'Z':
            // isClosed = true;
            // break;
            default:
                throw new Error();
        }
    }
    // if (isClosed) ret.push(['Z']);

    return ret;
}

// 由points生成路径
function genpoints(track: (string | number)[][], points: Point2D[]): (string | number)[][] {
    const ret: (string | number)[][] = [];

    let index = 0;
    track.forEach(p => {
        switch (p[0]) {
            case 'M':
                ret.push(['M', points[index].x, points[index].y]);
                ++index;
                break;
            case 'L':
                ret.push(['L', points[index].x, points[index].y]);
                ++index;
                break;
            case 'C':
                ret.push(['C', points[index].x, points[index].y, points[index + 1].x, points[index + 1].y, points[index + 2].x, points[index + 2].y]);
                index += 3;
                break;
            case 'Z':
                break;
            default:
                throw new Error();
        }
    })

    if (index !== points.length) throw new Error();

    return ret;
}

class Ctx {
    ret: Point2D[][] = []
    prep?: Point2D
}
const handler: { [key: string]: (ctx: Ctx, item: (string | number)[], delta: number, nexitem: (string | number)[] | undefined) => void } = {}
handler['M'] = (ctx: Ctx, item: (string | number)[], delta: number, nexitem: (string | number)[] | undefined) => {
    const cur = { x: item[1] as number, y: item[2] as number }
    if (!nexitem) {
        ctx.ret.push([cur, cur]);
    } else {
        const nextp = { x: nexitem[1] as number, y: nexitem[2] as number }
        ctx.ret.push(calcleftp(cur, nextp, delta));
    }
    ctx.prep = cur;
}
handler['L'] = (ctx: Ctx, item: (string | number)[], delta: number, nexitem: (string | number)[] | undefined) => {
    const cur = { x: item[1] as number, y: item[2] as number }
    if (!ctx.prep) throw new Error();
    const prep = ctx.prep;
    if (nexitem) {
        const nextp = { x: nexitem[1] as number, y: nexitem[2] as number }
        ctx.ret.push(calccenterp(prep, cur, nextp, delta));
    } else {
        ctx.ret.push(calcrightp(prep, cur, delta));
    }
    ctx.prep = cur;
}

handler['C'] = (ctx: Ctx, item: (string | number)[], delta: number, nexitem: (string | number)[] | undefined) => {
    const p1 = { x: item[1] as number, y: item[2] as number }
    const p2 = { x: item[3] as number, y: item[4] as number }
    const p3 = { x: item[5] as number, y: item[6] as number }
    if (!ctx.prep) throw new Error();
    const p0 = ctx.prep;

    // 计算p1 p2 p3
    ctx.ret.push(calccenterp(p0, p1, p2, delta));
    ctx.ret.push(calccenterp(p1, p2, p3, delta));

    if (nexitem) {
        const nextp = { x: nexitem[1] as number, y: nexitem[2] as number }
        ctx.ret.push(calccenterp(p2, p3, nextp, delta));
    } else {
        ctx.ret.push(calcrightp(p2, p3, delta));
    }

    ctx.prep = p3;
}

handler['Z'] = () => {

}

export function pathwrap(path: (string | number)[][], thickness: number, endstyle: any): (string | number)[][] {

    // 只处理 MLCZ
    // todo 仅一条路径，多条时外面再分割一下

    const delta = thickness / 2;
    const hctx = new Ctx();
    for (let i = 0, len = path.length; i < len; ++i) {
        const item = path[i];
        const h = handler[item[0]];
        if (!h) throw new Error('no support pathwrap: ' + item[0]); // todo

        let nextitem;
        if (i < len - 1) {
            nextitem = path[i + 1]; // 可能是Z
            if (nextitem[0] === 'Z') {
                nextitem = path[0];
            }
        }
        h(hctx, item, delta, nextitem);
    }

    // const wrappoints = path.reduce((wrappoints: Point2D[][], p: CurvePoint, index: number) => {
    //     const pre = index === 0 ? (isClosed ? points[points.length - 1] : undefined) : points[index - 1];
    //     const _prep = pre ? (pre.hasTo ? { x: pre.toX || 0, y: pre.toY || 0 } : pre) : undefined;
    //     const prep = _prep ? transp(_prep) : undefined;
    //     const from = transp({ x: p.fromX || 0, y: p.fromY || 0 });
    //     const to = transp({ x: p.toX || 0, y: p.toY || 0 });
    //     const cur = transp(p);
    //     if (p.hasFrom) {
    //         if (prep) wrappoints.push(calcp1(prep, from, cur, delta))
    //         else wrappoints.push(calcp2(from, cur, delta))
    //     }
    //     const prep1 = p.hasFrom ? from : prep;
    //     const next = index === points.length - 1 ? (isClosed ? points[0] : undefined) : points[index + 1];
    //     const _nextp = next ? (next.hasFrom ? { x: next.fromX || 0, y: next.fromY || 0 } : next) : undefined;
    //     const nextp = _nextp ? transp(_nextp) : undefined;
    //     const nextp1 = p.hasTo ? to : nextp;

    //     if (prep1 && nextp1) wrappoints.push(calcp1(prep1, cur, nextp1, delta));
    //     else if (prep1) wrappoints.push(calcp3(prep1, cur, delta));
    //     else if (nextp1) wrappoints.push(calcp2(cur, nextp1, delta));
    //     // else throw new Error(); // 只有一个点的路径？？

    //     if (p.hasTo) {
    //         if (nextp) wrappoints.push(calcp1(cur, to, nextp, delta));
    //         else wrappoints.push(calcp3(cur, to, delta));
    //     }
    //     return wrappoints;
    // }, [])

    const wrappoints = hctx.ret.reduce((wps: { lhs: Point2D[], rhs: Point2D[] }, p: Point2D[]) => {
        if (p.length !== 2) throw new Error();
        wps.lhs.push(p[0]);
        wps.rhs.push(p[1]);
        return wps;
    }, { lhs: [], rhs: [] });


    const lhs = genpoints(path, wrappoints.lhs);
    const rhs = genpoints(path, wrappoints.rhs);

    const revertrhs = revert(rhs);
    join(lhs, revertrhs, thickness, endstyle);
    close(lhs, thickness, endstyle);

    return lhs;

    // throw new Error();
}