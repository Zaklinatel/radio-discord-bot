import { Message } from 'discord.js';

export interface NoticeResult {
  message: Message;
  deleted: Promise<Message>;
}