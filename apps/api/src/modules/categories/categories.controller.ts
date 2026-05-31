import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderHomeTilesDto } from './dto/reorder-home-tiles.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** GET /categories
   *  ?tree=true  → nested (parents with children[])
   *  default     → flat list (backward-compatible) */
  @Get()
  findAll(@Query('tree') tree?: string) {
    return this.categoriesService.findAll(tree === 'true');
  }

  /** PATCH /categories/home-order  (admin)
   *  Must be declared BEFORE /:id so NestJS does not treat "home-order" as an id param. */
  @Patch('home-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reorderHomeTiles(@Body() body: ReorderHomeTilesDto) {
    return this.categoriesService.reorderHomeTiles(body);
  }

  /** GET /categories/:slug — returns category + children + products */
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  /** POST /categories (admin) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  /** PATCH /categories/:id (admin) */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.categoriesService.update(id, body);
  }

  /** DELETE /categories/:id (admin) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
