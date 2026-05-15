import { Controller, Get } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { Ability } from './ability.decorator';
import type { AppAbility } from './ability.factory';
import { ABILITY_KEY } from './casl.interceptor';

@Controller('test')
class TestController {
  @Get()
  handle(@Ability() ability: AppAbility): unknown {
    return { received: ability !== undefined };
  }
}

describe('@Ability() decorator', () => {
  let app: NestExpressApplication;

  afterEach(async () => {
    await app?.close();
  });

  const buildApp = async (ability?: AppAbility) => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();

    app.use(
      (
        req: Request & { [ABILITY_KEY]?: AppAbility },
        _res: Response,
        next: NextFunction,
      ) => {
        if (ability !== undefined) {
          req[ABILITY_KEY] = ability;
        }
        next();
      },
    );

    await app.init();
  };

  it('returns 200 and the ability is received when the key is set', async () => {
    const ability = {} as AppAbility;
    await buildApp(ability);

    await request(app.getHttpServer())
      .get('/test')
      .expect(200, { received: true });
  });

  it('returns 401 when the ability key is absent', async () => {
    await buildApp();

    await request(app.getHttpServer()).get('/test').expect(401);
  });
});
