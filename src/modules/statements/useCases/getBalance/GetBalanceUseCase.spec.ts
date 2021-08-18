import { v4 } from 'uuid';

import { OperationType } from '../../entities/Statement';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { GetBalanceUseCase } from './GetBalanceUseCase';
import { GetBalanceError } from '../../errors/GetBalanceError';

let getBalanceUseCase: GetBalanceUseCase;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let usersRepositoryInMemory: InMemoryUsersRepository;

const NON_EXISTENT_USER_UUID = v4();

describe('Get Balance Use Case', () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    usersRepositoryInMemory = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(
      statementsRepositoryInMemory,
      usersRepositoryInMemory,
    );
  });

  it('should be able to get the balance for a given user', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    const createdUser = await usersRepositoryInMemory.create(user);
    // Cria movimentações para o usuário
    const deposit = {
      user_id: createdUser.id!,
      description: 'Deposit',
      amount: 100.00,
      type: OperationType.DEPOSIT,
    };
    await statementsRepositoryInMemory.create(deposit);
    const withdrawal = {
      user_id: createdUser.id!,
      description: 'Withdrawal',
      amount: 30.00,
      type: OperationType.WITHDRAW,
    };
    await statementsRepositoryInMemory.create(withdrawal);
    // Consulta o balanço
    const balance = await getBalanceUseCase.execute({ user_id: createdUser.id! });

    expect(Number(balance.balance)).toBe(70.00);
  });

  it('should not be able to get the balance for a non existing user', async () => {
    await expect(
      getBalanceUseCase.execute({ user_id: NON_EXISTENT_USER_UUID })
    ).rejects.toBeInstanceOf(GetBalanceError);
  });
});
