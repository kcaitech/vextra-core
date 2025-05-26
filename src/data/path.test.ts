/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as chai from 'chai'
import { parsePath } from './pathparser';
import { Path } from '@kcdesign/path';
import { convertPath2CurvePoints } from './pathconvert';

const assert = chai.assert;

test("path", () => {
    const width = 118;
    const height = 114;
    const pathstr = "M84.5 44C103.002 44 118 58.9985 118 77.5L118 80.5C118 99.0015 103.002 114 84.5 114L84.5 114C65.9985 114 51 99.0015 51 80.5L51 77.5C51 58.9985 65.9985 44 84.5 44Z";
    const path = Path.fromSVGString(pathstr);
    assert.equal(path.toSVGString(), pathstr);

    const curves = convertPath2CurvePoints(path, width, height);
    assert.equal(curves.length, 1);

    const path1 = parsePath(curves[0].points, !!curves[0].isClosed, width, height);

    assert.equal(pathstr, path1.toSVGString());
})

test("path1", () => {
    const width = 118;
    const height = 114;
    const pathstr1 = "M84.5 44C103.002 44 118 58.9985 118 77.5L118 80.5C118 99.0015 103.002 114 84.5 114L84.5 114C65.9985 114 51 99.0015 51 80.5L51 77.5C51 58.9985 65.9985 44 84.5 44Z";
    const pathstr2 = "M41 0L45 0C67.6437 0 86 18.3563 86 41L86 41C86 63.6437 67.6437 82 45 82L41 82C18.3563 82 0 63.6437 0 41L0 41C0 18.3563 18.3563 0 41 0Z"
    const path = Path.fromSVGString(pathstr1 + pathstr2);
    const curves = convertPath2CurvePoints(path, width, height);
    assert.equal(curves.length, 2);

    const path1 = parsePath(curves[0].points, !!curves[0].isClosed, width, height);
    const path2 = parsePath(curves[1].points, !!curves[1].isClosed, width, height);

    assert.equal(pathstr1, path1.toSVGString());
    assert.equal(pathstr2, path2.toSVGString());
})