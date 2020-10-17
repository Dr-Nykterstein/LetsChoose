import { Query } from 'mongoose';

import { Game, GameModel } from '../models/Game';
import { AppError } from '../usecases/error';

export type CreateGameData = Omit<Game, 'id'>;

export interface IGameRepository {
  countDocuments(): Query<number>;
  aggregate(aggregations?: any[]): Promise<Game[]>;
  findById(gameId: string): Promise<Game>;
  findByIdAndUpdate(gameId: string, data: Partial<Game>): Promise<Game>;
  deleteGame(gameId: string): Promise<Game>;
  createGame(data: CreateGameData): Promise<Game>;
}

export default class GameRepository implements IGameRepository {
  public countDocuments(): Query<number> {
    return GameModel.countDocuments();
  }

  public aggregate(aggregations?: any[]): Promise<Game[]> {
    return GameModel.aggregate(aggregations).exec();
  }

  public async findById(gameId: string): Promise<Game> {
    const user = await GameModel.findById(gameId).populate('items');
    if (!user) {
      throw new AppError('Game not found', 404);
    }
    return user;
  }

  public async findByIdAndUpdate(
    gameId: string,
    data: Partial<Game>,
  ): Promise<Game> {
    const user = await GameModel.findByIdAndUpdate(gameId, data);
    if (!user) {
      throw new AppError('Game not found', 404);
    }
    return user;
  }

  public async deleteGame(gameId: string): Promise<Game> {
    const user = await GameModel.findByIdAndRemove(gameId);
    if (!user) {
      throw new AppError('Game not found', 404);
    }
    return user;
  }

  public async createGame(data: CreateGameData): Promise<Game> {
    const user = new GameModel(data);
    await user.save();
    return user;
  }
}
