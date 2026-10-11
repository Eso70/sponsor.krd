import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { RequireCapabilities } from '../auth/require-capabilities.decorator';
import { Capability } from '../auth/capabilities';
import { StorageService } from '../storage/storage.service';
import { FormsListDto, FormResponsesDto, FormTitleDto } from './forms-list.dto';
import { FormsService } from './forms.service';
import { uploadFormImage } from './form-upload';
@Controller('api/platform/forms')
@UseGuards(PlatformAdminGuard, AuthorizationGuard)
export class PlatformFormsController {
  constructor(
    private readonly forms: FormsService,
    private readonly storage: StorageService,
  ) {}
  @Get()
  @RequireCapabilities(Capability.PlatformFormsRead)
  async list(@Query() query: FormsListDto) {
    return {
      success: true,
      data: await this.forms.list(
        await this.forms.platformOwner(),
        Number(query.page),
        query.q,
        query.filter === 'archived',
      ),
    };
  }
  @Get('stats')
  @RequireCapabilities(Capability.PlatformFormsRead)
  async stats() {
    return {
      success: true,
      data: await this.forms.stats(await this.forms.platformOwner()),
    };
  }
  @Get('title-availability')
  @RequireCapabilities(Capability.PlatformFormsRead)
  async titleAvailability(@Query() query: FormTitleDto) {
    return {
      success: true,
      data: await this.forms.titleAvailability(
        await this.forms.platformOwner(),
        query.title,
        query.excludeId,
      ),
    };
  }
  @Get(':id')
  @RequireCapabilities(Capability.PlatformFormsRead)
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: await this.forms.get(await this.forms.platformOwner(), id),
    };
  }
  @Post()
  @RequireCapabilities(Capability.PlatformFormsCreate)
  async create(@Body() body: unknown) {
    return {
      success: true,
      data: await this.forms.create(await this.forms.platformOwner(), body),
    };
  }
  @Patch(':id')
  @RequireCapabilities(Capability.PlatformFormsUpdate)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return {
      success: true,
      data: await this.forms.update(await this.forms.platformOwner(), id, body),
    };
  }
  @Patch(':id/status')
  @RequireCapabilities(Capability.PlatformFormsUpdate)
  async status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: unknown,
  ) {
    return {
      success: true,
      data: await this.forms.status(
        await this.forms.platformOwner(),
        id,
        status,
      ),
    };
  }
  @Patch(':id/archive')
  @RequireCapabilities(Capability.PlatformFormsUpdate)
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isArchived') isArchived: unknown,
  ) {
    return {
      success: true,
      data: await this.forms.archive(
        await this.forms.platformOwner(),
        id,
        isArchived,
      ),
    };
  }
  @Post(':id/duplicate')
  @RequireCapabilities(Capability.PlatformFormsCreate)
  async duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: await this.forms.duplicate(await this.forms.platformOwner(), id),
    };
  }
  @Delete(':id')
  @RequireCapabilities(Capability.PlatformFormsDelete)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.forms.delete(await this.forms.platformOwner(), id);
    return { success: true };
  }
  @Get(':id/analytics')
  @RequireCapabilities(Capability.PlatformFormsRead)
  async getAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: await this.forms.getAnalytics(await this.forms.platformOwner(), id),
    };
  }
  @Delete(':id/submissions')
  @RequireCapabilities(Capability.PlatformFormsDelete)
  async deleteSubmissions(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: await this.forms.deleteSubmissions(
        await this.forms.platformOwner(),
        id,
      ),
    };
  }
  @Get(':id/submissions')
  @RequireCapabilities(Capability.PlatformFormsRead)
  async submissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FormResponsesDto,
  ) {
    const page = Number(query.page);
    return {
      success: true,
      data: await this.forms.submissions(
        await this.forms.platformOwner(),
        id,
        page,
        query.filters(),
      ),
    };
  }
  @Post('upload')
  @RequireCapabilities(Capability.PlatformFormsUpload)
  async upload(@Req() request: FastifyRequest) {
    return {
      success: true,
      data: await uploadFormImage(
        request,
        this.storage,
        await this.forms.platformOwner(),
      ),
    };
  }
}
