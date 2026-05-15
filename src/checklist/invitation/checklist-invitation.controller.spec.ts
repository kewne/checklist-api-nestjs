import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import {
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
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
    Pick<InvitationService, 'createInvitation' | 'acceptInvitation'>
  >;
  const mockUser: AuthUser = { uid: 'owner-uid' };

  beforeEach(async () => {
    serviceMock = {
      createInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
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
