import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { OperationType } from '../../entities/Statement';

let connection: Connection;

const USER_NAME = 'Test User';
const USER_EMAIL = 'user@fin.com';
const USER_PASSWORD = 'any';

describe('Get Statement Operation Controller', () => {
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

  it('should be able to get a statement operation for a given user', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Cria um novo depósito
    const responseDeposit = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 130.00,
        description: 'Bank transfer',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .get(`/api/v1/statements/${responseDeposit.body.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(responseDeposit.body.id);
    expect(response.body.user_id).toBe(responseToken.body.user.id);
    expect(response.body.type).toBe(OperationType.DEPOSIT);
    expect(Number(response.body.amount)).toBe(130.00);
  });

  it('should not be able to get a statement operation for a non existing user', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Cria um novo depósito
    const responseDeposit = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 115.00,
        description: 'Bank transfer',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    // Token inválido
    const invalidToken = 'abcdefghijklmnopqrstuvwxyz';

    // Tenta obter a movimentação, com um token inválido
    const response = await request(app)
      .get(`/api/v1/statements/statements/${responseDeposit.body.id}`)
      .set({
        Authorization: `Bearer ${invalidToken}`,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTInvalidTokenError().getMessage());
  });

  it('should not be able to get a statement operation if the token is missing', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Cria um novo depósito
    const responseDeposit = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 115.00,
        description: 'Bank transfer',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    // Tenta obter a movimentação, sem informar o token
    const response = await request(app)
      .get(`/api/v1/statements/statements/${responseDeposit.body.id}`);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTTokenMissingError().getMessage());
  });
});
