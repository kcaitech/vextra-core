import { PathShape, Point } from "@/data/shape";

function format(str: string, args: any) {
    const keys = Object.keys(args);
    for (let i = 0; i < keys.length; i++) {
        str = str.replace(new RegExp("\\{" + keys[i] + "\\}", "gi"), args[keys[i]]);
    }
    return str;
}

function normalize(vector: number[]) {
    const len = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    return [vector[0] / len, vector[1] / len];
}

export class PathParser {
    private d: string;
    private __currentPosition!: { x: number; y: number; };

    constructor() {
        this.d = '';
    }

    getD() {
        return this.d;
    }

    clear() {
        this.d = '';
    }

    moveTo(x: number, y: number) {

        if (isNaN(x) || isNaN(y)) {
            throw new Error("moveTo:(" + x + ", " + y + ")");
        }

        const d = this.d;
        this.__currentPosition = { x: x, y: y };
        this.d = (d.length > 0 ? (d + ' ') : d) + format("M {x} {y}", { x: x, y: y })
    }

    closePath() {
        const d = this.d;
        this.d = (d.length > 0 ? (d + ' ') : d) + 'Z';
    }

    lineTo(x: number, y: number) {
        if (isNaN(x) || isNaN(y)) {
            throw new Error("lineTo(" + x + ", " + y + ")");
        }

        const d = this.d;
        this.__currentPosition = { x: x, y: y };

        if (d.indexOf('M') > -1) {
            this.d = d + ' ' + format("L {x} {y}", { x: x, y: y });
        } else {
            this.d = (d.length > 0 ? (d + ' ') : d) + format("M {x} {y}", { x: x, y: y });
        }
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
        if (isNaN(cp1x) || isNaN(cp1y) || isNaN(cp2x) || isNaN(cp2y) || isNaN(x) || isNaN(y)) {
            throw new Error("bezierCurveTo(" + cp1x + ", " + cp1y + ", " + cp2x + ", " + cp2y + ", " + x + ", " + y + ")");
        }

        const d = this.d;

        this.__currentPosition = { x: x, y: y };

        this.d = (d.length > 0 ? (d + ' ') : d) + format("C {cp1x} {cp1y} {cp2x} {cp2y} {x} {y}",
            { cp1x: cp1x, cp1y: cp1y, cp2x: cp2x, cp2y: cp2y, x: x, y: y });
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        if (isNaN(cpx) || isNaN(cpy) || isNaN(x) || isNaN(y)) {
            throw new Error("quadraticCurveTo(" + cpx + ", " + cpy + ", " + x + ", " + y + ")");
        }

        const d = this.d;
        this.__currentPosition = { x: x, y: y };
        this.d = (d.length > 0 ? (d + ' ') : d) + format("Q {cpx} {cpy} {x} {y}", { cpx: cpx, cpy: cpy, x: x, y: y });
    }



    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || isNaN(radius)) {
            throw new Error("arcTo(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + radius + ")");
        }

        // const the point (x0, y0) be the last point in the subpath.
        const x0 = this.__currentPosition && this.__currentPosition.x;
        const y0 = this.__currentPosition && this.__currentPosition.y;

        // First ensure there is a subpath for (x1, y1).
        if (typeof x0 == "undefined" || typeof y0 == "undefined") {
            return;
        }

        // Negative values for radius must cause the implementation to throw an IndexSizeError exception.
        if (radius < 0) {
            throw new Error("IndexSizeError: The radius provided (" + radius + ") is negative.");
        }

        // If the point (x0, y0) is equal to the point (x1, y1),
        // or if the point (x1, y1) is equal to the point (x2, y2),
        // or if the radius radius is zero,
        // then the method must add the point (x1, y1) to the subpath,
        // and connect that point to the previous point (x0, y0) by a straight line.
        if (((x0 === x1) && (y0 === y1))
            || ((x1 === x2) && (y1 === y2))
            || (radius === 0)) {
            this.lineTo(x1, y1);
            return;
        }

        // Otherwise, if the points (x0, y0), (x1, y1), and (x2, y2) all lie on a single straight line,
        // then the method must add the point (x1, y1) to the subpath,
        // and connect that point to the previous point (x0, y0) by a straight line.
        const unit_vec_p1_p0 = normalize([x0 - x1, y0 - y1]);
        const unit_vec_p1_p2 = normalize([x2 - x1, y2 - y1]);
        if (unit_vec_p1_p0[0] * unit_vec_p1_p2[1] === unit_vec_p1_p0[1] * unit_vec_p1_p2[0]) {
            this.lineTo(x1, y1);
            return;
        }

        // Otherwise, const The Arc be the shortest arc given by circumference of the circle that has radius radius,
        // and that has one point tangent to the half-infinite line that crosses the point (x0, y0) and ends at the point (x1, y1),
        // and that has a different point tangent to the half-infinite line that ends at the point (x1, y1), and crosses the point (x2, y2).
        // The points at which this circle touches these two lines are called the start and end tangent points respectively.

        // note that both vectors are unit vectors, so the length is 1
        const cos = (unit_vec_p1_p0[0] * unit_vec_p1_p2[0] + unit_vec_p1_p0[1] * unit_vec_p1_p2[1]);
        const theta = Math.acos(Math.abs(cos));

        // Calculate origin
        const unit_vec_p1_origin = normalize([
            unit_vec_p1_p0[0] + unit_vec_p1_p2[0],
            unit_vec_p1_p0[1] + unit_vec_p1_p2[1]
        ]);
        const len_p1_origin = radius / Math.sin(theta / 2);
        const x = x1 + len_p1_origin * unit_vec_p1_origin[0];
        const y = y1 + len_p1_origin * unit_vec_p1_origin[1];

        // Calculate start angle and end angle
        // rotate 90deg clockwise (note that y axis points to its down)
        const unit_vec_origin_start_tangent = [
            -unit_vec_p1_p0[1],
            unit_vec_p1_p0[0]
        ];
        // rotate 90deg counter clockwise (note that y axis points to its down)
        const unit_vec_origin_end_tangent = [
            unit_vec_p1_p2[1],
            -unit_vec_p1_p2[0]
        ];
        const getAngle = function (vector: number[]) {
            // get angle (clockwise) between vector and (1, 0)
            const x = vector[0];
            const y = vector[1];
            if (y >= 0) { // note that y axis points to its down
                return Math.acos(x);
            } else {
                return -Math.acos(x);
            }
        };
        const startAngle = getAngle(unit_vec_origin_start_tangent);
        const endAngle = getAngle(unit_vec_origin_end_tangent);

        // Connect the point (x0, y0) to the start tangent point by a straight line
        this.lineTo(x + unit_vec_origin_start_tangent[0] * radius,
            y + unit_vec_origin_start_tangent[1] * radius);

        // Connect the start tangent point to the end tangent point by arc
        // and adding the end tangent point to the subpath.
        this.arc(x, y, radius, startAngle, endAngle);
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: number) {
        if (isNaN(x) || isNaN(y) || isNaN(radius) || isNaN(startAngle) || isNaN(endAngle) || counterClockwise && isNaN(counterClockwise)) {
            throw new Error("arc(" + x + ", " + y + ", " + radius + ", " + startAngle + ", " + endAngle + ", " + counterClockwise + ")");
        }

        // in canvas no circle is drawn if no angle is provided.
        if (startAngle === endAngle) {
            return;
        }
        startAngle = startAngle % (2 * Math.PI);
        endAngle = endAngle % (2 * Math.PI);
        if (startAngle === endAngle) {
            //circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
            endAngle = ((endAngle + (2 * Math.PI)) - 0.001 * (counterClockwise ? -1 : 1)) % (2 * Math.PI);
        }
        const endX = x + radius * Math.cos(endAngle),
            endY = y + radius * Math.sin(endAngle),
            startX = x + radius * Math.cos(startAngle),
            startY = y + radius * Math.sin(startAngle),
            sweepFlag = counterClockwise ? 0 : 1;
        let largeArcFlag = 0;
        let diff = endAngle - startAngle;

        // https://github.com/gliffy/canvas2svg/issues/4
        if (diff < 0) {
            diff += 2 * Math.PI;
        }

        if (counterClockwise) {
            largeArcFlag = diff > Math.PI ? 0 : 1;
        } else {
            largeArcFlag = diff > Math.PI ? 1 : 0;
        }

        this.lineTo(startX, startY);
        this.d = this.d + (format("A {rx} {ry} {xAxisRotation} {largeArcFlag} {sweepFlag} {endX} {endY}",
            { rx: radius, ry: radius, xAxisRotation: 0, largeArcFlag: largeArcFlag, sweepFlag: sweepFlag, endX: endX, endY: endY }));

        this.__currentPosition = { x: endX, y: endY };
    }
}

