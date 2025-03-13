/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CoopRepository, Api } from "../../../coop";
import { Fill, importGradient } from "../../../data";
import { exportGradient } from "../../../data/baseexport";

export class GradientEditor {
    private __repo: CoopRepository;
    private exception: boolean = false;

    constructor(repo: CoopRepository) {
        this.__repo = repo;
    }

    start() {
        return this.__repo.start('async-gradient-editor');
    }

    private m_api: Api | undefined;

    get api(): Api {
        return this.m_api ?? (this.m_api = this.__repo.start('async-gradient-editor'));
    }

    modifyFrom(fills: Fill[], from: { x: number, y: number }) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                if (!gradient) continue;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.from.x = from.x;
                gradientCopy.from.y = from.y;
                this.api.setFillGradient(fill, gradientCopy);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyTo(fills: Fill[], to: { x: number, y: number }) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                if (!gradient) continue;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.to.x = to.x;
                gradientCopy.to.y = to.y;
                this.api.setFillGradient(fill, gradientCopy);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyEllipseLength(fills: Fill[], length: number) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                if (!gradient) continue;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.elipseLength = length;
                this.api.setFillGradient(fill, gradientCopy);
            }
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyStopPosition(fills: Fill[], position: number, id: string) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                if (!gradient) continue;
                const gradientCopy = importGradient(exportGradient(gradient));
                const idx = gradientCopy.stops.findIndex((stop) => stop.id === id);
                if (idx === -1) continue;
                gradientCopy.stops[idx].position = position;
                const g_s = gradientCopy.stops;
                g_s.sort((a, b) => {
                    if (a.position > b.position) {
                        return 1;
                    } else if (a.position < b.position) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                this.api.setFillGradient(fill, gradientCopy);
            }
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    updateView() {
        this.__repo.transactCtx.fireNotify();
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
        this.m_api = undefined;
    }
}