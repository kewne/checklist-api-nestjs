import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AuthGuard, AuthUser } from './auth.guard';
import { Auth } from 'firebase-admin/auth';
import { User } from './user.decorator';

@Controller('test')
class TestController {
  @Get('protected')
  @UseGuards(AuthGuard)
  getProtected(@User() user: AuthUser) {
    return { message: 'protected', userId: user.uid, email: user.email };
  }

  @Get('public')
  getPublic() {
    return { message: 'public' };
  }
}

describe('AuthGuard', () => {
  let app: NestExpressApplication;
  const authMock = {
    verifyIdToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: Auth,
          useValue: authMock,
        },
        AuthGuard,
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    jest.clearAllMocks();
  });

  describe('GET /test/protected', () => {
    it('should return 401 when no authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Missing or invalid authorization header',
      );
    });

    it('should return 401 when authorization header is malformed', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Missing or invalid authorization header',
      );
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Missing or invalid authorization header',
      );
    });

    it('should return 401 when token is empty', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Missing or invalid authorization header',
      );
    });

    it('should return 401 when token verification fails', async () => {
      authMock.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid token');
      expect(authMock.verifyIdToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should return 200 and user data when token is valid', async () => {
      const mockDecodedToken = {
        uid: 'test-uid',
        email: 'test@example.com',
        email_verified: true,
        // other Firebase token properties would be here
      };

      authMock.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'protected',
        userId: 'test-uid',
        email: 'test@example.com',
      });
      expect(authMock.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('GET /test/public', () => {
    it('should return 200 without authorization', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/public')
        .expect(200);

      expect(response.body).toEqual({ message: 'public' });
      expect(authMock.verifyIdToken).not.toHaveBeenCalled();
    });
  });
});
