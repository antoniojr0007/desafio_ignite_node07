import { v4 } from 'uuid';

import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { ShowUserProfileUseCase } from './ShowUserProfileUseCase';
import { ShowUserProfileError } from '../../errors/ShowUserProfileError';

let showUserProfileUseCase: ShowUserProfileUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;

const NON_EXISTENT_USER_UUID = v4();

describe('Show User Profile Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(
      usersRepositoryInMemory,
    );
  });

  it('should be able to show a user\'s profile', async () => {
    // Cria um usuário
    const user = {
      name: 'John Doe',
      email: 'john.doe@foo.com',
      password: 'any'
    }
    const createdUser = await usersRepositoryInMemory.create(user);
    // Exibe o perfil do usuário
    const userProfile = await showUserProfileUseCase.execute(createdUser.id!);

    expect(userProfile).toHaveProperty('id');
    expect(userProfile.id).toBe(createdUser.id!);
    expect(userProfile.name).toBe(user.name);
    expect(userProfile.email).toBe(user.email);
  });

  it('should not be able to show a profile of a non-existent user', async () => {
    // Tenta exibir um perfil de usuário não existente
    await expect(
      showUserProfileUseCase.execute(NON_EXISTENT_USER_UUID)
    ).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
