import { v4 } from 'uuid';

import { OperationType } from '../../entities/Statement';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { CreateStatementUseCase } from './CreateStatementUseCase';
import { CreateStatementError } from '../../errors/CreateStatementError';

let createStatementUseCase: CreateStatementUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

const NON_EXISTENT_USER_UUID = v4();

describe('Create Statement Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepositoryInMemory,
      statementsRepositoryInMemory,
    );
  });

  it('should be able to create a new deposit', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    const createdUser = await usersRepositoryInMemory.create(user);
    // Cria um depósito
    const deposit = {
      user_id: createdUser.id!,
      description: 'Deposit',
      amount: 100.00,
      type: OperationType.DEPOSIT,
    };
    const createdDeposit = await createStatementUseCase.execute(deposit);

    expect(createdDeposit).toHaveProperty('id');
  });

  it('should be able to create a new withdrawal', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    const createdUser = await usersRepositoryInMemory.create(user);
    // Cria um depósito
    const deposit = {
      user_id: createdUser.id!,
      description: 'Deposit',
      amount: 100.00,
      type: OperationType.DEPOSIT,
    };
    await createStatementUseCase.execute(deposit);
    // Cria um saque
    const withdrawal = {
      user_id: createdUser.id!,
      description: 'Withdrawal',
      amount: 70.00,
      type: OperationType.WITHDRAW,
    };
    const createdWithdrawal = await createStatementUseCase.execute(withdrawal);

    expect(createdWithdrawal).toHaveProperty('id');
  });

  it('should not be able to create a new statement for a non existing user', async () => {
    // Tenta criar uma movimentação, sem criar o usuário
    const statement = {
      user_id: NON_EXISTENT_USER_UUID,
      description: 'Operation description',
      amount: 100.00,
      type: OperationType.DEPOSIT,
    };

    await expect(
      createStatementUseCase.execute(statement)
    ).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it('should not be able to create a new withdrawal with insufficient funds', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    const createdUser = await usersRepositoryInMemory.create(user);

    // Tenta criar um saque, sem ter fundos suficientes
    await expect(
      createStatementUseCase.execute({
        user_id: createdUser.id!,
        description: 'Failed withdrawal',
        amount: 999.00,
        type: OperationType.WITHDRAW,
      })
    ).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
