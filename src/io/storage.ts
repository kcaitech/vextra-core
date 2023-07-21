import AWS from "aws-sdk";

AWS.config.correctClockSkew = true;

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
    private client: AWS.S3;
    private options: StorageOptions;

    constructor(options: StorageOptions) {
        this.client = new AWS.S3({
            endpoint: options.endPoint,
            region: options.region,
            signatureVersion: "v4",
            credentials: {
                accessKeyId: options.accessKey,
                secretAccessKey: options.secretKey,
                sessionToken: options.sessionToken,
            },
            s3ForcePathStyle: true,
            sslEnabled: false,
            correctClockSkew: true,
        });
        this.options = options;
    }

    public get(uri: string, versionId?: string): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            this.client.getObject({
                Bucket: this.options.bucketName,
                Key: uri,
                VersionId: versionId,
            }, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data.Body as Uint8Array)
            })
        })
    }

    // 将二进制数据上传到指定的路径
    public put(uri: string, data: Uint8Array, contentType: string = "application/json"): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.client.putObject({
                Bucket: this.options.bucketName,
                Key: uri,
                Body: data,
                ContentType: contentType,
            }, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            })
        });
    }
}
