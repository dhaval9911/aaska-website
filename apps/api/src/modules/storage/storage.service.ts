import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface StorageAdapter {
  save(fileName: string, content: Buffer): Promise<string>;
}

@Injectable()
export class StorageService implements StorageAdapter {
  private readonly uploadDir = process.env.UPLOAD_DIR ?? './uploads';

  async save(fileName: string, content: Buffer) {
    await mkdir(this.uploadDir, { recursive: true });
    const safeName = `${randomUUID()}-${fileName.replace(/\s+/g, '-').toLowerCase()}`;
    const fullPath = join(this.uploadDir, safeName);
    await writeFile(fullPath, content);

    return safeName;
  }
}
