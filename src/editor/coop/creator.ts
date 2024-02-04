import { Op, OpType } from "../../coop/common/op";
import { Document } from "../../data/document";
import { CrdtArrayReopNode } from "./arraynode";
import { CrdtIdRepoNode } from "./idsetnode";
import { ISave4Restore } from "./localcmd";
import { CrdtShapeRepoNode } from "./shapenode";
import { TextRepoNode } from "./textnode";

export function nodecreator(document: Document, selection: ISave4Restore | undefined) {
    return (op: Op) => {
        switch (op.type) {
            case OpType.Array:
                // text
                return new TextRepoNode(document, selection);
            case OpType.CrdtArr:
                // array
                return new CrdtArrayReopNode(document);
            case OpType.CrdtTree:
                return new CrdtShapeRepoNode(document);
            case OpType.Idset:
                return new CrdtIdRepoNode(document);
            case OpType.None:
                throw new Error("op none?");
        }
    }
}