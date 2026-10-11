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
import { BusinessGuard } from '../auth/business.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { RequireCapabilities } from '../auth/require-capabilities.decorator';
import { Capability } from '../auth/capabilities';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { StorageService } from '../storage/storage.service';
import { FormsListDto, FormResponsesDto, FormTitleDto } from './forms-list.dto';
import { FormsService } from './forms.service';
import { uploadFormImage } from './form-upload';
@Controller('api/forms')
@UseGuards(BusinessGuard, AuthorizationGuard)
export class BusinessFormsController {
  constructor(
    private readonly forms: FormsService,
    private readonly storage: StorageService,
  ) {}
  @Get()
  @RequireCapabilities(Capability.BusinessFormsRead)
  async list(@CurrentUser() user: SessionUser, @Query() query: FormsListDto) {
    return {
      success: true,
      data: await this.forms.list(
        user.id,
        Number(query.page),
        query.q,
        query.filter === 'archived',
      ),
    };
  }
  @Get('stats')
  @RequireCapabilities(Capability.BusinessFormsRead)
  async stats(@CurrentUser() user: SessionUser) {
    return { success: true, data: await this.forms.stats(user.id) };
  }
  @Get('title-availability')
  @RequireCapabilities(Capability.BusinessFormsRead)
  async titleAvailability(
    @CurrentUser() user: SessionUser,
    @Query() query: FormTitleDto,
  ) {
    return {
      success: true,
      data: await this.forms.titleAvailability(
        user.id,
        query.title,
        query.excludeId,
      ),
    };
  }
  @Get(':id')
  @RequireCapabilities(Capability.BusinessFormsRead)
  async get(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { success: true, data: await this.forms.get(user.id, id) };
  }
  @Post()
  @RequireCapabilities(Capability.BusinessFormsCreate)
  async create(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    return { success: true, data: await this.forms.create(user.id, body) };
  }
  @Patch(':id')
  @RequireCapabilities(Capability.BusinessFormsUpdate)
  async update(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return { success: true, data: await this.forms.update(user.id, id, body) };
  }
  @Patch(':id/status')
  @RequireCapabilities(Capability.BusinessFormsUpdate)
  async status(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: unknown,
  ) {
    return {
      success: true,
      data: await this.forms.status(user.id, id, status),
    };
  }
  @Patch(':id/archive')
  @RequireCapabilities(Capability.BusinessFormsUpdate)
  async archive(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isArchived') isArchived: unknown,
  ) {
    return {
      success: true,
      data: await this.forms.archive(user.id, id, isArchived),
    };
  }
  @Post(':id/duplicate')
  @RequireCapabilities(Capability.BusinessFormsCreate)
  async duplicate(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { success: true, data: await this.forms.duplicate(user.id, id) };
  }
  @Delete(':id')
  @RequireCapabilities(Capability.BusinessFormsDelete)
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.forms.delete(user.id, id);
    return { success: true };
  }
  @Get(':id/analytics')
  @RequireCapabilities(Capability.BusinessFormsRead)
  async getAnalytics(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { success: true, data: await this.forms.getAnalytics(user.id, id) };
  }
  @Delete(':id/submissions')
  @RequireCapabilities(Capability.BusinessFormsDelete)
  async deleteSubmissions(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      success: true,
      data: await this.forms.deleteSubmissions(user.id, id),
    };
  }
  @Get(':id/submissions')
  @RequireCapabilities(Capability.BusinessFormsRead)
  async submissions(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FormResponsesDto,
  ) {
    const page = Number(query.page);
    return {
      success: true,
      data: await this.forms.submissions(user.id, id, page, query.filters()),
    };
  }
  @Post('upload')
  @RequireCapabilities(Capability.BusinessFormsUpload)
  async upload(
    @CurrentUser() user: SessionUser,
    @Req() request: FastifyRequest,
  ) {
    return {
      success: true,
      data: await uploadFormImage(request, this.storage, user.id),
    };
  }
}
