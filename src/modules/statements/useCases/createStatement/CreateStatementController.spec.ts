import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { OperationType } from '../../entities/Statement';
import { CreateStatementError } from '../../errors/CreateStatementError';

let connection: Connection;

const USER_NAME = 'Test User';
const USER_EMAIL = 'user@fin.com';
const USER_PASSWORD = 'any';

describe('Create Statement Controller', () => {
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

  it('should be able to create a new deposit', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Cria um novo depósito
    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 100.00,
        description: 'Cash deposit',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.type).toBe(OperationType.DEPOSIT);
    expect(Number(response.body.amount)).toBe(100.00);
  });

  it('should be able to create a new withdrawal', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Cria um novo depósito (deve haver saldo para o saque)
    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 120.00,
        description: 'Cash deposit',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    // Cria um novo saque
    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 70.00,
        description: 'Cash withdraw',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.type).toBe(OperationType.WITHDRAW);
    expect(Number(response.body.amount)).toBe(70.00);
  });

  it('should not be able to create a new statement for a non existing user', async () => {
    // Token inválido
    const invalidToken = 'abcdefghijklmnopqrstuvwxyz';

    // Tenta criar uma movimentação, sem criar o usuário
    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 40.00,
        description: 'Cash deposit',
      })
      .set({
        Authorization: `Bearer ${invalidToken}`,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTInvalidTokenError().getMessage());
  });

  it('should not be able to create a new statement if the token is missing', async () => {
    // Tenta criar uma movimentação, sem informar o token
    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 40.00,
        description: 'Cash deposit',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTTokenMissingError().getMessage());
  });

  it('should not be able to create a new withdrawal with insufficient funds', async () => {
    // Faz login para obter o token do usuário
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
    const { token } = responseToken.body;

    // Tenta criar um saque, sem ter fundos suficientes
    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 1000.00,
        description: 'Cash withdrawal',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(new CreateStatementError.InsufficientFunds().getMessage());
  });
});
