import fetch, { Response } from 'node-fetch';
import { ACCEPT_HEADER_JSON, DEFAULT_HEADERS } from '../constants';
import { IAppConfig } from './app-config.interface';
import { IRoutine } from './routine.interface';
import { IRequestOptions } from './request.options.interface';
import { Logger } from '../logger/logger';
import { IChannel } from './channel.interace';

const logger = new Logger('DI.FM Client');

export class AudioAddictNetwork {
  constructor(
    public readonly networkId: number,
    public readonly appConfig: IAppConfig,
    public readonly csrfToken: string
  ) {}

  ping() {
    return this._apiRequest('/ping', { root: true });
  }

  listenHistoryChannel(channelId: number, trackId: number) {
    return this._apiRequest(`/listen_history`, {
      method: 'POST',
      body: JSON.stringify({
        track_id: trackId,
        channel_id: channelId,
      }),
    });
  }

  tuneIn(channelId: number): Promise<IRoutine> {
    return this._apiRequest(`/routines/channel/${channelId}?tune_in=true&audio_token=${this.appConfig.user.audio_token}`);
  }

  channel(channelId: number): Promise<IChannel> {
    return this._apiRequest('/channels/' + channelId);
  }

  findChannelId(searchString: string): number | undefined {
    let channel;

    if (/^\d+$/.test(searchString.trim())) {
      /*
       * If search string is a number, then search by position (not ID!).
       */
      const num = parseInt(searchString, 10);
      if (num > 0) {
        channel = this.appConfig.channels[num - 1];
      }
    }

    if (!channel) {
      /*
       * Search by full match
       */
      channel = this.appConfig.channels.find(ch => searchString.toLowerCase() === ch.name.toLowerCase());
    }

    if (!channel) {
      /*
       * Search by partial matching
       */
      channel = this.appConfig.channels.find(ch => new RegExp(searchString, 'gi').test(ch.name));
    }

    if (!channel) {
      /*
       * split search string by words and count a matches in channel name by each,
       * then select a channel by highest match count (lower ids goes first).
       */

      const words = searchString.toLowerCase()
        .split(' ')
        .filter(word => /^[A-Za-z0-9]+$/gi.test(word));

      channel = this.appConfig.channels
        .map<{ id: number, matches: number }>(ch => ({
          id: ch.id,
          matches: words.reduce((sum, word) => sum + +ch.name.toLowerCase().includes(word), 0),
        }))
        .filter(result => result.matches)
        .sort((a, b) => {
          if (a.matches > b.matches || a.matches === b.matches && a.id < b.id) {
            return -1;
          } else {
            return 1;
          }
        })[0];
    }

    return channel ? channel.id : undefined;
  }

  getChannelList(): string[] {
    return this.appConfig.channels.map(ch => ch.name);
  }

  private async _apiRequest<T extends object>(path, options: Partial<IRequestOptions> = {}): Promise<T> {
    const opt = { root: false, headers: {}, ...options };

    let url = this._getBaseUrl(opt.root) + path;
    if (opt.queryParams) {
      url += '?' + new URLSearchParams(opt.queryParams).toString();
    }

    const urlParser = new URL(url);
    opt.headers = Object.assign(this._getHeaders(urlParser.origin), opt.headers);

    logger.log('Request:', opt.method || 'GET', url);

    let response: Response;

    try {
      response = await fetch(url, options);
    } catch (error) {
      if (error instanceof Error) {
        const msg = `Request error: ${error.message}`;
        logger.log(msg);
        throw new Error(msg);
      }

      throw error;
    }

    if (response.ok) {
      return response.json();
    } else {
      const msg = `Error response ${response.status} ${response.statusText}`;
      logger.log(msg);
      throw new Error(msg);
    }
  }

  private _getBaseUrl(root: boolean) {
    return root ? this.appConfig.api.urlRoot : `${this.appConfig.api.urlRoot}/${this.appConfig.network_key}`;
  }

  private _getHeaders(referer: string) {
    return {
      ...DEFAULT_HEADERS,
      'accept': ACCEPT_HEADER_JSON,
      'referer': referer,
      'content-type': 'application/json',
      'x-csrf-token': this.csrfToken,
      'x-session-key': this.appConfig.user.session_key,
    };
  }
}
