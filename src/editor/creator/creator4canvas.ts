import { ShapeSize } from "../../data";


function _checkNum(val: number) {
    if (Number.isNaN(val) || (!Number.isFinite(val))) throw new Error(String(val));
}

function _checkFrame(frame: ShapeSize) {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    _checkNum(frame.width);
    _checkNum(frame.height);
}
