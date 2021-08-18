import { getRepository, Repository } from "typeorm";

import { OperationType, Statement } from "../entities/Statement";
import { ICreateStatementDTO } from "../dtos/ICreateStatementDTO";
import { IGetBalanceDTO } from "../dtos/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../dtos/IGetStatementOperationDTO";
import { IStatementsRepository } from "./IStatementsRepository";

export class StatementsRepository implements IStatementsRepository {
  private repository: Repository<Statement>;

  constructor() {
    this.repository = getRepository(Statement);
  }

  async create({
    user_id,
    sender_id,
    amount,
    description,
    type
  }: ICreateStatementDTO): Promise<Statement> {
    const statement = this.repository.create({
      user_id,
      sender_id,
      amount,
      description,
      type
    });

    return this.repository.save(statement);
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.repository.findOne(statement_id, {
      where: { user_id }
    });
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number } | { balance: number, statement: Statement[] }
    > {
    const statement = await this.repository.find({
      where: { user_id }
    });

    const balance = statement.reduce((acc, operation) => {
      if (operation.type === OperationType.DEPOSIT) {
        return acc + Number(operation.amount);
      } else if (operation.type === OperationType.WITHDRAW) {
        return acc - Number(operation.amount);
      } else {
        // É uma transferência
        if (operation.user_id === operation.sender_id) {
          // Emissor é o autor da operação (é uma retirada)
          return acc - Number(operation.amount);
        } else {
          // O autor da operação é outro usuário (é um recebimento)
          return acc + Number(operation.amount);
        }
      }
    }, 0);

    if (with_statement) {
      return {
        statement,
        balance
      }
    }

    return { balance }
  }
}
