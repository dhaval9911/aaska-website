import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided.');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed.');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File must be under 5 MB.');
    }

    const savedName = await this.storageService.save(file.originalname, file.buffer);
    return { path: `/uploads/${savedName}` };
  }
}
