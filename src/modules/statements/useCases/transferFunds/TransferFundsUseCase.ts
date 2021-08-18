import { inject, injectable } from 'tsyringe';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { OperationType, Statement } from '../../entities/Statement';
import { IStatementsRepository } from '../../repositories/IStatementsRepository';
import { ITransferFundsDTO } from '../../dtos/ITransferFundsDTO';
import { TransferFundsError } from '../../errors/TransferFundsError';

@injectable()
class TransferFundsUseCase {

  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository,
  ) { }

  async execute({
    sender_id,
    receiver_id,
    amount,
    description,
  }: ITransferFundsDTO): Promise<Statement> {
    // Verifica o id do usuário emissor
    const sender = await this.usersRepository.findById(sender_id);
    if (!sender) {
      throw new TransferFundsError.SendingUserNotFound();
    }

    // Verifica o id do usuário receptor
    const receiver = await this.usersRepository.findById(receiver_id);
    if (!receiver) {
      throw new TransferFundsError.ReceivingUserNotFound();
    }

    // Verifica se o saldo do usuário emissor é suficiente para a transferência
    const { balance } = await this.statementsRepository.getUserBalance({
      user_id: sender_id,
    });
    if (balance < amount) {
      throw new TransferFundsError.InsufficientFunds();
    }

    // Grava a transferência (saída) da conta do emissor no BD
    const transferOutOperation = await this.statementsRepository.create({
      user_id: sender_id,
      sender_id,
      type: OperationType.TRANSFER,
      amount,
      description,
    });
    // Grava a entrada na conta do receptor no BD
    const transferInOperation = await this.statementsRepository.create({
      user_id: receiver_id,
      sender_id,
      type: OperationType.TRANSFER,
      amount,
      description,
    });

    // Retorna os dados da entrada para exibição
    return transferInOperation;
  }
}

export { TransferFundsUseCase };
