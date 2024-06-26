import { FMT_VER_transfrom } from "../../data/fmtver";
import { Cmd } from "../../coop/common/repo";
import { OpType } from "../../coop/common/op";

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
    })
}