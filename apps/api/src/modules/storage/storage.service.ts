import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export interface StorageAdapter {
  save(fileName: string, content: Buffer): Promise<string>;
}

@Injectable()
export class StorageService implements StorageAdapter {
  private readonly uploadDir = process.env.UPLOAD_DIR ?? './uploads';

  async save(fileName: string, content: Buffer): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });

    // Convert to WebP: quality 85, resize to max 2000px on longest edge (no upscaling)
    const compressed = await sharp(content)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const baseName = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const safeName = `${randomUUID()}-${baseName}.webp`;
    const fullPath = join(this.uploadDir, safeName);
    await writeFile(fullPath, compressed);

    return safeName;
  }
}