const parser = new PathParser();

export function render(data: PathShape, offsetX: number, offsetY: number, width: number, height: number): string {

    const pc = data.pointsCount;
    parser.clear();
    if (pc > 0) {
        const p = data.getPointByIndex(0);
        const pt = p.point;
        parser.moveTo(offsetX + pt.x * width, offsetY + pt.y * height);
    }
    const curv2Point = (p: Point, nextP: Point, isClose?: boolean) => {
        if (p.hasCurveFrom && nextP.hasCurveTo) {
            const adjFrom = p.curveFrom;
            const adjTo = nextP.curveTo;
            const pt = nextP.point;
            parser.bezierCurveTo(offsetX + adjFrom.x * width, offsetY + adjFrom.y * height,
                offsetX + adjTo.x * width, offsetY + adjTo.y * height,
                offsetX + pt.x * width, offsetY + pt.y * height);
        }
        else if (p.hasCurveFrom && !nextP.hasCurveTo) {
            const adjFrom = p.curveFrom;
            const adjTo = nextP.point;
            const pt = nextP.point;
            parser.bezierCurveTo(offsetX + adjFrom.x * width, offsetY + adjFrom.y * height,
                offsetX + adjTo.x * width, offsetY + adjTo.y * height,
                offsetX + pt.x * width, offsetY + pt.y * height);
        }
        else if (!p.hasCurveFrom && nextP.hasCurveTo) {
            const adjFrom = p.point;
            const adjTo = nextP.curveTo;
            const pt = nextP.point;
            parser.bezierCurveTo(offsetX + adjFrom.x * width, offsetY + adjFrom.y * height,
                offsetX + adjTo.x * width, offsetY + adjTo.y * height,
                offsetX + pt.x * width, offsetY + pt.y * height);
        }
        else if (!isClose) {
            const pt = nextP.point;
            parser.lineTo(offsetX + pt.x * width, offsetY + pt.y * height);
        }
        else {
            parser.closePath();
        }
    }
    for (let i = 0; i < pc - 1; i++) {
        const p = data.getPointByIndex(i);
        const nextP = data.getPointByIndex(i + 1);
        curv2Point(p, nextP);
    }
    if (data.isClosed) {
        if (pc > 1) {
            const firstP = data.getPointByIndex(0);
            const lastP = data.getPointByIndex(pc - 1);
            curv2Point(lastP, firstP, true);
        } else {
            parser.closePath();
        }
    }
    return parser.getD();
}