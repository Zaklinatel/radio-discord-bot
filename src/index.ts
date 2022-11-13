import { config } from 'dotenv';
import { Logger } from './logger/logger';
import { DiScord } from './bot/di-scord';

config();

const CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME || 'di-scord';
const mainLogger = new Logger('Main');

mainLogger.log('Start');

if (process.env.BOT_TOKEN == null) {
  throw new Error('Bot token is not set!');
}

new DiScord(CHANNEL_NAME)
  .init(process.env.BOT_TOKEN)
  .then(() => {
    mainLogger.log('Bot initialized');
  })
  .catch((...err) => {
    mainLogger.log('Error bot initializing', ...err);
  });
