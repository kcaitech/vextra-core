/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ContactRole } from "../data/baseclasses";
import { BasicArray } from "../data/basic";
import { Style } from "../data/style";
import { BasicOp } from "./basicop";

export class ContactOp {
    constructor(private _basicop: BasicOp) { }

    addContactShape(style: Style, contact_role: ContactRole) {
        if (!style.contacts) style.contacts = new BasicArray<ContactRole>();
        return this._basicop.crdtArrayInsert(style.contacts, style.contacts.length, contact_role);
    }

    removeContactRoleAt(style: Style, index: number) {
        if (style.contacts) return this._basicop.crdtArrayRemove(style.contacts, index);
    }
}