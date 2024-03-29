import * as chai from 'chai'
import { Path } from './path';
import { parsePath } from './pathparser';

const assert = chai.assert;

test("path", () => {
    const width = 118;
    const height = 114;
    const pathstr = "M 84.5 44 C 103.002 44 118 58.9985 118 77.5 L 118 80.5 C 118 99.0015 103.002 114 84.5 114 L 84.5 114 C 65.9985 114 51 99.0015 51 80.5 L 51 77.5 C 51 58.9985 65.9985 44 84.5 44 Z";
    const path = new Path(pathstr);
    assert.equal(path.toString(), pathstr);

    const curves = path.toCurvePoints(width, height);
    assert.equal(curves.length, 1);

    const part1 = parsePath(curves[0].points, !!curves[0].isClosed, width, height);
    const path1 = new Path(part1);

    assert.equal(pathstr, path1.toString());
})

test("path1", () => {
    const width = 118;
    const height = 114;
    const pathstr1 = "M 84.5 44 C 103.002 44 118 58.9985 118 77.5 L 118 80.5 C 118 99.0015 103.002 114 84.5 114 L 84.5 114 C 65.9985 114 51 99.0015 51 80.5 L 51 77.5 C 51 58.9985 65.9985 44 84.5 44 Z";
    const pathstr2 = "M 41 0 L 45 0 C 67.6437 0 86 18.3563 86 41 L 86 41 C 86 63.6437 67.6437 82 45 82 L 41 82 C 18.3563 82 0 63.6437 0 41 L 0 41 C 0 18.3563 18.3563 0 41 0 Z"
    const path = new Path(pathstr1 + pathstr2);
    const curves = path.toCurvePoints(width, height);
    assert.equal(curves.length, 2);

    const part1 = parsePath(curves[0].points, !!curves[0].isClosed, width, height);
    const part2 = parsePath(curves[1].points, !!curves[1].isClosed, width, height);

    const path1 = new Path(part1);
    const path2 = new Path(part2);

    assert.equal(pathstr1, path1.toString());
    assert.equal(pathstr2, path2.toString());
})