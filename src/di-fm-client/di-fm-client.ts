import fetch from 'node-fetch';
import { ACCEPT_HEADER_HTML, ACCEPT_HEADER_JSON, DEFAULT_HEADERS, DI_FM_ADDRESS } from "../constants";
import { IDiFmAppConfig } from "./di-fm-app-config.interface";
import { IRoutine } from "./routine.interface";
import { RequestOptionsInterface } from "./request-options.interface";
import { Logger } from "../logger/logger";
import { IChannel } from "./channel.interace";
import { EventEmitter } from "events";

const logger = new Logger('DI.FM');

export class DiFmClient extends EventEmitter {
  private _pageHTML: string;
  private _startConfig: IDiFmAppConfig;
  private _csrf: string;

  constructor() {
    super();
  }

  init() {
    return this._request('/', { api: false })
        .then(body => {
          this._pageHTML = body;
          this._startConfig = Object.freeze(JSON.parse(/di\.app\.start\(({.*})\);/.exec(this._pageHTML)[1]));
          this._csrf = /<meta[^>]+name\s*=\s*"csrf-token" content="(.*?)"/.exec(this._pageHTML)[1];

          const result = { config: this._startConfig, csrf: this._csrf };
          this.emit('login',  result);

          return result;
        });
  }

  getStartConfig(): IDiFmAppConfig {
    return this._startConfig;
  }

  ping() {
    return this._request('/ping', { root: true });
  }

  listenHistoryChannel(channelId: number, trackId: number) {
    return this._request(`/listen_history`, {
      method: 'POST',
      body: JSON.stringify({
        track_id: trackId,
        channel_id: channelId
      })
    });
  }

  tuneIn(channelId: number): Promise<IRoutine> {
    return this._request(`/routines/channel/${channelId}?tune_in=true&audio_token=${this._startConfig.user.audio_token}`);
  }

  channel(channelId: number): Promise<IChannel> {
    return this._request('/channels/' + channelId)
  }

  findChannelId(searchString: string): number {
    let channel;

    if (/^\d+$/.test(searchString.trim())) {
      /*
       * If search string is a number, then search by position (not ID!).
       */
      const num = parseInt(searchString, 10);
      if (num > 0) {
        channel = this._startConfig.channels[num-1];
      }
    }

    if (!channel) {
      /*
       * Search by full match
       */
      channel = this._startConfig.channels.find(ch => searchString.toLowerCase() === ch.name.toLowerCase());
    }

    if (!channel) {
      /*
       * Search by partial matching
       */
      channel = this._startConfig.channels.find(ch => new RegExp(searchString, 'gi').test(ch.name));
    }

    if (!channel) {
      /*
       * split search string by words and count a matches in channel name by each,
       * then select a channel by highest match count (lower ids goes first).
       */

      const words = searchString.toLowerCase()
          .split(' ')
          .filter(word => /^[A-Za-z0-9]+$/gi.test(word));

      channel = this._startConfig.channels
          .map<{ id: number, matches: number }>(ch => ({
            id: ch.id,
            matches: words.reduce((sum, word) => sum + +ch.name.toLowerCase().includes(word), 0)
          }))
          .filter(result => result.matches)
          .reduce((result, ch) => {
            if (ch.matches > result.matches || ch.matches === result.matches && ch.id < result.id) {
              return ch;
            }

            return result;
          })
    }

    return channel ? channel.id : null;
  }

  getChannelList(): string[] {
    return this._startConfig.channels.map(ch => ch.name);
  }

  private _request(path, options: Partial<RequestOptionsInterface> = {}) {
    options = Object.assign({ api: true, root: false, headers: {} }, options);

    let url = this._getBaseUrl(options.api, options.root) + path;
    if (options.queryParams) {
      url += '?' + new URLSearchParams(options.queryParams).toString();
    }

    const urlParser = new URL(url);
    options.headers = Object.assign(this._getHeaders(urlParser, options.method || 'GET'), options.headers);
    options.headers['accept'] = options.api ? ACCEPT_HEADER_JSON : ACCEPT_HEADER_HTML;

    logger.log('Request:', options.method || 'GET', url);

    return fetch(url, options)
        .then(response => {
          if (response.status === 200) {
            return options.api ? response.json() : response.text();
          } else {
            logger.log('Error response: ', response.status, response.statusText);
            this.emit('error', response);
            return this.init().then(() => this._request(path, options));
          }
        })
        .catch(reason => {
          logger.log('Request error: ', reason);
          return Promise.reject(reason);
        });
  }

  private _getBaseUrl(api = true, root = false) {
    let url = DI_FM_ADDRESS;

    if (api) {
      url += root ? this._startConfig.api.urlRoot : this._startConfig.api.url
    }

    return url;
  }

  private _getHeaders(url: URL, method = 'GET') {
    const headers = Object.assign({}, DEFAULT_HEADERS, {
      // ':authority': url.host,
      // ':method': method.toUpperCase(),
      // ':path': url.pathname,
      // ':scheme': url.protocol.slice(0,-1),
      'referer': url.origin
    });

    if (this._csrf) headers['x-csrf-token'] = this._csrf;
    if (this._startConfig) headers['x-session-key'] = this._startConfig.user.session_key;

    return headers;
  }
}
