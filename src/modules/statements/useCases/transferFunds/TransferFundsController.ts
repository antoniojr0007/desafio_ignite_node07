import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { TransferFundsUseCase } from './TransferFundsUseCase';

class TransferFundsController {

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.user;
    const { user_id } = request.params;
    const { amount, description } = request.body;

    const transferFundsUseCase = container.resolve(TransferFundsUseCase);

    const transfer = await transferFundsUseCase.execute({
      sender_id: id,
      receiver_id: user_id,
      amount,
      description,
    });

    return response.status(201).json(transfer);
  }
}

export { TransferFundsController };
