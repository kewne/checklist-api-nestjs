import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { HateoasModule } from '../hateoas/hateoas.module';
import { ChecklistInvitationController } from './checklist-invitation.controller';
import { InvitationService } from './invitation.service';

describe('ChecklistInvitationController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<Pick<InvitationService, 'createInvitation'>>;
  const mockUser: AuthUser = { uid: 'owner-uid' };

  beforeEach(async () => {
    serviceMock = {
      createInvitation: jest.fn(),
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

    app.use(
      (
        req: Request & { [USER_AUTH_KEY]: AuthUser },
        _res: Response,
        next: NextFunction,
      ) => {
        req[USER_AUTH_KEY] = mockUser;
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
        mockUser.uid,
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
      serviceMock.createInvitation.mockRejectedValue(new ForbiddenException());

      await request(app.getHttpServer())
        .post('/checklists/checklist-1/invitations')
        .send({ title: 'My Invitation' })
        .expect(403);
    });
  });
});
