/**
 * ImageKit configuration for image upload and optimization.
 * Private key must never be exposed to clients (server-side only).
 * Client-side uses public key and URL endpoint only.
 */

import { ImageKit } from '@imagekit/nodejs';

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export type ImageKitClient = typeof imagekit;
