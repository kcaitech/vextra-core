/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Op, OpType } from "../operator";
import { Document } from "../data/document";
import { CrdtArrayReopNode } from "./arraynode";
import { RepoNodePath } from "./base";
import { CrdtIdRepoNode } from "./idsetnode";
import { ISave4Restore } from "./types";
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