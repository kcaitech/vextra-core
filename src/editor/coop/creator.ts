import { Op, OpType } from "../../coop/common/op";
import { Document } from "../../data/document";
import { CrdtArrayReopNode } from "./arraynode";
import { CrdtIdRepoNode } from "./idsetnode";
import { CrdtShapeRepoNode } from "./shapenode";
import { TextRepoNode } from "./textnode";

export function nodecreator(document: Document) {
    return (op: Op) => {
        const path0 = op.path[0];
        if (path0 === document.id) {
            switch (op.type) {
                case OpType.CrdtArr:
                    return new CrdtArrayReopNode(document);
                case OpType.Idset:
                    return new CrdtIdRepoNode(document);
                case OpType.Array:
                case OpType.CrdtTree:
                case OpType.None:
                    throw new Error("op wrong?");
            }
        }

        const page = document.pagesMgr.getSync(path0);
        if (!page) throw new Error("page not valid: " + op.path.join(','));
        switch (op.type) {
            case OpType.Array:
                // text
                return new TextRepoNode(page);
            case OpType.CrdtArr:
                // array
                return new CrdtArrayReopNode(page);
            case OpType.CrdtTree:
                return new CrdtShapeRepoNode(document, page);
            case OpType.Idset:
                return new CrdtIdRepoNode(page);
            case OpType.None:
                throw new Error("op none?");
        }
    }
}