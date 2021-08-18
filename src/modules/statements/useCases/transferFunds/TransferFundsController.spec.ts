import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { OperationType } from '../../entities/Statement';
import { TransferFundsError } from '../../errors/TransferFundsError';

let connection: Connection;

const SENDER_NAME = 'User Sender';
const SENDER_EMAIL = 'sender@fin.com';
const SENDER_PASSWORD = 'any';
const idSender = uuidV4();
let tokenSender: string;

const RECEIVER_NAME = 'User Receiver';
const RECEIVER_EMAIL = 'receiver@fin.com';
const RECEIVER_PASSWORD = 'any';
const idReceiver = uuidV4();

describe('Transfer Funds Controller', () => {
  beforeAll(async () => {
    // Conecta com o BD
    connection = await createConnection();
    // Cria a estrutura do BD através das migrations
    await connection.runMigrations();

    // Cria os usuários
    const passwordSender = await hash(SENDER_PASSWORD, 8);
    await connection.query(
      `INSERT INTO users(id, name, email, password, created_at, updated_at)
        VALUES('${idSender}', '${SENDER_NAME}', '${SENDER_EMAIL}', '${passwordSender}', 'NOW()', 'NOW()')
      `
    );
    const passwordReceiver = await hash(RECEIVER_PASSWORD, 8);
    await connection.query(
      `INSERT INTO users(id, name, email, password, created_at, updated_at)
        VALUES('${idReceiver}', '${RECEIVER_NAME}', '${RECEIVER_EMAIL}', '${passwordReceiver}', 'NOW()', 'NOW()')
      `
    );

    // Faz login para obter o token do usuário emissor
    const responseToken = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: SENDER_EMAIL,
        password: SENDER_PASSWORD,
      });
    tokenSender = responseToken.body.token;

    // Cria um novo depósito para o usuário emissor
    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 100.00,
        description: 'Bank transfer',
      })
      .set({
        Authorization: `Bearer ${tokenSender}`,
      });
  });

  afterAll(async () => {
    // Exclui dados e tabelas do BD
    await connection.dropDatabase();
    // Fecha a conexão com o BD
    await connection.close();
  });

  it('should be able to transfer funds from one user to another', async () => {
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${idReceiver}`)
      .send({
        amount: 100.00,
        description: 'Bank transfer'
      })
      .set({
        Authorization: `Bearer ${tokenSender}`,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('sender_id');
    expect(response.body.user_id).toBe(idReceiver);
    expect(response.body.sender_id).toBe(idSender);
    expect(response.body.type).toBe(OperationType.TRANSFER);
    expect(Number(response.body.amount)).toBe(100.00);
  });

  it('should not be able to transfer funds from a non existing user', async () => {
    // Token não cadastrado
    const nonExistentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiMjJlMzU3YzQtZWY3YS00NDU3LWI0OGMtZDZhYzBjZTkwNDQ5IiwibmFtZSI6IlVzdcOhcmlvIERvaXMiLCJlbWFpbCI6ImRvaXNAZmluLWFwaS5jb20iLCJwYXNzd29yZCI6IiQyYSQwOCRkdXFiQ2FTTlRjNUxmbnZSY0lCOGJPS3AuTmtwQlNQTUU0NnltaFVxSFlEbGgzWGhKTEhteSIsImNyZWF0ZWRfYXQiOiIyMDIxLTA2LTAxVDE4OjAxOjA0LjI0MVoiLCJ1cGRhdGVkX2F0IjoiMjAyMS0wNi0wMVQxODowMTowNC4yNDFaIn0sImlhdCI6MTYyMjU1OTcxMCwiZXhwIjoxNjIyNjQ2MTEwLCJzdWIiOiIyMmUzNTdjNC1lZjdhLTQ0NTctYjQ4Yy1kNmFjMGNlOTA0NDkifQ.Ylobyp0dZO8fWxPsvrJ1FlFjR_mtaImcY5RuD_osiwk';

    // Tenta transferir com um token não cadastrado
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${idReceiver}`)
      .send({
        amount: 100.00,
        description: 'Bank transfer'
      })
      .set({
        Authorization: `Bearer ${nonExistentToken}`,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(new TransferFundsError.SendingUserNotFound().getMessage());
  });

  it('should not be able to transfer funds to a non existing user', async () => {
    // Tenta transferir para um uuid não cadastrado
    const nonExistentUuid = 'af2c9f76-afbc-4f59-b570-7b4b20d0b330';
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${nonExistentUuid}`)
      .send({
        amount: 100.00,
        description: 'Bank transfer'
      })
      .set({
        Authorization: `Bearer ${tokenSender}`,
      });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(new TransferFundsError.ReceivingUserNotFound().getMessage());
  });

  it('should not be able to transfer funds if the token is missing', async () => {
    // Tenta obter a movimentação, sem informar o token
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${idReceiver}`)
      .send({
        amount: 100.00,
        description: 'Bank transfer'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTTokenMissingError().getMessage());
  });

  it('should not be able to transfer funds if the token is invalid', async () => {
    // Token inválido
    const invalidToken = 'invalid-token';

    // Tenta transferir com um token inválido
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${idReceiver}`)
      .send({
        amount: 100.00,
        description: 'Bank transfer'
      })
      .set({
        Authorization: `Bearer ${invalidToken}`,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(new JWTInvalidTokenError().getMessage());
  });

  it('should not be able to transfer funds if there are no sufficient funds', async () => {
    // Tenta obter a movimentação, sem informar o token
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${idReceiver}`)
      .send({
        amount: 111.00,
        description: 'Bank transfer'
      })
      .set({
        Authorization: `Bearer ${tokenSender}`,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(new TransferFundsError.InsufficientFunds().getMessage());
  });
});