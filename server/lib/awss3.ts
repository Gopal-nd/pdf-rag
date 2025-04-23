import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3client = new S3Client({
    region: 'ap-south-1',
    credentials: {
     accessKeyId:process.env.AWS_ACCESS_KEY!,
     secretAccessKey:process.env.AWS_SECRET_KEY!
    },
})


export async function getObject(key: string) {
    const command = new GetObjectCommand({
        Bucket: 'private.gopal',
        Key: key,
    });
    const url = await getSignedUrl(s3client, command);
    return url
}


export async function putObject(key: string,contetType:string) {
    const command = new PutObjectCommand({
        Bucket: 'private.gopal',
        Key: key,
        ContentType:contetType
    });
    const url = await getSignedUrl(s3client, command);
    return url
}

export async function deleteObject(key: string) {
    console.log('key is called')
    const command = new DeleteObjectCommand({
        Bucket: 'private.gopal',
        Key: key,
    });
    const url = await s3client.send(command);
    return url
}

export async function listAllObjects(key: string) {
    const command = new ListObjectsV2Command({
        Bucket: 'private.gopal',
        Prefix: key
    });
    const url = await s3client.send(command);
    return url
}