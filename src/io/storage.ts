import {S3Client, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";

export interface StorageOptions {
    endPoint: string;
    region: string;
    accessKey: string;
    secretKey: string;
    sessionToken?: string | undefined;
    bucketName: string;
}

// 合并多个Uint8Array
function concatUint8Array(arrays: Uint8Array[]): Uint8Array {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

export class Storage {
    private client: S3Client;
    private options: StorageOptions;

    constructor(options: StorageOptions) {
        this.client = new S3Client({
            endpoint: options.endPoint,
            region: options.region,
            credentials: {
                accessKeyId: options.accessKey,
                secretAccessKey: options.secretKey,
                sessionToken: options.sessionToken,
            },
            forcePathStyle: true,
            tls: false,
        })
        this.options = options;
    }

    public get(uri: string): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            const command = new GetObjectCommand({
                Bucket: this.options.bucketName,
                Key: uri,
            });
            this.client.send(command).then((data) => {
                const chunks: Uint8Array[] = [];
                const reader = (data.Body as ReadableStream).getReader();
                const pump = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            resolve(concatUint8Array(chunks));
                            return;
                        }
                        chunks.push(value);
                        pump();
                    }).catch((err) => {
                        reject(err);
                    });
                }
                pump();
            }).catch((err) => {
                reject(err);
            });
        })
    }

    // 将二进制数据上传到指定的路径
    public put(uri: string, data: Uint8Array, contentType: string = "application/json"): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = new PutObjectCommand({
                Bucket: this.options.bucketName,
                Key: uri,
                Body: data,
                ContentType: contentType,
            });
            this.client.send(command).then((data) => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        })
    }
}
