/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {ByteBuffer, compileSchema, decodeBinarySchema} from "kiwi-schema"
import * as pako from "pako"
import * as fzstd from "fzstd"
import JSZip from "jszip"

const transfer8to32 = function (fileByte: Uint8Array, start: number, cache: Uint8Array) {
    cache[0] = fileByte[start + 0]
    cache[1] = fileByte[start + 1]
    cache[2] = fileByte[start + 2]
    cache[3] = fileByte[start + 3]
}

// buffers to work with for convenience
const int32 = new Int32Array(1) // 32 bit word
const uint8 = new Uint8Array(int32.buffer) // 4 slots of 8 bits
const uint32 = new Uint32Array(int32.buffer) // 1 unsigned 32 bit word

const calcEnd = function (fileByte: Uint8Array, start: number) {
    transfer8to32(fileByte, start, uint8)
    return uint32[0]
}

function parseBlob(key: string, bytes: Uint8Array) {
    const view = new DataView(bytes.buffer)
    let offset = 0

    switch (key) {
        case 'vectorNetwork':
            if (bytes.length < 12) return
            const vertexCount = view.getUint32(0, true)
            const segmentCount = view.getUint32(4, true)
            const regionCount = view.getUint32(8, true)
            const vertices = []
            const segments = []
            const regions = []
            offset += 12

            for (let i = 0; i < vertexCount; i++) {
                if (offset + 12 > bytes.length) return
                vertices.push({
                    styleID: view.getUint32(offset + 0, true),
                    x: view.getFloat32(offset + 4, true),
                    y: view.getFloat32(offset + 8, true),
                })
                offset += 12
            }

            for (let i = 0; i < segmentCount; i++) {
                if (offset + 28 > bytes.length) return
                const startVertex = view.getUint32(offset + 4, true)
                const endVertex = view.getUint32(offset + 16, true)
                if (startVertex >= vertexCount || endVertex >= vertexCount) return
                segments.push({
                    styleID: view.getUint32(offset + 0, true),
                    start: {
                        vertex: startVertex,
                        dx: view.getFloat32(offset + 8, true),
                        dy: view.getFloat32(offset + 12, true),
                    },
                    end: {
                        vertex: endVertex,
                        dx: view.getFloat32(offset + 20, true),
                        dy: view.getFloat32(offset + 24, true),
                    },
                })
                offset += 28
            }

            for (let i = 0; i < regionCount; i++) {
                if (offset + 8 > bytes.length) return
                let styleID = view.getUint32(offset, true)
                const windingRule = styleID & 1 ? 'NONZERO' : 'ODD'
                styleID >>= 1
                const loopCount = view.getUint32(offset + 4, true)
                const loops = []
                offset += 8

                for (let j = 0; j < loopCount; j++) {
                    if (offset + 4 > bytes.length) return
                    const indexCount = view.getUint32(offset, true)
                    const indices = []
                    offset += 4
                    if (offset + indexCount * 4 > bytes.length) return
                    for (let k = 0; k < indexCount; k++) {
                        const segment = view.getUint32(offset, true)
                        if (segment >= segmentCount) return
                        indices.push(segment)
                        offset += 4
                    }
                    loops.push({ segments: indices })
                }

                regions.push({ styleID, windingRule, loops })
            }

            return { vertices, segments, regions }

        case 'commands':
            const path = []
            while (offset < bytes.length) {
                switch (bytes[offset++]) {
                    case 0:
                        path.push('Z')
                        break

                    case 1:
                        if (offset + 8 > bytes.length) return
                        path.push('M', view.getFloat32(offset, true), view.getFloat32(offset + 4, true))
                        offset += 8
                        break

                    case 2:
                        if (offset + 8 > bytes.length) return
                        path.push('L', view.getFloat32(offset, true), view.getFloat32(offset + 4, true))
                        offset += 8
                        break

                    case 3:
                        if (offset + 16 > bytes.length) return
                        path.push('Q',
                            view.getFloat32(offset, true), view.getFloat32(offset + 4, true),
                            view.getFloat32(offset + 8, true), view.getFloat32(offset + 12, true))
                        offset += 16
                        break

                    case 4:
                        if (offset + 24 > bytes.length) return
                        path.push('C',
                            view.getFloat32(offset, true), view.getFloat32(offset + 4, true),
                            view.getFloat32(offset + 8, true), view.getFloat32(offset + 12, true),
                            view.getFloat32(offset + 16, true), view.getFloat32(offset + 20, true))
                        offset += 24
                        break

                    default:
                        return
                }
            }
            return path
    }
}

