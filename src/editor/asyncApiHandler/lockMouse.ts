import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, ShapeView, SymbolRefView } from "../../dataview";
import { expand, translate } from "../frame";
import { RadiusType } from "../../data/consts";
import { ShapeType, SymbolRefShape } from "../../data/symbolref";
import { shape4cornerRadius } from "../symbol";
import { GroupShape, PathShape, PathShape2, PolygonShape, Shape, StarShape, SymbolShape, TextShape } from "../../data/shape";
import { Artboard } from "../../data/artboard";
import { calculateInnerAnglePosition, getPolygonPoints, getPolygonVertices, update_frame_by_points } from "../utils/path";

export class LockMouseHandler extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('lock-mouse');
    }

    executeX(shapes: ShapeView[], dx: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }

                translate(api, page, shape, dx, 0);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeX', e);
        }
    }

    executeY(shapes: ShapeView[], dy: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }

                translate(api, page, shape, 0, dy);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeY', e);
        }
    }

    executeW(shapes: ShapeView[], dw: number) {
        try {
            const api = this.api;
            const page = this.page;
            const document = this.__document;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }

                expand(api, document, page, shape, dw, 0);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeW', e);
        }
    }

    executeH(shapes: ShapeView[], dh: number) {
        try {
            const api = this.api;
            const page = this.page;
            const document = this.__document;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }

                expand(api, document, page, shape, 0, dh);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeH', e);
        }
    }
    executeCounts(shapes: ShapeView[], count: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].type !== ShapeType.Polygon && shapes[i].type !== ShapeType.Star) continue;
                const shape = adapt2Shape(shapes[i]) as PolygonShape | StarShape;
                if (shape.isVirtualShape || shape.haveEdit || shape.counts === count) {
                    continue;
                }
                const offset = shape.type === ShapeType.Star ? (shape as StarShape).innerAngle : undefined;
                const counts = getPolygonVertices(shape.type === ShapeType.Star ? count * 2 : count, offset);
                const points = getPolygonPoints(counts, shape.radius[0]);
                api.deletePoints(page, shape, 0, shape.type === ShapeType.Star ? shape.counts * 2 : shape.counts);
                api.addPoints(page, shape, points);
                api.shapeModifyCounts(page, shape, count);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeCounts', e);
        }
    }
    executeInnerAngle(shapes: ShapeView[], value: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].type !== ShapeType.Star) continue;
                const shape = adapt2Shape(shapes[i]) as StarShape;
                let offset = shape.innerAngle + value;
                if (shape.haveEdit) continue;
                if (offset < 0.001) offset = 0.001;
                if (offset > 1) offset = 1;
                for (let index = 0; index < shape.points.length; index++) {
                    if (index % 2 === 0) continue;
                    const angle = ((2 * Math.PI) / shape.points.length) * index;
                    const p = calculateInnerAnglePosition(offset, angle);
                    api.shapeModifyCurvPoint(page, shape, index, p, -1);
                }
                api.shapeModifyInnerAngle(page, shape, offset);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeCounts', e);
        }
    }

    executeRotate(shapes: ShapeView[], deg: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);

                if (shape.isVirtualShape) {
                    continue;
                }

                const d = (shape.rotation || 0) + deg;

                api.shapeModifyRotate(page, shape, d)
            }

            this.updateView();
        } catch (e) {
            console.log('LockMouseHandler.executeRotate', e);
            this.exception = true;
        }
    }

    executeRadius(shapes: ShapeView[], values: number[]) {
        try {
            const api = this.api;
            const page = this.page;

            const updateFrameTargets = this.updateFrameTargets;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);

                if (shape.isVirtualShape) {
                    continue;
                }

                const isRect = shape.radiusType === RadiusType.Rect;

                if (isRect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, page, shapes[i] as SymbolRefView);
                        api.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape instanceof PathShape) {
                        const points = shape.points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, val);
                        }
                        updateFrameTargets.add(shape);
                    } else if (shape instanceof PathShape2) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        updateFrameTargets.add(shape);
                    } else {
                        const __shape = shape as Artboard | SymbolShape;
                        api.shapeModifyRadius2(page, __shape, lt, rt, rb, lb)
                    }
                } else {

                    if (shape instanceof PathShape) {
                        const points = shape.points;
                        for (let _i = 0; _i < points.length; _i++) {
                            if (points[_i].radius === values[0]) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, values[0]);
                        }
                        updateFrameTargets.add(shape);
                    } else if (shape instanceof PathShape2) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) {
                                    continue;
                                }

                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        updateFrameTargets.add(shape);
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

    executeShadowX(shapes: ShapeView[], idx: number, val: number) {
        try {
            const api = this.api;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }
                api.setShadowOffsetX(page, shape, idx, val);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowX');
        }
    }

    executeShadowY(shapes: ShapeView[], idx: number, val: number) {
        try {
            const api = this.api;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }
                api.setShadowOffsetY(page, shape, idx, val);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowY');
        }
    }

    executeShadowB(shapes: ShapeView[], idx: number, val: number) {
        try {
            const api = this.api;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }
                api.setShadowBlur(page, shape, idx, val);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowB');
        }
    }

    executeShadowS(shapes: ShapeView[], idx: number, val: number) {
        try {
            const api = this.api;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }
                api.setShadowSpread(page, shape, idx, val);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowS');
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            if (this.updateFrameTargets.size) {
                this.updateFrameTargets.forEach(shape => {
                    update_frame_by_points(this.api, this.page, shape);
                })
            }
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}