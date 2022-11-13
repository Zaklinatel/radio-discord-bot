import { MusicPlayer } from '../music-player';
import { MessageController } from '../message-controller';
import { Guild } from 'discord.js';

export interface IGuildInstance {
  guild: Guild;
  musicPlayer: MusicPlayer;
  messageController: MessageController;
}