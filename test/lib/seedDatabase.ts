import 'dotenv/config';
import * as fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import config from '../../src/config';
import { env, pathExists, createPath } from '../../src/lib/utils';

import databaseDrivers from '../../src/database/drivers';
import BurritoStore from '../../src/store/BurritoStore';
import Localstore from '../../src/store/LocalStore';
import WBCHandler from '../../src/slack/Wbc';
import slack from '../../src/slack';

const mockData = require('../data/mockData.json');

const TYPES = ['give', 'takeaway'];
let SLACKUSERS = [];
let mongod;
let mongoDriver;

const today = new Date();
const yesterDay = new Date(today);
const oneWeek = new Date(today);
yesterDay.setDate(yesterDay.getDate() - 1);
oneWeek.setDate(today.getDate() - 7);
function pickRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

async function give(to, from, date) {
  await BurritoStore.giveBurrito(to, from, date);
}
async function takeaway(to, from, date) {
  await BurritoStore.takeAwayBurrito(to, from, date);
}

function pickRandom(input) {
  let result;
  switch (input) {
    case 'user':
      result = SLACKUSERS[Math.floor(Math.random() * SLACKUSERS.length)];
      break;
    default:
  }
  return result;
}

async function init({ driver = config.db.db_driver, random, seedDB = true }) {
  // Set and start slack services
  const { wbc } = slack;

  SLACKUSERS = [];

  if (!pathExists(config.db.db_path)) {
    if (createPath(config.db.db_path)) {
      //
    } else {
      throw new Error('Could not create database path');
    }
  }

  await WBCHandler.register(wbc);
  await Localstore.fetch();
  const users = await Localstore.getSlackUsers();
  SLACKUSERS = users.map((x) => x.id);

  if (env === 'testing' && driver === 'file') {
    try {
      fs.unlinkSync(`${config.db.db_path}${config.db.db_fileName}`);
    } catch (e) {
      //
    }
  }

  if (env === 'testing' && driver === 'mongodb') {
    mongod = new MongoMemoryServer();
    const uri = await mongod.getConnectionString();
    const database = await mongod.getDbName();
    mongoDriver = databaseDrivers[driver]({
      db_uri: uri,
      db_name: database,
    });
    BurritoStore.setDatabase(mongoDriver);
  } else {
    BurritoStore.setDatabase(databaseDrivers[driver]());
  }

  if (!seedDB) {
    return {
      mongoDriver,
      mongod,
    };
  }

  if (random) {
    for (let i = 1; i <= 100; i++) {
      const fromUser = pickRandom('user');
      let toUser = pickRandom('user');
      while (fromUser === toUser) {
        toUser = pickRandom('user');
      }

      const typeBurrito = TYPES[Math.floor(Math.random() * TYPES.length)];
      switch (typeBurrito) {
        case 'give':
          // eslint-disable-next-line no-await-in-loop
          await give(toUser, fromUser, pickRandomDate(oneWeek, today));
          break;
        case 'takeaway':
          // eslint-disable-next-line no-await-in-loop
          await takeaway(toUser, fromUser, pickRandomDate(oneWeek, today));
          break;
        default:
      }
    }
  } else {
    // eslint-disable-next-line no-restricted-syntax
    for (const data of mockData) {
      const date =
        data.date === 'random' ? pickRandomDate(oneWeek, yesterDay) : undefined;
      switch (data.type) {
        case 'inc':
          // eslint-disable-next-line no-await-in-loop
          await give(data.to, data.from, date);
          break;
        case 'dec':
          // eslint-disable-next-line no-await-in-loop
          await takeaway(data.to, data.from, date);
          break;
        default:
      }
    }
  }

  return {
    mongoDriver,
    mongod,
  };
}

// eslint-disable-next-line import/prefer-default-export
export { init };
