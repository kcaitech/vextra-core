export {
    PrototypeConnectionType,
    PrototypeEasingType,
    // PrototypeActions,
    PrototypeEvents,
    PrototypeNavigationType,
    PrototypeTransitionType,
    PrototypeEvent,
    PrototypeStartingPoint,
    PrototypeInterAction,
    PrototypeExtrascrolloffset,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayPositions,
    OverlayBackgroundType,
} from './baseclasses';
import { uuid } from '../basic/uuid';
import * as classes from "./baseclasses"
import { PrototypeEvent, PrototypeConnectionType,PrototypeExtrascrolloffset } from './baseclasses';
import { BasicArray } from './basic';

type PrototypeInterAction_crdtidx = BasicArray<number>

// export class PrototypeStartingPoint extends classes.PrototypeStartingPoint {
//     constructor(name: string, desc: string) {
//         super(name, desc)
//     }
// }

// export class PrototypeInterAction extends classes.PrototypeInterAction {
//     constructor(crdtidx: PrototypeInterAction_crdtidx, event: PrototypeEvent) {
//         super(crdtidx,event)
//     }
// }


export class PrototypeActions extends classes.PrototypeActions {
    constructor(
        id: string,
        connectionType: PrototypeConnectionType,
    ) {
        super(
            id,
            connectionType
        )
    }

    getOpTarget(path: string[]): any {
        if (path[0] === 'extraScrollOffset' && !this.extraScrollOffset) this.extraScrollOffset = new PrototypeExtrascrolloffset(uuid(),0,0);
        return super.getOpTarget(path);
    }
}

