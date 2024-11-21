import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';

import { Auth, GetUser } from 'src/auth';
import { ListResponse, PaginationDto, ParseCuidPipe } from 'src/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { CurrentUser, Role, UserResponse, UserSummary } from './interfaces';
import { UserService } from './user.service';

@Controller('user')
@Auth(Role.Admin, Role.Developer, Role.Manager)
export class UserController {
  constructor(
    private readonly usersService: UserService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('user.health')
  health(): string {
    return 'users service is up and running!';
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: CurrentUser): Promise<UserResponse> {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser): Promise<ListResponse<User>> {
    return this.getCachedResponse(`user:all:${JSON.stringify(pagination)}`, () =>
      this.usersService.findAll(pagination, user),
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser): Promise<UserResponse> {
    return this.getCachedResponse(`user:id:${id}`, () => this.usersService.findOne(id, user));
  }

  @Get('username/:username')
  async findOneByUsername(@Param('username') username: string, @GetUser() user: CurrentUser): Promise<UserResponse> {
    return this.getCachedResponse(`user:username:${username}`, () => this.usersService.findByUsername(username, user));
  }

  @Get(':id/summary')
  async findOneWithSummary(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser): Promise<UserSummary> {
    return this.getCachedResponse(`user:summary:${id}`, () => this.usersService.findOneWithSummary(id, user));
  }

  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: CurrentUser,
  ): Promise<UserResponse> {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Auth(Role.Admin, Role.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser): Promise<UserResponse> {
    return this.usersService.remove(id, user);
  }

  @Patch(':id/restore')
  @Auth(Role.Admin, Role.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser): Promise<UserResponse> {
    return this.usersService.restore(id, user);
  }

  private async getCachedResponse<T>(cacheKey: string, fetchFunction: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await fetchFunction();
    await this.cacheManager.set(cacheKey, response);

    return response;
  }
}
