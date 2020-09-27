import fetch from 'node-fetch';

import { ACCEPT_HEADER_HTML, ACCEPT_HEADER_JSON, DEFAULT_HEADERS, DI_FM_ADDRESS } from "../constants";
import { IDiFmAppConfig } from "./di-fm-app-config.interface";
import { IRoutine } from "./routine.interface";
import { RequestOptionsInterface } from "./request-options.interface";
import { Logger } from "../logger/logger";
import { IChannel } from "./channel.interace";

const logger = new Logger('DI.FM');

export class DiFmClient {
  private _pageHTML: string;
  private _startConfig: IDiFmAppConfig;
  private _csrf: string;

  private _eventListeners = {
    login: [],
    online: [],
    offline: [],
    error: []
  };

  constructor() { }

  init() {
    return this._request('/', { api: false })
        .then(body => {
          this._pageHTML = body;
          this._startConfig = JSON.parse(/di\.app\.start\(({.*})\);/.exec(this._pageHTML)[1]);
          this._csrf = /<meta[^>]+name\s*=\s*"csrf-token" content="(.*?)"/.exec(this._pageHTML)[1];

          const result = { config: this._startConfig, csrf: this._csrf };
          this._fireEvent('login',  result);

          return result;
        });
  }

  getStartConfig(): IDiFmAppConfig {
    return this._startConfig;
  }

  ping() {
    return this._request('/ping', { root: true });
  }

  tuneIn(channelId: number): Promise<IRoutine> {
    return this._request(`/routines/channel/${channelId}?tune_in=true&audio_token=${this._startConfig.user.audio_token}`);
  }

  channel(channelId: number): Promise<IChannel> {
    return this._request('/channels/' + channelId)
  }

  on(name: string, listener: (...args: any) => void) {
    const i = this._eventListeners[name].indexOf();
    if (i === -1) {
      this._eventListeners[name].push(listener);
    }
  }

  off(name, listener: (...args: any) => void) {
    const i = this._eventListeners[name].indexOf();
    if (i !== -1) {
      this._eventListeners[name].splice(i,1);
    }
  }

  findChannelId(searchString: string): number {
    let channelCache = this._startConfig.channels.find(ch => searchString === ch.name);

    if (!channelCache) {
      channelCache = this._startConfig.channels.find(ch => new RegExp(searchString, 'gi').test(ch.name));
    }

    return channelCache ? channelCache.id : null;
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
            logger.log('Request error ', response);
            this._fireEvent('error', response);
            return Promise.reject(response);
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

  private _fireEvent(name: string, ...args) {
    for (const listener of this._eventListeners[name]) {
      listener(...args);
    }
  }
}
