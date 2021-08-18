import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { CreateUserUseCase } from './CreateUserUseCase';
import { CreateUserError } from '../../errors/CreateUserError';

let createUserUseCase: CreateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;

describe('Create User Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(
      usersRepositoryInMemory,
    );
  });

  it('should be able to create a new user', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    const createdUser = await createUserUseCase.execute(user);

    expect(createdUser).toHaveProperty('id');
  });

  it('should not be able to create a new user with an existing e-mail', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    await createUserUseCase.execute(user);

    // Tenta criar outro usuário, usando o mesmo e-mail
    await expect(
      createUserUseCase.execute({
        name: 'Another User',
        email: 'john.doe@foo.com',
        password: 'other'
      })
    ).rejects.toBeInstanceOf(CreateUserError);
  });
});
