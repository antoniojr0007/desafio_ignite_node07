import { OperationType, Statement } from "../entities/Statement";

export class BalanceMap {
  static toDTO({ statement, balance }: { statement: Statement[], balance: number }) {
    const parsedStatement = statement.map(({
      id,
      user_id,
      sender_id,
      amount,
      description,
      type,
      created_at,
      updated_at
    }) => (
      (type === OperationType.TRANSFER && sender_id !== user_id) ?
        {
          id,
          sender_id,
          amount: Number(amount),
          description,
          type,
          created_at,
          updated_at
        } :
        {
          id,
          amount: Number(amount),
          description,
          type,
          created_at,
          updated_at
        }
    ));

    return {
      statement: parsedStatement,
      balance: Number(balance)
    }
  }
}

