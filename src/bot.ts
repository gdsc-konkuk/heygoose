import config from './config';
import GooseStore from './store/GooseStore';
import LocalStore from './store/LocalStore';
import { parseMessage } from './lib/parseMessage';
import { validBotMention, validMessage } from './lib/validator';
import Rtm from './slack/Rtm';
import Wbc from './slack/Wbc';

const {
  enableDecrement,
  dailyCap,
  dailyDecCap,
  emojiInc,
  emojiDec,
  disableEmojiDec,
} = config.slack;

interface Emojis {
  type: string;
  emoji: string;
}

interface Updates {
  username: string;
  type: string;
}
const emojis: Array<Emojis> = [];

const incEmojis = emojiInc.split(',').map((emoji) => emoji.trim());
incEmojis.forEach((emoji: string) => emojis.push({ type: 'inc', emoji }));

if (!disableEmojiDec) {
  const decEmojis = emojiDec.split(',').map((emoji) => emoji.trim());
  decEmojis.forEach((emoji: string) => emojis.push({ type: 'dec', emoji }));
}

const giveGeese = async (giver: string, updates: Updates[]) =>
  updates.reduce(
    async (prev: any, goose) =>
      prev.then(async () => {
        if (goose.type === 'inc') {
          await GooseStore.giveGoose(goose.username, giver);
        } else if (goose.type === 'dec') {
          await GooseStore.takeAwayGoose(goose.username, giver);
        }
      }),
    Promise.resolve()
  );

const notifyUser = (user: string, message: string) => Wbc.sendDM(user, message);

const handleGeese = async (giver: string, updates: Updates[]) => {
  if (enableDecrement) {
    const geese = await GooseStore.givenGeeseToday(giver, 'from');
    const diff = dailyCap - geese;
    if (updates.length > diff) {
      notifyUser(
        giver,
        `You are trying to give away ${updates.length} geese, but you only have ${diff} geese left today!`
      );
      return false;
    }
    if (geese >= dailyCap) {
      return false;
    }
    await giveGeese(giver, updates);
  } else {
    const givenGeese = await GooseStore.givenToday(giver, 'from', 'inc');
    const givenRottenGeese = await GooseStore.givenToday(giver, 'from', 'dec');
    const incUpdates = updates.filter((x) => x.type === 'inc');
    const decUpdates = updates.filter((x) => x.type === 'dec');
    const diffInc = dailyCap - givenGeese;
    const diffDec = dailyDecCap - givenRottenGeese;
    if (incUpdates.length) {
      if (incUpdates.length > diffInc) {
        notifyUser(
          giver,
          `You are trying to give away ${updates.length} geese, but you only have ${diffInc} geese left today!`
        );
      } else {
        await giveGeese(giver, incUpdates);
      }
    }
    if (decUpdates.length) {
      if (decUpdates.length > diffDec) {
        notifyUser(
          giver,
          `You are trying to give away ${updates.length} rottengeese, but you only have ${diffDec} rottengeese left today!`
        );
      } else {
        await giveGeese(giver, decUpdates);
      }
    }
  }
  return true;
};

const start = () => {
  Rtm.on('slackMessage', async (event: any) => {
    if (validMessage(event, emojis, LocalStore.getAllBots())) {
      if (validBotMention(event, LocalStore.botUserID())) {
        // Geather data and send back to user
      } else {
        const result = parseMessage(event, emojis);
        if (result) {
          const { giver, updates } = result;
          if (updates.length) {
            await handleGeese(giver, updates);
          }
        }
      }
    }
  });
};

export { handleGeese, notifyUser, start };
