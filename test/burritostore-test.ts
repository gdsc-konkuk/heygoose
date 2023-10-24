import { expect } from 'chai';
import GooseStore from '../src/store/GooseStore';
import { init } from './lib/seedDatabase';

let mongod: any, mongoDriver: any;

describe('Goosestore-test', async () => {
  [
    {
      describe: 'file Driver',
      driver: 'file',
    },
    {
      describe: 'Array Driver',
      driver: 'array',
    },
    {
      describe: 'Mongodb Driver',
      driver: 'mongodb',
    },
  ].forEach((test) => {
    describe(test.describe, async () => {
      async function connectDB(seedDB = false) {
        const dbinit: any = await init({
          driver: test.driver,
          random: false,
          seedDB,
        });
        if (dbinit.mongod && dbinit.mongoDriver) {
          mongod = dbinit.mongod;
          mongoDriver = dbinit.mongoDriver;
        }
      }

      async function closeDB() {
        if (test.driver === 'mongodb') {
          if (mongoDriver.client) await mongoDriver.client.close();
          if (mongod) await mongod.stop();
        }
      }

      before(async () => {
        await connectDB();
      });

      after(async () => {
        await closeDB();
      });

      describe('giveGoose', async () => {
        it('Should give goose and return event', async () => {
          const res2 = await GooseStore.giveGoose('USER1', 'USER2');
          const res3 = await GooseStore.giveGoose('USER2', 'USER1');
          const res1 = await GooseStore.giveGoose('USER1', 'USER2');
          const res4 = await GooseStore.giveGoose('USER2', 'USER1');
          expect(res1).to.equal('USER1');
          expect(res2).to.equal('USER1');
          expect(res3).to.equal('USER2');
          expect(res4).to.equal('USER2');
        });
      });

      describe('takeAwayGoose', () => {
        it('Should not takeaway goose, lowset score is 0', async () => {
          const res = await GooseStore.takeAwayGoose('USER3', 'USER1');
          expect(res).to.deep.equal([]);
        });

        it('Should take away goose', async () => {
          const res1 = await GooseStore.takeAwayGoose('USER1', 'USER2');
          const res2 = await GooseStore.takeAwayGoose('USER1', 'USER2');
          const res3 = await GooseStore.takeAwayGoose('USER2', 'USER1');
          const res4 = await GooseStore.takeAwayGoose('USER2', 'USER1');
          expect(res1).to.equal('USER1');
          expect(res2).to.equal('USER1');
          expect(res3).to.equal('USER2');
          expect(res4).to.equal('USER2');
        });
      });

      describe('getUserStats', () => {
        it('Should return userstats for USER1', async () => {
          const res = await GooseStore.getUserStats('USER1');
          expect(res).to.deep.equal({
            receivedToday: 4,
            givenToday: 4,
            _id: 'USER1',
            received: 4,
            given: 4,
          });
        });

        it('Should return userstats for USER2', async () => {
          const res = await GooseStore.getUserStats('USER2');
          expect(res).to.deep.equal({
            receivedToday: 4,
            givenToday: 4,
            _id: 'USER2',
            received: 4,
            given: 4,
          });
        });

        describe('givenGeeseToday', () => {
          it('Should return givenGeeseToday stats for USER1 lisyType: to', async () => {
            const res = await GooseStore.givenGeeseToday('USER1', 'to');
            expect(res).to.equal(4);
          });
          it('Should return givenGeeseToday stats for USER1 lisyType: from', async () => {
            const res = await GooseStore.givenGeeseToday('USER1', 'from');
            expect(res).to.equal(4);
          });

          it('Should return givenGeeseToday stats for USER2 lisyType: to', async () => {
            const res = await GooseStore.givenGeeseToday('USER2', 'to');
            expect(res).to.equal(4);
          });
          it('Should return givenGeeseToday stats for USER2 lisyType: from', async () => {
            const res = await GooseStore.givenGeeseToday('USER2', 'from');
            expect(res).to.equal(4);
          });
        });
      });
    });
  });
});
