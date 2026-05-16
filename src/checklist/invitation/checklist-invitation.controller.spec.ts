import { LinkObject, PlainResource } from '@app/hateoas';
import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { ABILITY_KEY } from '@app/casl/casl.interceptor';
import { AbilityFactory } from '@app/casl/ability.factory';
import { CaslForbiddenErrorFilter } from '@app/casl/casl-forbidden-error.filter';
import { ForbiddenError, subject } from '@casl/ability';
import { GoneException, NotFoundException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { HateoasModule } from '../../hateoas/hateoas.module';
import { ChecklistInvitationController } from './checklist-invitation.controller';
import { InvitationService } from './invitation.service';

describe('ChecklistInvitationController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<
    Pick<
      InvitationService,
      | 'createInvitation'
      | 'acceptInvitation'
      | 'getInvitation'
      | 'listInvitations'
    >
  >;
  const mockUser: AuthUser = { uid: 'owner-uid' };
  const abilityFactory = new AbilityFactory();

  beforeEach(async () => {
    serviceMock = {
      createInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
      getInvitation: jest.fn(),
      listInvitations: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [ChecklistInvitationController],
      providers: [
        {
          provide: InvitationService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
    app.useGlobalFilters(new CaslForbiddenErrorFilter());

    app.use(
      (
        req: Request & { [USER_AUTH_KEY]: AuthUser; [key: symbol]: unknown },
        _res: Response,
        next: NextFunction,
      ) => {
        req[USER_AUTH_KEY] = mockUser;
        req[ABILITY_KEY] = abilityFactory.createForUser(mockUser);
        next();
      },
    );

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /checklists/:checklistId/invitations', () => {
    it('should return 200 with items links for each invitation', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      serviceMock.listInvitations.mockResolvedValue([
        {
          id: 'inv-2',
          checklistId: 'checklist-1',
          title: 'Second Invite',
          createdAt: new Date(),
          expiresAt,
        },
        {
          id: 'inv-1',
          checklistId: 'checklist-1',
          title: 'First Invite',
          createdAt: new Date(),
          expiresAt,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations')
        .expect(200);

      const body = response.body as PlainResource;
      const items = body._links.items as LinkObject[];
      expect(items).toHaveLength(2);
      expect(items[0].href).toMatch(
        /\/checklists\/checklist-1\/invitations\/inv-2$/,
      );
      expect(items[0].title).toBe('Second Invite');
      const create = body._links.create as { href: string };
      expect(create.href).toMatch(/\/checklists\/checklist-1\/invitations$/);
    });

    it('should append (expired) to the name when invitation is expired', async () => {
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000);
      serviceMock.listInvitations.mockResolvedValue([
        {
          id: 'inv-1',
          checklistId: 'checklist-1',
          title: 'Old Invite',
          createdAt: new Date(),
          expiresAt,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations')
        .expect(200);

      const body = response.body as PlainResource;
      const item = body._links.items as LinkObject;
      expect(item.title).toBe('Old Invite (expired)');
    });

    it('should return 200 with no items key when list is empty', async () => {
      serviceMock.listInvitations.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations')
        .expect(200);

      const body = response.body as PlainResource;
      expect(body._links.items).toBeUndefined();
    });

    it('should return 404 when checklist does not exist', async () => {
      serviceMock.listInvitations.mockRejectedValue(new NotFoundException());

      await request(app.getHttpServer())
        .get('/checklists/non-existent/invitations')
        .expect(404);
    });

    it('should return 403 when caller is not the checklist owner', async () => {
      serviceMock.listInvitations.mockImplementation(
        (_checklistId, ability) => {
          ForbiddenError.from(ability).throwUnlessCan(
            'read',
            subject('ChecklistShareInvitation', {
              checklist: { createdBy: 'different-owner' },
            }),
          );
          return Promise.resolve([]);
        },
      );

      await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations')
        .expect(403);
    });
  });

  describe('POST /checklists/:checklistId/invitations', () => {
    it('should create an invitation and return 201 with Location header', async () => {
      serviceMock.createInvitation.mockResolvedValue('inv-123');

      const response = await request(app.getHttpServer())
        .post('/checklists/checklist-1/invitations')
        .send({ title: 'My Invitation' })
        .expect(201);

      expect(serviceMock.createInvitation).toHaveBeenCalledWith(
        'checklist-1',
        'My Invitation',
        expect.any(Function),
      );
      expect(response.headers.location).toMatch(
        /\/checklists\/checklist-1\/invitations\/inv-123$/,
      );
    });

    it('should return 404 when checklist does not exist', async () => {
      serviceMock.createInvitation.mockRejectedValue(new NotFoundException());

      await request(app.getHttpServer())
        .post('/checklists/non-existent/invitations')
        .send({ title: 'My Invitation' })
        .expect(404);
    });

    it('should return 403 when caller is not the checklist owner', async () => {
      serviceMock.createInvitation.mockImplementation(
        (_checklistId, _title, check) => {
          check?.({
            id: 'checklist-1',
            createdBy: 'different-owner',
            title: '',
            items: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return Promise.resolve('inv-123');
        },
      );

      await request(app.getHttpServer())
        .post('/checklists/checklist-1/invitations')
        .send({ title: 'My Invitation' })
        .expect(403);
    });
  });

  describe('GET /checklists/:checklistId/invitations/:id', () => {
    it('should return 200 with title, expiresAt and accept link when not expired', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      serviceMock.getInvitation.mockResolvedValue({
        checklistTitle: 'My Checklist',
        expiresAt,
      });

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations/inv-1')
        .expect(200);

      const body = response.body as PlainResource;
      expect(body.title).toBe('My Checklist');
      expect(body.expiresAt).toBe(expiresAt.toISOString());
      expect(body._links.accept).toBeDefined();
      expect((body._links.accept as { href: string }).href).toMatch(
        /\/checklists\/checklist-1\/invitations\/inv-1\/accept$/,
      );
    });

    it('should return 200 without accept link when expired', async () => {
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000);
      serviceMock.getInvitation.mockResolvedValue({
        checklistTitle: 'My Checklist',
        expiresAt,
      });

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations/inv-1')
        .expect(200);

      const body = response.body as PlainResource;
      expect(body.title).toBe('My Checklist');
      expect(body.expiresAt).toBe(expiresAt.toISOString());
      expect(body._links.accept).toBeUndefined();
    });

    it('should return 404 when invitation does not exist', async () => {
      serviceMock.getInvitation.mockRejectedValue(new NotFoundException());

      await request(app.getHttpServer())
        .get('/checklists/checklist-1/invitations/non-existent')
        .expect(404);
    });
  });

  describe('POST /checklists/:checklistId/invitations/:id/accept', () => {
    it('should return 204 on successful acceptance', async () => {
      serviceMock.acceptInvitation.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/checklists/checklist-1/invitations/inv-1/accept')
        .expect(204);

      expect(serviceMock.acceptInvitation).toHaveBeenCalledWith(
        'checklist-1',
        'inv-1',
        mockUser.uid,
      );
    });

    it('should return 404 when invitation does not exist', async () => {
      serviceMock.acceptInvitation.mockRejectedValue(new NotFoundException());

      await request(app.getHttpServer())
        .post('/checklists/checklist-1/invitations/non-existent/accept')
        .expect(404);
    });

    it('should return 410 when invitation is expired', async () => {
      serviceMock.acceptInvitation.mockRejectedValue(new GoneException());

      await request(app.getHttpServer())
        .post('/checklists/checklist-1/invitations/expired-inv/accept')
        .expect(410);
    });
  });
});
