import { Op, OpType } from "../../coop/common/op";
import { Document } from "../../data/document";
import { CrdtArrayReopNode } from "./arraynode";
import { CrdtIdRepoNode } from "./idsetnode";
import { CrdtShapeRepoNode } from "./shapenode";
import { TextRepoNode } from "./textnode";

export function nodecreator(document: Document) {
    return (op: Op) => {
        switch (op.type) {
            case OpType.Array:
                // text
                return new TextRepoNode(document);
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