import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const bucket = process.env.STORAGE_BUCKET ?? "nr1-gravacoes";

const s3 = new S3Client({
  region: process.env.STORAGE_REGION ?? "us-east-1",
  endpoint: process.env.STORAGE_ENDPOINT,
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
  credentials: process.env.STORAGE_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
      }
    : undefined,
});

/**
 * Gera uma URL pré-assinada para upload direto do dispositivo/cliente ao storage,
 * evitando que arquivos de mídia (potencialmente grandes) passem pelo servidor de API.
 */
export async function createUploadUrl(params: {
  organizationId: string;
  environmentId: string;
  contentType: string;
  extension: string;
}) {
  const key = `orgs/${params.organizationId}/environments/${params.environmentId}/${Date.now()}-${randomUUID()}.${params.extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
  return { uploadUrl: url, objectKey: key };
}

export async function createDownloadUrl(objectKey: string, expiresInSeconds = 60 * 15) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(objectKey: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export { bucket as storageBucket };
