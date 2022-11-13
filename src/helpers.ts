import { Guild, PartialUser, User } from 'discord.js';
import { MusicPlayer } from './music-player';
import fetch from 'node-fetch';

export function getHttpFileStream(url: string): Promise<NodeJS.ReadableStream | null> {
  return fetch(httpsURL(url)).then(response => response.body);
}

export function guildString(guild: Guild): string {
  return `${guild.name}#${guild.id}`;
}

export function canInvokeCommand(user: User | PartialUser, musicPlayer: MusicPlayer) {
  const channel = musicPlayer.getConnectedChannel();

  if (channel && musicPlayer.isConnected()) {
    const empty = channel.members.size < 2;
    const hasMe = channel.members.has(user.id);
    return hasMe || empty;
  } else {
    return true;
  }
}

export function httpsURL(url: string): string {
  try {
    return _validateUrl(url);
  } catch (e) {
    return _validateUrl(`https:${url}`);
  }
}

function _validateUrl(url: string) {
  return new URL(url).toString();
}