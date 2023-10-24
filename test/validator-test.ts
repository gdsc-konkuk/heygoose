import { expect } from 'chai';
import { selfMention, sentFromBot, sentToBot } from '../src/lib/validator';

let msg, res, storedBots; // emojis;

describe('/app/lib/validator', () => {
  beforeEach(() => {
    res = null;
    // emojis = [
    //   { type: "inc", emoji: ":goose:" },
    //   { type: "dec", emoji: ":rottengoose:" },
    // ];

    storedBots = [
      {
        id: 'HEYGOOSE',
        name: 'heygoose',
        avatar: 'https://goose.web.png',
      },
      {
        id: 'slackbot',
        name: 'slackbot',
        avatar: 'https://slack.bot.png',
      },
    ];
  });

  describe('sentFromBot', () => {
    it('should return true', () => {
      msg = {
        user: 'HEYGOOSE',
        text: 'hejsan',
      };

      res = sentFromBot(msg, storedBots);
      expect(res).to.equal(true);
    });

    it('should return false', () => {
      msg = {
        user: 'notBot',
        text: 'hejsan',
      };

      res = sentFromBot(msg, storedBots);
      expect(res).to.equal(false);
    });
  });

  describe('sentToBot', () => {
    it('should return true', () => {
      msg = {
        user: 'USER1',
        text: 'hello <@HEYGOOSE>',
      };

      res = sentToBot(msg, storedBots);
      expect(res).to.equal(true);
    });

    it('should return false', () => {
      msg = {
        user: 'USER1',
        text: 'hello HEYBURRITO',
      };

      res = sentToBot(msg, storedBots);
      expect(res).to.equal(false);
    });
  });

  // Test if sender is mentioned in slackmessage
  describe('selfMention', () => {
    it('should return true', () => {
      msg = {
        user: 'USER1',
        text: '<@USER2> <@USER1> :burrito: :burrito:',
      };
      res = selfMention(msg);
      expect(res).to.equal(true);
    });

    it('should return false', () => {
      msg = {
        user: 'USER1',
        text: '<@USER2> :burrito: :burrito:',
      };
      res = selfMention(msg);
      expect(res).to.equal(false);
    });
  });
});
