import { Statement } from "../entities/Statement";

type ICreateTransferDTO =
  Pick<
    Statement,
    'sender_id'
  >;

export type ICreateStatementDTO =
  Pick<
    Statement,
    'user_id' |
    'description' |
    'amount' |
    'type'
  > &
  Partial<ICreateTransferDTO>;