export {
    PrototypeConnectionType,
    PrototypeEasingType,
    PrototypeEasingBezier,
    PrototypeEvents,
    PrototypeNavigationType,
    PrototypeTransitionType,
    PrototypeEvent,
    PrototypeStartingPoint,
    PrototypeInterAction,
    Point2D,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayPositionType,
    OverlayBackgroundType,
    ScrollDirection,
    ScrollBehavior,
    OverlayPosition,
    OverlayMargin,
} from './baseclasses';
import { uuid } from '../basic/uuid';
import * as classes from "./baseclasses"
import { PrototypeEvent, PrototypeConnectionType, Point2D, PrototypeEasingBezier } from './baseclasses';
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

    getOpTarget(path: string[]): any {        
        if (path[0] === 'extraScrollOffset' && !this.extraScrollOffset) this.extraScrollOffset = new Point2D(0, 0);
        if (path[0] === 'easingFunction' && !this.easingFunction) this.easingFunction = new PrototypeEasingBezier(0, 0, 1, 1)
        return super.getOpTarget(path);
    }
}

