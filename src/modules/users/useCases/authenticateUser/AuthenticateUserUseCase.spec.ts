import auth from '../../../../config/auth';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase';
import { IncorrectEmailOrPasswordError } from '../../errors/IncorrectEmailOrPasswordError';

let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe('Authenticate User Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory,
    );
    createUserUseCase = new CreateUserUseCase(
      usersRepositoryInMemory,
    );
  });

  it('should be able to authenticate a user', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any',
    }
    const createdUser = await createUserUseCase.execute(user);
    // Autentica o usuário
    const authenticatedUser = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(authenticatedUser).toHaveProperty('token');
    expect(authenticatedUser.token).toBeTruthy();
    expect(authenticatedUser.user.id).toBe(createdUser.id);
  });

  it('should not be able to authenticate a user with a non-existing e-mail', async () => {
    // Tenta autenticar um usuário, usando um e-mail não cadastrado
    await expect(
      authenticateUserUseCase.execute({
        email: 'non-existent@foo.com',
        password: 'any'
      })
    ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it('should not be able to authenticate a user with a non-matching password', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any',
    }
    const createdUser = await createUserUseCase.execute(user);
    // Tenta autenticar o usuário, usando uma senha diferente da cadastrada
    await expect(
      authenticateUserUseCase.execute({
        email: 'john.doe@foo.com',
        password: 'other'
      })
    ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
