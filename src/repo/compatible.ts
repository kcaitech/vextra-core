/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { FMT_VER_border, FMT_VER_transfrom } from "../data/fmtver";
import { Cmd } from "./types";
import { OpType } from "../operator";
import { ArrayMoveOp } from "../operator";

export function convertCmds(cmds: Cmd[]) {
    cmds.forEach(cmd => {
        if ((cmd.dataFmtVer ?? 0) < FMT_VER_transfrom) {
            cmd.ops.forEach(op => {
                if (op.type === OpType.Idset) {
                    switch (op.id) {
                        case 'x':
                            if (op.path[op.path.length - 2] === 'frame') { // idset中,path最后一个是id
                                op.path[op.path.length - 2] = 'transform'
                                op.id = 'm02'
                                op.path[op.path.length - 1] = 'm02'
                            }
                            break;
                        case 'y':
                            if (op.path[op.path.length - 2] === 'frame') {
                                op.path[op.path.length - 2] = 'transform'
                                op.id = 'm12'
                                op.path[op.path.length - 1] = 'm12'
                            }
                            break;
                        case 'width':
                            if (op.path[op.path.length - 2] === 'frame') {
                                op.path[op.path.length - 2] = 'size'
                            }
                            break;
                        case 'height':
                            if (op.path[op.path.length - 2] === 'frame') {
                                op.path[op.path.length - 2] = 'size'
                            }
                            break;
                        case 'rotation':
                            // todo
                            break;
                    }
                }
            })
        }
        else if ((cmd.dataFmtVer ?? 0) < FMT_VER_border) {
            cmd.ops.forEach(op => {
                if (op.type === OpType.CrdtArr) {
                    // op.path
                    if (op.path[op.path.length - 1] === 'borders') {
                        op.path.push('strokePaints');
                        // op.data
                        const data = (op as ArrayMoveOp).data;
                        if(data && typeof data === 'string') {
                            const _data = JSON.parse(data);
                            if(_data.typeId === 'border') {
                                _data.typeId = 'fill';
                                delete _data.borderStyle;
                                delete _data.cornerType;
                                delete _data.position;
                                delete _data.sideSetting;
                                delete _data.thickness;
                                (op as ArrayMoveOp).data = JSON.stringify(_data);
                            }
                        }
                    }
                }
                else if (op.type === OpType.Idset) {
                    if(op.id === "position" || op.id === "sideSetting" || op.id === "cornerType" || op.id === "borderStyle") {
                        if (op.path[op.path.length - 3] === 'borders' && op.path[op.path.length - 4] === 'style') {
                            op.path.splice(-2, 1);
                        }
                    }
                }
        })
        }
    })
}