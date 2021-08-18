import { AppError } from '../../../shared/errors/AppError';

export namespace TransferFundsError {
  export class SendingUserNotFound extends AppError {
    constructor() {
      super('Sending user not found', 404);
    }
  }

  export class ReceivingUserNotFound extends AppError {
    constructor() {
      super('Receiving user not found', 404);
    }
  }

  export class InsufficientFunds extends AppError {
    constructor() {
      super('Insufficient funds', 400);
    }
  }
}
