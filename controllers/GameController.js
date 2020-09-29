const { validationResult } = require('express-validator');
const { shuffle, pick, map } = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const md5 = require('md5');
const User = require('../models/User');
const Game = require('../models/Game');
const Contest = require('../models/Contest');
const ContestItem = require('../models/ContestItem');
const emailTransporter = require('../usecases/emailTransporter');
const renderConfirmationEmail = require('../usecases/renderConfirmationEmail');
const renderResetPasswordEmail = require('../usecases/renderResetPasswordEmail');
const { AppError } = require('../usecases/error');

const getCurrentRoundItems = (gameItems, round) =>
  gameItems.filter(
    ({ compares, wins }) => round === compares && round === wins,
  );

const generatePair = (items) =>
  shuffle(items)
    .slice(0, 2)
    .map(({ itemId }) => itemId);

const populatePair = (pair) =>
  Promise.all(pair.map((id) => ContestItem.findById(id)));

const GameController = {
  async start(req, res) {
    const {
      params: { contestId },
    } = req;
    const contest = Contest.findById(contestId);

    if (!contest) throw new AppError('Contest not found', 404);

    const items = await ContestItem.find({ contestId });

    const selectedItemsLength =
      items.length > 2 ? Math.floor(Math.log2(items.length)) ** 2 : 2;

    const totalRounds = items.length > 2 ? Math.sqrt(selectedItemsLength) : 1;

    const gameItems = shuffle(items)
      .slice(0, selectedItemsLength)
      .map(({ _id }) => ({
        itemId: _id,
        wins: 0,
        compares: 0,
      }));

    const round = 0;

    const pair = generatePair(gameItems);

    const game = new Game({
      contestId,
      items: gameItems,
      finished: false,
      round,
      totalRounds,
      pair,
    });
    await game.save();

    res.status(201).json({
      contestId,
      gameId: game._id,
      message: 'Game was successfully created',
    });
  },
  async getPair(req, res) {
    const {
      params: { id },
    } = req;
    const game = await Game.findById(id);

    if (!game) throw new AppError('Game not found!', 404);

    const pair = await populatePair(game.pair);

    res.status(200).json({
      round: game.round,
      totalRounds: game.totalRounds,
      contestId: game.contestId,
      finished: game.finished,
      pair,
    });
  },
  async choose(req, res) {
    const {
      params: { id },
      body: { winnerId },
    } = req;
    const game = await Game.findById(id);

    if (!game) throw new AppError('Game not found!', 404);

    if (game.finished) throw new AppError('Game has been finished', 400);

    if (!game.pair.includes(winnerId))
      throw new AppError('Invalid winner id', 400);

    // write results for participants
    game.items = game.items.map((item) => {
      const { itemId: id } = item;

      if (game.pair.includes(`${id}`)) item.compares += 1; // increment compares
      if (winnerId === `${id}`) item.wins += 1; // increment wins

      return item;
    });

    let roundItems = getCurrentRoundItems(game.items, game.round);

    // no items left on this round, go to next round
    if (roundItems.length === 0) {
      game.round += 1;
      roundItems = getCurrentRoundItems(game.items, game.round);
    }

    // game has finished
    if (roundItems.length > 1) {
      game.pair = generatePair(roundItems);
    }
    // game has finished
    else {
      game.finished = true;
      game.winnerId = winnerId;

      const contest = await Contest.findById(game.contestId);
      contest.games += 1;
      await contest.save();

      await Promise.all(
        game.items.map(async ({ itemId, compares, wins }) => {
          const contestItem = await ContestItem.findById(itemId);
          contestItem.compares += compares;
          contestItem.wins += wins;
          contestItem.games += 1;
          if (winnerId === `${itemId}`) contestItem.finalWins += 1;
          await contestItem.save();
        }),
      );
    }
    await game.save();

    const pair = await populatePair(game.pair);

    res.status(200).json({
      round: game.round,
      totalRounds: game.totalRounds,
      contestId: game.contestId,
      finished: game.finished,
      pair,
    });
  },
};

module.exports = GameController;
