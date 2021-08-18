import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import { IncorrectEmailOrPasswordError } from '../../errors/IncorrectEmailOrPasswordError';

let connection: Connection;

const USER_NAME = 'Test User';
const USER_EMAIL = 'user@fin.com';
const USER_PASSWORD = 'any';

describe('Authenticate User Controller', () => {
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

  it('should be able to authenticate a user', async () => {
    // Faz login
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should not be able to authenticate a user with a non-existing e-mail', async () => {
    // Tenta autenticar um usuário, usando um e-mail não cadastrado
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'non-existent@foo.com',
        password: USER_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new IncorrectEmailOrPasswordError().getMessage());
  });

  it('should not be able to authenticate a user with a non-matching password', async () => {
    // Tenta autenticar o usuário, usando uma senha diferente da cadastrada
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: 'different_password',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new IncorrectEmailOrPasswordError().getMessage());
  });
});
