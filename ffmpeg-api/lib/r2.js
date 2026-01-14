import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import https from 'https';
import http from 'http';

/**
 * Create Cloudflare R2 client
 */
function createR2Client() {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();

  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * Get R2 configuration
 */
function getR2Config() {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim();

  if (!bucketName || !publicUrl) {
    throw new Error('R2 bucket configuration not set');
  }

  return { bucketName, publicUrl };
}

/**
 * Download a file from URL (supports R2 public URLs and any HTTP/HTTPS URL)
 */
export async function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, localPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${url}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        try {
          await fs.writeFile(localPath, Buffer.concat(chunks));
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error(`Download timeout: ${url}`));
    });
  });
}

/**
 * Download from R2 using S3 API (for private files)
 */
export async function downloadFromR2(key, localPath) {
  const { bucketName } = getR2Config();
  const r2Client = createR2Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await r2Client.send(command);

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  await fs.writeFile(localPath, Buffer.concat(chunks));
}

/**
 * Upload buffer to Cloudflare R2
 */
export async function uploadToR2(buffer, key, contentType = 'audio/mpeg') {
  const { bucketName, publicUrl } = getR2Config();
  const r2Client = createR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  });

  await r2Client.send(command);

  return `${publicUrl}/${key}`;
}
