import { OperationType, Statement } from "../../entities/Statement";
import { ICreateStatementDTO } from "../../dtos/ICreateStatementDTO";
import { IGetBalanceDTO } from "../../dtos/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../../dtos/IGetStatementOperationDTO";
import { IStatementsRepository } from "../IStatementsRepository";

export class InMemoryStatementsRepository implements IStatementsRepository {
  private statements: Statement[] = [];

  async create(data: ICreateStatementDTO): Promise<Statement> {
    const statement = new Statement();

    Object.assign(statement, data);

    this.statements.push(statement);

    return statement;
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.statements.find(operation => (
      operation.id === statement_id &&
      operation.user_id === user_id
    ));
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number } | { balance: number, statement: Statement[] }
    > {
    const statement = this.statements.filter(operation => operation.user_id === user_id);

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
