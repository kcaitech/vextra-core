import { Op, OpType } from "../../coop/common/op";
import { Document } from "../../data/document";
import { CrdtArrayReopNode } from "./arraynode";
import { RepoNodePath } from "./base";
import { CrdtIdRepoNode } from "./idsetnode";
import { ISave4Restore } from "./localcmd";
import { CrdtShapeRepoNode } from "./shapenode";
import { TextRepoNode } from "./textnode";

export function nodecreator(document: Document, selection: ISave4Restore | undefined) {
    return (parent: RepoNodePath, op: Op) => {
        switch (op.type) {
            case OpType.Array:
                // text
                return new TextRepoNode(parent, document, selection);
            case OpType.CrdtArr:
                // array
                return new CrdtArrayReopNode(parent, document);
            case OpType.CrdtTree:
                return new CrdtShapeRepoNode(parent, document);
            case OpType.Idset:
                return new CrdtIdRepoNode(parent, document);
            case OpType.None:
                throw new Error("op none?");
        }
    }
}