import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import { CreateUserError } from '../../errors/CreateUserError';

let connection: Connection;

const USER_NAME = 'Test User';
const USER_EMAIL = 'user@fin.com';
const USER_PASSWORD = 'any';

describe('Create User Controller', () => {
  beforeAll(async () => {
    // Conecta com o BD
    connection = await createConnection();
  });

  beforeEach(async () => {
    // Cria a estrutura do BD através das migrations
    await connection.runMigrations();
  });

  afterEach(async () => {
    // Exclui dados e tabelas do BD
    await connection.dropDatabase();
  });

  afterAll(async () => {
    // Fecha a conexão com o BD
    await connection.close();
  });

  it('should be able to create a new user', async () => {
    // Cria um usuário
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: USER_NAME,
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });

    expect(response.statusCode).toBe(201);
  });

  it('should not be able to create a new user with an existing e-mail', async () => {
    // Cria um usuário
    const id = uuidV4();
    const password = await hash(USER_PASSWORD, 8);
    await connection.query(
      `INSERT INTO users(id, name, email, password, created_at, updated_at)
        VALUES('${id}', '${USER_NAME}', '${USER_EMAIL}', '${password}', 'NOW()', 'NOW()')
      `
    );

    // Tenta criar outro usuário, usando o mesmo e-mail
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Other Name',
        email: USER_EMAIL,
        password: 'other',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(new CreateUserError().getMessage());
  });
});