export const figToJson = async (fileBuffer: ArrayBuffer): Promise<object> => {
    const [schemaByte, dataByte] = await figToBinaryParts(fileBuffer)

    const schemaBB = new ByteBuffer(schemaByte)
    const schema = decodeBinarySchema(schemaBB)
    const dataBB = new ByteBuffer(dataByte)
    const schemaHelper = compileSchema(schema)

    const json = schemaHelper[`decodeMessage`](dataBB)
    if (json.nodeChanges) for (const node of json.nodeChanges) {
        const vectorNetworkIndex = node.vectorData?.vectorNetworkBlob;
        if (Number.isInteger(vectorNetworkIndex)) {
            const vectorNetworkBlob = json.blobs[vectorNetworkIndex]?.bytes;
            if (vectorNetworkBlob) {
                const vectorNetwork = parseBlob('vectorNetwork', vectorNetworkBlob);
                delete node.vectorData.vectorNetworkBlob;
                node.vectorData.vectorNetwork = vectorNetwork;
            }
        }

        for (const geometry of [
            (node.strokeGeometry as any[] || []).filter(item => Number.isInteger(item.commandsBlob)),
            (node.fillGeometry as any[] || []).filter(item => Number.isInteger(item.commandsBlob)),
        ]) {
            if (geometry.length > 0) for (const geometryItem of geometry) {
                const commandIndex = geometryItem.commandsBlob;
                const commandsBlob = json.blobs[commandIndex]?.bytes;
                if (commandsBlob) {
                    const commands = parseBlob('commands', commandsBlob);
                    delete geometryItem.commandsBlob;
                    geometryItem.commands = commands;
                }
            }
        }
    }

    // return convertBlobsToBase64(json)
    return json
}

function convertBlobsToBase64(json: any): object {
    if (!json.blobs) return json;

    return {
        ...json,
        blobs: json.blobs.map((blob: any) => {
            return btoa(String.fromCharCode(...blob.bytes))
        })
    }
}

function convertBase64ToBlobs(json: any): object {
    if (!json.blobs) return json;

    return {
        ...json,
        blobs: json.blobs.map((blob: any) => {
            return { bytes: Uint8Array.from(atob(blob), (c) => c.charCodeAt(0)) }
        })
    }
}

// note fileBuffer is mutated inside
async function figToBinaryParts(fileBuffer: ArrayBuffer): Promise<Uint8Array[]> {
    let fileByte: Uint8Array = new Uint8Array(fileBuffer)

    // check bytes for figma comment "fig-kiwi" if doesn't exist, we first need to unzip the file
    if (
        fileByte[0] !== 102 ||
        fileByte[1] !== 105 ||
        fileByte[2] !== 103 ||
        fileByte[3] !== 45 ||
        fileByte[4] !== 107 ||
        fileByte[5] !== 105 ||
        fileByte[6] !== 119 ||
        fileByte[7] !== 105
    ) {
        const unzipped = await JSZip.loadAsync(fileBuffer as ArrayBuffer)
        const file = unzipped.file("canvas.fig")
        if (!file) {
            throw new Error("Invalid Figma file format, 'canvas.fig' not found.");
        }
        fileByte = await file.async("uint8array") as Uint8Array;
    }

    // 8 bytes for figma comment "fig-kiwi"
    let start = 8

    // jumps 4 bytes over delimiter
    start += 4

    const result: Uint8Array[] = []
    while (start < fileByte.length) {
        let end = calcEnd(fileByte, start)
        const index = start + 4;
        start += 4 + end;

        let byteTemp: Uint8Array = fileByte.slice(index, index + end);

        // TODO: we might not need to check for this
        // Decompress everything other than PNG bytes (they remain compressed and are handled by image-loaders)
        // WARN: it is possible this byte is not png, maybe I need to check a few more bytes?
        if (!(fileByte[index] == 137 && fileByte[index + 1] == 80)) {
            try {
                byteTemp = fzstd.decompress(byteTemp) as any;
            } catch (err) {
                byteTemp = pako.inflateRaw(byteTemp) as any;
            }
        }

        result.push(byteTemp)
    }

    return result
}
