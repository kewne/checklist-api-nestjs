import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { USER_AUTH_KEY } from '../auth/auth.constants';
import { AbilityFactory, AppAbility } from './ability.factory';
import { ABILITY_KEY, CaslInterceptor } from './casl.interceptor';

describe('CaslInterceptor', () => {
  let interceptor: CaslInterceptor;
  let abilityFactory: jest.Mocked<AbilityFactory>;
  let createForUser: jest.MockedFunction<AbilityFactory['createForUser']>;

  beforeEach(() => {
    createForUser = jest.fn();
    abilityFactory = { createForUser };
    interceptor = new CaslInterceptor(abilityFactory);
  });

  it('attaches the ability to the request', () => {
    const user = { uid: 'user-1' };
    const ability = {} as AppAbility;
    createForUser.mockReturnValue(ability);

    const request: Record<symbol, unknown> = { [USER_AUTH_KEY]: user };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of(null) };

    interceptor.intercept(ctx, next);

    expect(createForUser).toHaveBeenCalledWith(user);
    expect(request[ABILITY_KEY]).toBe(ability);
  });

  it('does not set the ability when the user is absent', () => {
    const request: Record<symbol, unknown> = {};
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of(null) };

    interceptor.intercept(ctx, next);

    expect(createForUser).not.toHaveBeenCalled();
    expect(request[ABILITY_KEY]).toBeUndefined();
  });
});
