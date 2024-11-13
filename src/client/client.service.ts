import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Client, Role } from '@prisma/client';

import { ListResponse, PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser } from 'src/user';
import { CreateClientDto, UpdateClientDto } from './dto';

const EXCLUDE_FIELDS: (keyof Client)[] = ['createdById', 'updatedById', 'deletedById'];
const INCLUDE_LIST = {
  createdBy: { select: { id: true, username: true, email: true } },
};
const INCLUDE_SINGLE = {
  ...INCLUDE_LIST,
  updatedBy: { select: { id: true, username: true, email: true } },
  deletedBy: { select: { id: true, username: true, email: true } },
};

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ClientService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createClientDto: CreateClientDto, user: CurrentUser) {
    const message = `Creating client: ${JSON.stringify(createClientDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const client = await this.prisma.client.create({
        data: {
          ...createClientDto,
          createdBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(client);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: CurrentUser): Promise<ListResponse<Client>> {
    this.logger.log(`Fetching clients: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        include: INCLUDE_LIST,
      }),
      this.prisma.client.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data: data.map(this.excludeFields) };
  }

  async findOne(id: string, user: CurrentUser): Promise<Partial<Client>> {
    this.logger.log(`Fetching client: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const client = await this.prisma.client.findUnique({
        where,
        include: INCLUDE_SINGLE,
      });

      if (!client)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Client with id ${id} not found`,
        });

      return this.excludeFields(client);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findByCode(code: number, user: CurrentUser): Promise<Partial<Client>> {
    this.logger.log(`Fetching client: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const client = await this.prisma.client.findUnique({
        where,
        include: INCLUDE_SINGLE,
      });

      if (!client)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Client with code ${code} not found`,
        });

      return this.excludeFields(client);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto, user: CurrentUser): Promise<Partial<Client>> {
    const message = `Updating client: ${JSON.stringify({ id, ...updateClientDto })}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      await this.findOne(id, user);

      const updatedClient = await this.prisma.client.update({
        where: { id },
        data: {
          ...updateClientDto,
          updatedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(updatedClient);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async remove(id: string, user: CurrentUser) {
    const message = `Deleting client: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const client = await this.findOne(id, user);

      if (client.deletedAt !== null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Client with id ${id} cannot be deleted because it is already deleted`,
        });

      const deletedClient = await this.prisma.client.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(deletedClient);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async restore(id: string, user: CurrentUser) {
    const message = `Restoring client: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const client = await this.findOne(id, user);

      if (client.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Client with id ${id} cannot be restored because it is not deleted`,
        });

      const restoredClient = await this.prisma.client.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: true },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(restoredClient);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private clearCache() {
    this.cacheManager.reset();
  }

  /**
   * Excludes specified fields from the given Client object.
   *
   * @param data - The Client object from which fields will be excluded.
   * @returns A new Client object with the specified fields excluded.
   */
  private excludeFields(data: Client): Partial<Client> {
    return ObjectManipulator.exclude<Client>(data, EXCLUDE_FIELDS);
  }
}
