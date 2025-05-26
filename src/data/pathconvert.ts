/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CurveMode, CurvePoint } from "./baseclasses";
import { float_accuracy } from "../basic/consts";
import { BasicArray } from "./basic";
import { uuid } from "../basic/uuid";
import { Path } from "@kcdesign/path";

// path -> curvpoint[]
// ----------------------------------------------------------------------------------
// 将路径中的相对值转换为绝对坐标
type CurvSeg = {
    beginpoint: { x: number, y: number },
    prepoint: { x: number, y: number },
    points: CurvePoint[],

    preHandle: { x: number, y: number },
    lastCommand: string;

    isClosed?: boolean,
}

type CurvCtx = {
    width: number,
    height: number,
    segs: CurvSeg[], // 初始化时至少给一个
}


function curveHandleLine(seg: CurvSeg, x: number, y: number) {
    if (!seg.points.length) {
        const point = new CurvePoint([0] as BasicArray<number>, uuid(), seg.beginpoint.x, seg.beginpoint.y, CurveMode.Straight);
        seg.points.push(point);
    }

    const point = new CurvePoint([seg.points.length] as BasicArray<number>, uuid(), x, y, CurveMode.Straight);
    seg.points.push(point);

    seg.prepoint.x = x;
    seg.prepoint.y = y;
}

function curveHandleBezier(seg: CurvSeg, x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    const len = seg.points.length;
    if (len) {
        const prePoint = seg.points[seg.points.length - 1];
        prePoint.hasFrom = true;
        prePoint.fromX = x1;
        prePoint.fromY = y1;
    } else {
        const point = new CurvePoint([0] as BasicArray<number>, uuid(), seg.beginpoint.x, seg.beginpoint.y, CurveMode.Asymmetric);
        point.hasFrom = true;
        point.fromX = x1;
        point.fromY = y1;
        seg.points.push(point);
    }

    const point = new CurvePoint([len] as BasicArray<number>, uuid(), x, y, CurveMode.Asymmetric);
    point.hasTo = true;
    point.toX = x2;
    point.toY = y2;

    seg.prepoint = { x, y };
    seg.preHandle = { x: x2, y: y2 };

    seg.points.push(point);
}

function curveHandleQuaBezier(seg: CurvSeg, cx: number, cy: number, x: number, y: number) {
    const len = seg.points.length;
    let pre: CurvePoint;
    if (len) {
        pre = seg.points[seg.points.length - 1];
    } else {
        pre = new CurvePoint([0] as BasicArray<number>, uuid(), seg.beginpoint.x, seg.beginpoint.y, CurveMode.Asymmetric);
        seg.points.push(pre);
    }
    const hdl1 = {x: pre.x / 3 + 2 * cx / 3, y: pre.y / 3 + 2 * cy / 3};
    const hdl2 = {x: x / 3 + 2 * cx / 3, y: y / 3 + 2 * cy / 3};
    pre.hasFrom = true;
    pre.fromX = hdl1.x;
    pre.fromY = hdl1.y;
    seg.preHandle = {x: hdl2.x, y: hdl2.y};
    seg.prepoint = {x, y};
    const point = new CurvePoint([len] as BasicArray<number>, uuid(), x, y, CurveMode.Asymmetric);
    point.hasTo = true;
    point.toX = hdl2.x;
    point.toY = hdl2.y;
    seg.points.push(point);
}

export function convertPath2CurvePoints(path: Path, width: number, height: number): {
    points: CurvePoint[],
    isClosed: boolean
}[] {
    const ctx: CurvCtx = {
        width,
        height,
        segs: []
    };
    ctx.segs.push({
        beginpoint: { x: 0, y: 0 },
        prepoint: { x: 0, y: 0 },
        points: [],

        preHandle: { x: 0, y: 0 },
        lastCommand: 'M'
    });

    const cmds = path.getCmds();

    for (let i = 0, len = cmds.length; i < len; i++) {
        const p = cmds[i];
        const x = p.start.x;
        const y = p.start.y;
        const seg = {
            beginpoint: { x, y },
            prepoint: { x, y },
            points: [],

            preHandle: { x, y },
            lastCommand: 'M'
        }

        ctx.segs.push(seg);

        p.cmds.forEach(cmd => {
            switch (cmd.type) {
                case "C": {
                    const seg = ctx.segs[ctx.segs.length - 1];

                    curveHandleBezier(seg, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);

                    seg.lastCommand = 'C';
                    break;
                }
                case "L": {
                    const seg = ctx.segs[ctx.segs.length - 1];

                    curveHandleLine(seg, cmd.x, cmd.y);

                    seg.lastCommand = 'L';
                    break;
                }
                case "Q": {
                    const seg = ctx.segs[ctx.segs.length - 1];

                    curveHandleQuaBezier(seg, cmd.x1, cmd.y1, cmd.x, cmd.y);

                    seg.lastCommand = 'C';
                }
            }
        })

        if (p.isClose) {
            const seg = ctx.segs[ctx.segs.length - 1];

            seg.isClosed = true;

            seg.prepoint.x = seg.beginpoint.x;
            seg.prepoint.y = seg.beginpoint.y;

            seg.lastCommand = 'Z';
        }
    }

    // 最后个
    for (let i = 0, len = ctx.segs.length; i < len; i++) {
        const seg = ctx.segs[i];

        const len = seg.points.length;

        if (len <= 1) continue;

        const p0 = seg.points[0];
        const pe = seg.points[len - 1];

        if (Math.abs(pe.x - p0.x) < float_accuracy && Math.abs(pe.y - p0.y) < float_accuracy) {
            seg.isClosed = true;
            if (pe.hasTo) {
                p0.hasTo = true;
                p0.toX = pe.toX;
                p0.toY = pe.toY;
            }

            seg.points.splice(len - 1, 1); // 删掉最后个重复的
        }
    }

    const ret: {
        points: CurvePoint[],
        isClosed: boolean
    }[] = []

    for (let i = 0, len = ctx.segs.length; i < len; i++) {
        const seg = ctx.segs[i];
        if (seg.points.length <= 1) continue;

        ret.push({ points: seg.points, isClosed: !!seg.isClosed })
    }

    ret.forEach((seg) => {
        seg.points = seg.points.map((p) => {
            if (p.hasFrom) {
                p.fromX = (p.fromX || 0) / width;
                p.fromY = (p.fromY || 0) / height;
            }
            if (p.hasTo) {
                p.toX = (p.toX || 0) / width;
                p.toY = (p.toY || 0) / height;
            }
            p.x /= width;
            p.y /= height;
            return p;
        })
    })

    return ret;
}


