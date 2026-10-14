import request from 'supertest';

export function testRequest(server: Parameters<typeof request>[0]) {
  return request.agent(server).set('Host', 'api.example.test');
}