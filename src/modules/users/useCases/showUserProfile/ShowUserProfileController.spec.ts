import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';

let connection: Connection;

const USER_NAME = 'Test User';
const USER_EMAIL = 'user@fin.com';
const USER_PASSWORD = 'any';

describe('Show User Profile Controller', () => {
  beforeAll(async () => {
    // Conecta com o BD
    connection = await createConnection();
    // Cria a estrutura do BD através das migrations
    await connection.runMigrations();

    // Cria um usuário
    const id = uuidV4();
    const password = await hash(USER_PASSWORD, 8);
    await connection.query(
      `INSERT INTO users(id, name, email, password, created_at, updated_at)
        VALUES('${id}', '${USER_NAME}', '${USER_EMAIL}', '${password}', 'NOW()', 'NOW()')
      `
    );
  });

  afterAll(async () => {
    // Exclui dados e tabelas do BD
    await connection.dropDatabase();
    // Fecha a conexão com o BD
    await connection.close();
  });

  it('should be able to show a user\'s profile', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Exibe o perfil do usuário
    const response = await request(app)
      .get('/api/v1/profile')
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(USER_NAME);
  });

  it('should not be able to show a profile of a non-existent user', async () => {
    // Token inválido
    const invalidToken = 'abcdefghijklmnopqrstuvwxyz';

    // Tenta exibir um perfil de usuário não existente
    const response = await request(app)
      .get('/api/v1/profile')
      .set({
        Authorization: `Bearer ${invalidToken}`,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTInvalidTokenError().getMessage());
  });

  it('should not be able to show a profile if the token is missing', async () => {
    // Tenta exibir um perfil de usuário, sem informar o token
    const response = await request(app)
      .get('/api/v1/profile');

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTTokenMissingError().getMessage());
  });


});
