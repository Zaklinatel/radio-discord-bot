import { Guild, PartialUser, User } from 'discord.js';
import { MusicPlayer } from './music-player';
import fetch from 'node-fetch';
import { QueryParameters } from './audio-addict-api-client/request.options.interface';

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

export function fillUrlParametersObject(
  params: QueryParameters,
  prefix = '',
  urlSearchParams = new URLSearchParams()
): URLSearchParams {
  for (const key in params) {
    const value = params[key];
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    switch (typeof value) {
    case 'object':
      if (value instanceof Array) {
        for (const item of value) {
          urlSearchParams.append(`${fullKey}[]`, item.toString());
        }
      } else {
        urlSearchParams = fillUrlParametersObject(value, fullKey, urlSearchParams);
      }
      break;

    default:
      urlSearchParams.append(fullKey, value.toString());
    }
  }

  return urlSearchParams;
}

function _validateUrl(url: string) {
  return new URL(url).toString();
}