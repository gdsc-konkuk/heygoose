import { expect } from 'chai';
import { init } from './lib/seedDatabase';
import GooseStore from '../src/store/GooseStore';

const proxyquire = require('proxyquire').noCallThru();

let mongod: any, mongoDriver: any, handleGeese: any;

// eslint-disable-next-line @typescript-eslint/camelcase
const loadMiddleware = ({ enable_decrement }) => {
  const bot = proxyquire('../src/bot', {
    './config': {
      slack: {
        enableDecrement: enable_decrement,
        dailyCap: 5,
        dailyDecCap: 5,
        emojiInc: ' :goose: ',
        emojiDec: ':rottengoose:',
        disableEmojiDec: false,
      },
    },
    './slack/Wbc': {
      sendDM: (_user: string, _text: string) => true,
    },
  });

  handleGeese = bot.handleGeese;
};

describe('bot-test', async () => {
  [
    {
      describe: 'With file Driver as database',
      driver: 'file',
    },
    {
      describe: 'With Array Driver as database',
      driver: 'array',
    },
    {
      describe: 'With Mongodb Driver as database',
      driver: 'mongodb',
    },
  ].forEach((test) => {
    describe(test.describe, async () => {
      // eslint-disable-next-line @typescript-eslint/camelcase
      async function connectDB({ seedDB = false, enable_decrement }) {
        const dbinit: any = await init({
          driver: test.driver,
          random: false,
          seedDB,
        });
        if (dbinit.mongod && dbinit.mongoDriver) {
          mongod = dbinit.mongod;
          mongoDriver = dbinit.mongoDriver;
        }
        loadMiddleware({ enable_decrement });
      }

      async function closeDB() {
        if (test.driver === 'mongodb') {
          if (mongoDriver.client) await mongoDriver.client.close();
          if (mongod) await mongod.stop();
        }
      }

      async function reset(enable_decrement = true) {
        await closeDB();
        await connectDB({ enable_decrement });
      }

      before(async () => {
        await connectDB({ enable_decrement: true });
      });

      after(async () => {
        await closeDB();
      });

      describe('handleGeese', async () => {
        it('Should give geese, enable_decrement: true', async () => {
          const updates = [
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'dec',
            },
            {
              username: 'USER2',
              type: 'dec',
            },
          ];

          await handleGeese('USER1', updates);
          const givenToday = await GooseStore.givenToday('USER1', 'from');
          expect(givenToday).to.equal(5);
        });

        it('Should not give geese, enable_decrement: true', async () => {
          await reset();
          const updates = [
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'dec',
            },
            {
              username: 'USER2',
              type: 'dec',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
          ];

          await handleGeese('USER1', updates);
          const givenToday = await GooseStore.givenToday('USER1', 'from');
          expect(givenToday).to.equal(0);
        });

        it('should give geese, enable_decrement: false', async () => {
          await reset(false);
          const updates = [
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'dec',
            },
            {
              username: 'USER2',
              type: 'dec',
            },
          ];
          /* const gg = */ await handleGeese('USER1', updates);
          const givenTodayInc = await GooseStore.givenToday(
            'USER1',
            'from',
            'inc'
          );
          const givenTodayDec = await GooseStore.givenToday(
            'USER1',
            'from',
            'dec'
          );
          expect(givenTodayInc).to.equal(4);
          expect(givenTodayDec).to.equal(2);
        });

        it('should not give geese, enable_decrement: false', async () => {
          await reset(false);
          const updates = [
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
            {
              username: 'USER2',
              type: 'inc',
            },
          ];
          /* const gg = */ await handleGeese('USER1', updates);
          const givenTodayInc = await GooseStore.givenToday(
            'USER1',
            'from',
            'inc'
          );
          expect(givenTodayInc).to.equal(0);
        });
      });
    });
  });
});
