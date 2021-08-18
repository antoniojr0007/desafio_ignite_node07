import { v4 } from 'uuid';

import { OperationType } from '../../entities/Statement';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { TransferFundsUseCase } from './TransferFundsUseCase';
import { TransferFundsError } from '../../errors/TransferFundsError';

let transferFundsUseCase: TransferFundsUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

const SENDER_NAME = 'User Sender';
const SENDER_EMAIL = 'sender@fin.com';
const SENDER_PASSWORD = 'any';
let idSender: string;

const RECEIVER_NAME = 'User Receiver';
const RECEIVER_EMAIL = 'receiver@fin.com';
const RECEIVER_PASSWORD = 'any';
let idReceiver: string;

const NON_EXISTENT_USER_UUID = v4();

describe('Transfer Funds Use Case', () => {
  beforeEach(async () => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    transferFundsUseCase = new TransferFundsUseCase(
      usersRepositoryInMemory,
      statementsRepositoryInMemory,
    );

    // Cria os usuários
    const sender = await usersRepositoryInMemory.create({
      name: SENDER_NAME,
      email: SENDER_EMAIL,
      password: SENDER_PASSWORD,
    });
    idSender = sender.id!;
    const receiver = await usersRepositoryInMemory.create({
      name: RECEIVER_NAME,
      email: RECEIVER_EMAIL,
      password: RECEIVER_PASSWORD,
    });
    idReceiver = receiver.id!;

    // Cria um novo depósito para o usuário emissor
    const deposit = {
      user_id: idSender,
      description: 'Deposit',
      amount: 100.00,
      type: OperationType.DEPOSIT,
    };
    await statementsRepositoryInMemory.create(deposit);
  });

  it('should be able to transfer funds from one user to another', async () => {
    const transfer = await transferFundsUseCase.execute({
      sender_id: idSender,
      receiver_id: idReceiver,
      amount: 90.00,
      description: 'Bank transfer',
    });

    expect(transfer).toHaveProperty('id');
  });

  it('should not be able to transfer funds from a non existing user', async () => {
    await expect(
      transferFundsUseCase.execute({
        sender_id: NON_EXISTENT_USER_UUID,
        receiver_id: idReceiver,
        amount: 80.00,
        description: 'Bank transfer',
      })
    ).rejects.toBeInstanceOf(TransferFundsError.SendingUserNotFound)
  });

  it('should not be able to transfer funds to a non existing user', async () => {
    await expect(
      transferFundsUseCase.execute({
        sender_id: idSender,
        receiver_id: NON_EXISTENT_USER_UUID,
        amount: 70.00,
        description: 'Bank transfer',
      })
    ).rejects.toBeInstanceOf(TransferFundsError.ReceivingUserNotFound)
  });

  it('should not be able to transfer funds if there are no sufficient funds', async () => {
    await expect(
      transferFundsUseCase.execute({
        sender_id: idSender,
        receiver_id: idReceiver,
        amount: 999.00,
        description: 'Bank transfer',
      })
    ).rejects.toBeInstanceOf(TransferFundsError.InsufficientFunds)
  });

});
