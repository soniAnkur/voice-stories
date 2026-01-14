import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Creates an S3 client configured for Cloudflare R2
 */
function createR2Client(): S3Client {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.replace(/[\n\r\t\s]/g, "");
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.replace(/[\n\r\t\s]/g, "");
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.replace(/[\n\r\t\s]/g, "");

  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error(
      "Cloudflare R2 credentials required. Set CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_ACCOUNT_ID"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * Get R2 bucket configuration
 */
function getR2Config(): { bucketName: string; publicUrl: string } {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.replace(/[\n\r\t\s]/g, "");
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/[\n\r\t\s]/g, "");

  if (!bucketName || !publicUrl) {
    throw new Error(
      "R2 bucket configuration required. Set CLOUDFLARE_R2_BUCKET_NAME and CLOUDFLARE_R2_PUBLIC_URL"
    );
  }

  return { bucketName, publicUrl };
}

/**
 * Check if R2 is properly configured
 */
export function isR2Configured(): boolean {
  const required = [
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_ACCOUNT_ID",
    "CLOUDFLARE_R2_BUCKET_NAME",
    "CLOUDFLARE_R2_PUBLIC_URL",
  ];
  return required.every((key) => !!process.env[key]);
}

/**
 * Upload a buffer to Cloudflare R2
 */
async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = "audio/mpeg"
): Promise<string> {
  console.log(`Uploading to R2: ${key}`);

  const { bucketName, publicUrl } = getR2Config();
  const r2Client = createR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  await r2Client.send(command);

  const fileUrl = `${publicUrl}/${key}`;
  console.log(`Uploaded to R2: ${fileUrl}`);

  return fileUrl;
}

/**
 * Upload a voice sample to Cloudflare R2
 */
export async function uploadVoiceSample(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const key = `voice-stories/voice-samples/${filename}`;
  return uploadToR2(buffer, key, "audio/mpeg");
}

/**
 * Upload generated audio (preview or full) to Cloudflare R2
 */
export async function uploadAudio(
  buffer: Buffer,
  storyId: string,
  type: "preview" | "full",
  metadata?: {
    childName?: string;
    theme?: string;
    voiceId?: string;
  }
): Promise<string> {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 20);

  let filename: string;
  if (metadata?.childName) {
    const childName = sanitize(metadata.childName);
    const theme = metadata.theme ? sanitize(metadata.theme) : "story";
    const voiceIdShort = metadata.voiceId ? metadata.voiceId.slice(0, 8) : "unknown";
    const timestamp = Date.now();
    filename = `${childName}_${theme}_${type}_${voiceIdShort}_${timestamp}.mp3`;
  } else {
    filename = `${storyId}.mp3`;
  }

  const key = `voice-stories/stories/${type}/${filename}`;
  console.log(`Uploading ${type} story: ${key}`);

  return uploadToR2(buffer, key, "audio/mpeg");
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    const { bucketName, publicUrl } = getR2Config();

    // Extract key from URL
    const key = url.replace(`${publicUrl}/`, "");

    if (!key || key === url) {
      console.warn(`Invalid R2 URL for deletion: ${url}`);
      return;
    }

    const r2Client = createR2Client();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`Deleted from R2: ${key}`);
  } catch (error) {
    console.error(`Failed to delete from R2: ${url}`, error);
  }
}
