import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

import { GITHUB_TOKEN_ENCRYPTION_KEY } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getKey = (): Buffer => {
  return createHash('sha256').update(GITHUB_TOKEN_ENCRYPTION_KEY).digest();
};

export const encryptToken = (plainText: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptToken = (encryptedPayload: string): string => {
  const [ivHex, tagHex, encryptedHex] = encryptedPayload.split(':');

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error('Invalid encrypted token payload');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
};
