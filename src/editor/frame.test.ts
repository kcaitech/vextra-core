import * as chai from 'chai'
import { DataGuard } from '../data/notransact';
import { ShapeFrame } from '../data/shape';
import { newPage, newRectShape } from './creator';
import { adjustLB2, adjustLT2, adjustRB2, adjustRT2 } from './frame';
import { updateFrame } from './command/utils';
import * as api from './basicapi'

const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

// function adjLT(s: Shape, dx: number, dy: number) {
//     const frame = s.frame2Page();
//     adjustLT2(s, frame.x + dx, frame.y + dy);
// }
// function adjLB(s: Shape, dx: number, dy: number) {
//     const m = s.matrix2Page();
//     const xy = m.computeCoord(0, s.frame.height)
//     adjustLB2(s, xy.x + dx, xy.y + dy);
// }
// function adjRT(s: Shape, dx: number, dy: number) {
//     const m = s.matrix2Page();
//     const xy = m.computeCoord(s.frame.width, 0)
//     adjustRT2(s, xy.x + dx, xy.y + dy);
// }
// function adjRB(s: Shape, dx: number, dy: number) {
//     const frame = s.frame2Page();
//     adjustRB2(s, frame.x + frame.width + dx, frame.y + frame.height + dy);
// }

test("lt", () => {
    const guard = new DataGuard();
    const page = guard.guard(newPage("Page1"));

    const shape = newRectShape("Rect", new ShapeFrame(0, 0, 100, 100));
    shape.rotate(30);
    page.addChild(shape);
    updateFrame(page, shape, api);

    const dx = 1, dy = 1;
    const frame = shape.frame2Page();
    const x = frame.x + dx;
    const y = frame.y + dy;

    const save_rb = shape.matrix2Page().computeCoord(shape.frame.width, shape.frame.height)

    adjustLT2(api, page, shape, x, y);
    updateFrame(page, shape, api);

    const m2p = shape.matrix2Page();
    const lt = m2p.computeCoord(0, 0);
    const rb = m2p.computeCoord(shape.frame.width, shape.frame.height);
    // check

    const float_accuracy = 1e-7;
    isTrue(Math.abs(lt.x - x) < float_accuracy && Math.abs(lt.y - y) < float_accuracy, "lt wrong, expect:" + x + ", " + y + " get: " + JSON.stringify(lt))
    isTrue(Math.abs(rb.x - save_rb.x) < float_accuracy && Math.abs(rb.y - save_rb.y) < float_accuracy, "rb wrong, expect: " + save_rb + " get: " + rb)
})

test("lb", () => {
    const guard = new DataGuard();
    const page = guard.guard(newPage("Page1"));

    const shape = newRectShape("Rect", new ShapeFrame(0, 0, 100, 100));
    shape.rotate(30);
    page.addChild(shape);
    updateFrame(page, shape, api);

    const dx = 1, dy = 1;
    const m = shape.matrix2Page();
    const xy = m.computeCoord(0, shape.frame.height)
    const x = xy.x + dx;
    const y = xy.y + dy;

    const save_rt = m.computeCoord(shape.frame.width, 0)

    adjustLB2(api, page, shape, x, y);
    updateFrame(page, shape, api);

    // debug
    const m2p = shape.matrix2Page();
    const lb = m2p.computeCoord(0, shape.frame.height);
    const rt = m2p.computeCoord(shape.frame.width, 0);
    // check

    const float_accuracy = 1e-7;
    isTrue(Math.abs(rt.x - save_rt.x) < float_accuracy && Math.abs(rt.y - save_rt.y) < float_accuracy)
    isTrue(Math.abs(lb.x - x) < float_accuracy && Math.abs(lb.y - y) < float_accuracy)
})

test("rb", () => {
    const guard = new DataGuard();
    const page = guard.guard(newPage("Page1"));

    const shape = newRectShape("Rect", new ShapeFrame(0, 0, 100, 100));
    shape.rotate(30);
    page.addChild(shape);
    updateFrame(page, shape, api);

    const dx = 1, dy = 1;
    const frame = shape.frame2Page();
    const x = frame.x + frame.width + dx;
    const y = frame.y + frame.height + dy;

    const __m2p = shape.matrix2Page();
    const __saveLT = __m2p.computeCoord(0, 0)

    adjustRB2(api, page, shape, x, y);
    updateFrame(page, shape, api);

    // debug
    const m = shape.matrix2Page();
    const lt = m.computeCoord(0, 0);
    const rb = m.computeCoord(shape.frame.width, shape.frame.height);
    // check

    const float_accuracy = 1e-7;
    isTrue(Math.abs(lt.x - __saveLT.x) < float_accuracy && Math.abs(lt.y - __saveLT.y) < float_accuracy)
    isTrue(Math.abs(rb.x - x) < float_accuracy && Math.abs(rb.y - y) < float_accuracy)
})


test("rt", () => {
    const guard = new DataGuard();
    const page = guard.guard(newPage("Page1"));

    const shape = newRectShape("Rect", new ShapeFrame(0, 0, 100, 100));
    shape.rotate(30);
    page.addChild(shape);
    updateFrame(page, shape, api);

    const dx = 1, dy = 1;
    const m = shape.matrix2Page();
    const xy = m.computeCoord(shape.frame.width, 0)
    const x = xy.x + dx;
    const y = xy.y + dy;

    const __m2p = shape.matrix2Page();
    const __saveLB = __m2p.computeCoord(0, shape.frame.height)

    adjustRT2(api, page, shape, x, y);
    updateFrame(page, shape, api);

    // debug
    const m2p = shape.matrix2Page();
    const lb = m2p.computeCoord(0, shape.frame.height);
    const rt = m2p.computeCoord(shape.frame.width, 0);
    // check

    const float_accuracy = 1e-7;
    isTrue(Math.abs(lb.x - __saveLB.x) < float_accuracy && Math.abs(lb.y - __saveLB.y) < float_accuracy)
    isTrue(Math.abs(rt.x - x) < float_accuracy && Math.abs(rt.y - y) < float_accuracy)
})