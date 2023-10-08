// symbolref
// 切换实例 [symref里的symref]override ref -> variable -> symbolid
// 切换实例 [symref] 直接修改ref
import { BasicMap } from "data/basic";
import { Shape, SymbolShape, Variable, VariableType } from "../data/shape";
import { OverrideType, SymbolRefShape } from "../data/symbolref";
import { uuid } from "basic/uuid";

function switchRef(refId: string, shape: SymbolRefShape) {

    // check refId exist

    if (shape.isVirtualShape) {
        // override
        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();
        // get first not virtual
        let symRef = shape.parent;
        while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
        if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

        // todo 判断有没有override!
        symRef.addOverrid(override_id, OverrideType.SymbolID, refId);
    }
    else {
        // api
        shape.refId = refId; // todo
    }
}

// 切换状态 symbolref-> override [unionref]-> variable -> symbolid
// 多状态 override unionsym状态变量
function switchState(varId: string, state: string, shape: SymbolRefShape) {
    if (shape.isVirtualShape) {
        // override
        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();
        // get first not virtual
        let symRef = shape.parent;
        while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
        if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();
        
        override_id += '/' + varId;
        symRef.addOverrid(override_id, OverrideType.Variable, state);

        // todo 找到这个state对应的symbol,并修正state
    }
    else {
        const _var = shape.getVar(varId);
        if (!_var) throw new Error();
        _var.value = state;
    }

    // todo 找到这个state对应的symbol,并修正state
}

// 状态tag 
// 修改属性 override
// 修改var属性 直接修改var或者override var


// symbol
// 多状态 unionsym状态变量* sym变量id:value作为tag(vartag), vartag中无定义的就取name？
function modifySymTag(varId: string, tag: string, shape: SymbolShape) {
    let vartag = shape.vartag;
    if (!vartag) {
        vartag = new BasicMap();
        shape.vartag = vartag;
    }
    vartag.set(varId, tag);
}

// 创建var
function createVar(type: VariableType, name: string, value: any, shape: SymbolShape) {
    const _var = new Variable(uuid(), type, name);
    _var.value = value;
    shape.addVar(_var);
}

// 绑定var
function bindVar(slot: string, varId: string, shape: Shape) {
    let varbinds = shape.varbinds;
    if (!varbinds) {
        varbinds = new BasicMap();
        shape.varbinds = varbinds;
    }
    varbinds.set(slot, varId);
}
// 修改var属性 直接修改var或者override var
// 修改属性 直接修改或者symref的override