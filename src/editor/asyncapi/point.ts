/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, ShapeView, SymbolRefView } from "../../dataview";
import { RadiusType } from "../../data/consts";
import { OverrideType, ShapeType, SymbolRefShape } from "../../data/symbolref";
import { _ov, shape4cornerRadius } from "../symbol";
import {
    GroupShape,
    PathShape,
    PolygonShape,
    Shape,
    StarShape,
    SymbolShape,
    TextShape,
    VariableType
} from "../../data/shape";
import { Artboard } from "../../data/artboard";
import {
    calculateInnerAnglePosition,
    getPolygonPoints,
    getPolygonVertices,
} from "../utils/path";
import { Api } from "src/coop";

export class PointModifyHandler extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('point-modify');
    }

    executeCounts(shapes: ShapeView[], count: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                if (view.type !== ShapeType.Polygon && view.type !== ShapeType.Star) continue;
                const shape = adapt2Shape(shapes[i]) as PolygonShape | StarShape;
                if (shape.isVirtualShape || shape.haveEdit || shape.counts === count) {
                    continue;
                }
                const offset = shape.type === ShapeType.Star ? (shape as StarShape).innerAngle : undefined;
                const counts = getPolygonVertices(shape.type === ShapeType.Star ? count * 2 : count, offset);
                const points = getPolygonPoints(counts, view.radius[0]);
                api.deletePoints(page, shape, 0, shape.type === ShapeType.Star ? shape.counts * 2 : shape.counts, 0);
                api.addPoints(page, shape, points, 0);
                api.shapeModifyCounts(page, shape, count);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('PointModifyHandler.executeCounts', e);
        }
    }

    executeInnerAngle(shapes: ShapeView[], offset: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].type !== ShapeType.Star) continue;
                const shape = adapt2Shape(shapes[i]) as StarShape;
                if (shape.haveEdit || offset === shape.innerAngle) continue;
                const segment = shape?.pathsegs[0];
                if (!segment) continue;
                const points = segment?.points;
                if (!points?.length) continue;
                for (let index = 0; index < points.length; index++) {
                    if (index % 2 === 0) continue;
                    const angle = ((2 * Math.PI) / points.length) * index;
                    const p = calculateInnerAnglePosition(offset, angle);
                    api.shapeModifyCurvPoint(page, shape, index, p, 0);
                }
                api.shapeModifyInnerAngle(page, shape, offset);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('PointModifyHandler.executeCounts', e);
        }
    }
    getRadiusMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.RadiusMask, OverrideType.RadiusMask, () => value, view, page, api);
    }
    executeRadius(shapes: ShapeView[], values: number[]) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);

                if (shape.isVirtualShape) continue;
                if (shape.radiusMask) {
                    const variable = this.getRadiusMaskVariable(api, this.pageView, shapes[i], undefined);
                    if (variable) {
                        api.shapeModifyVariable(page, variable, undefined);
                    } else {
                        api.delradiusmask(shape);
                    }
                }

                if (shape.radiusType === RadiusType.Rect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, this.pageView, shapes[i] as SymbolRefView);
                        api.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape instanceof PathShape) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) continue;
                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        this.updateFrameTargets.add(shape);
                    } else {
                        const __shape = shape as Artboard | SymbolShape;
                        api.shapeModifyRadius2(page, __shape, lt, rt, rb, lb);
                    }
                } else {
                    if (shape instanceof PathShape) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) continue;
                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        this.updateFrameTargets.add(shape);
                    } else {
                        api.shapeModifyFixedRadius(page, shape as GroupShape | TextShape, values[0]);
                    }
                }
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeRadius', e);
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}