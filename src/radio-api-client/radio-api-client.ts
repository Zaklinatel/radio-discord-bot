import fetch from 'node-fetch';
import { ACCEPT_HEADER_HTML, ACCEPT_HEADER_JSON, BANNED_NETWORK_KEYS, DEFAULT_HEADERS, DI_FM_HOST } from '../constants';
import { IRadioAppConfig } from './radio-app-config.interface';
import { IRoutine } from './routine.interface';
import { RequestOptionsInterface } from './request-options.interface';
import { Logger } from '../logger/logger';
import { IChannel } from './channel.interace';
import { EventEmitter } from 'events';

const logger = new Logger('DI.FM Client');

export class RadioApiClient extends EventEmitter {
  private _networkConfigMap = new Map<number, {
    csrfToken: string;
    appConfig: IRadioAppConfig;
  }>();

  constructor() {
    super();
  }

  async init(): Promise<void> {
    const diFmConfig = await this._loadNetworkStartConfig(DI_FM_HOST);
    const diFmAppId = diFmConfig.appConfig.networks.find(n => n.key === diFmConfig.appConfig.network_key)?.id || 1;
    this._networkConfigMap.set(diFmAppId, diFmConfig);

    for (const network of diFmConfig.appConfig.networks) {
      if (!network.active || network.id === diFmAppId || BANNED_NETWORK_KEYS.includes(network.key)) {
        continue;
      }

      const config = await this._loadNetworkStartConfig(network.url);
      this._networkConfigMap.set(network.id, config);
    }
  }

  getActiveNetworks(): { networkId: number, csrfToken: string; appConfig: IRadioAppConfig }[] {
    const networks: { networkId: number, csrfToken: string; appConfig: IRadioAppConfig }[] = [];
    const entries = Array.from(this._networkConfigMap.entries());

    for (const [ networkId, config ] of entries) {
      networks.push({
        networkId,
        appConfig: config.appConfig,
        csrfToken: config.csrfToken,
      });
    }

    return networks;
  }


  getNetworkConfig(networkId: number): { appConfig: IRadioAppConfig, csrfToken: string } {
    const config = this._networkConfigMap.get(networkId);

    if (config == null) {
      throw new Error(`Network with ID=${networkId} doesnt exist`);
    }

    return config;
  }

  ping(networkId: number) {
    return this._apiRequest(networkId, '/ping', { root: true });
  }

  listenHistoryChannel(networkId: number, channelId: number, trackId: number) {
    return this._apiRequest(networkId, `/listen_history`, {
      method: 'POST',
      body: JSON.stringify({
        track_id: trackId,
        channel_id: channelId,
      }),
    });
  }

  tuneIn(networkId: number, channelId: number): Promise<IRoutine> {
    const config = this.getNetworkConfig(networkId).appConfig;
    return this._apiRequest(networkId, `/routines/channel/${channelId}?tune_in=true&audio_token=${config.user.audio_token}`);
  }

  channel(networkId: number, channelId: number): Promise<IChannel> {
    return this._apiRequest(networkId, '/channels/' + channelId);
  }

  findChannelId(networkId: number, searchString: string): number | undefined {
    const config = this.getNetworkConfig(networkId).appConfig;
    let channel;

    if (/^\d+$/.test(searchString.trim())) {
      /*
       * If search string is a number, then search by position (not ID!).
       */
      const num = parseInt(searchString, 10);
      if (num > 0) {
        channel = config.channels[num - 1];
      }
    }

    if (!channel) {
      /*
       * Search by full match
       */
      channel = config.channels.find(ch => searchString.toLowerCase() === ch.name.toLowerCase());
    }

    if (!channel) {
      /*
       * Search by partial matching
       */
      channel = config.channels.find(ch => new RegExp(searchString, 'gi').test(ch.name));
    }

    if (!channel) {
      /*
       * split search string by words and count a matches in channel name by each,
       * then select a channel by highest match count (lower ids goes first).
       */

      const words = searchString.toLowerCase()
        .split(' ')
        .filter(word => /^[A-Za-z0-9]+$/gi.test(word));

      channel = config.channels
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

  getChannelList(networkId: number): string[] {
    return this.getNetworkConfig(networkId).appConfig.channels.map(ch => ch.name);
  }

  private _loadNetworkStartConfig(url: string): Promise<{ appConfig: IRadioAppConfig, csrfToken: string }> {
    return this._webRequest(url)
        .then(body => {
          const configParseResult = /di\.app\.start\(({.*})\);/.exec(body);
          const csrfParseResult = /<meta[^>]+name\s*=\s*"csrf-token" content="(.*?)"/.exec(body);

          if (configParseResult == null) {
            throw new Error('Can\'t parse appConfig from page body');
          }

          if (csrfParseResult == null) {
            throw new Error('Can\'t parse CSRF Token from page body');
          }

          const appConfig = Object.freeze(JSON.parse(configParseResult[1]));
          const csrfToken = csrfParseResult[1];

          logger.log(`Initialized network ${appConfig.network_name}: ${appConfig.user.session_key}, ${csrfToken}`);

          const result = { appConfig, csrfToken };
          this.emit('login', result);

          return result;
        })
        .catch(error => {
          logger.log(`Error while initializing network from url ${url}`, error);
          return Promise.reject(error);
        });
  }

  private _webRequest(url: string): Promise<string> {
    const options = {
      headers: this._getHeaders(new URL(url), { json: false }),
    };

    return fetch(url, options)
        .then(response => {
          if (response.ok) {
            return response.text();
          } else {
            logger.log('Error response: ', response.status, response.statusText);
            this.emit('error', response);
            return Promise.reject(response.statusText);
          }
        })
        .catch(reason => {
          logger.log('Request error: ', reason);
          return Promise.reject(reason);
        });
  }

  private _apiRequest(networkId: number, path, options: Partial<RequestOptionsInterface> = {}) {
    options = Object.assign({ api: true, root: false, headers: {} }, options);

    let url = this._getBaseUrl(networkId, options.root || false) + path;
    if (options.queryParams) {
      url += '?' + new URLSearchParams(options.queryParams).toString();
    }

    const urlParser = new URL(url);
    options.headers = Object.assign(this._getHeaders(urlParser, { json: true }), options.headers);
    options.headers['accept'] = options.api ? ACCEPT_HEADER_JSON : ACCEPT_HEADER_HTML;

    logger.log('Request:', options.method || 'GET', url);

    return fetch(url, options)
        .then(response => {
          if (response.ok) {
            return options.api
                ? response
                    .json()
                    .catch(() => Promise.resolve(''))
                : response.text();
          } else {
            logger.log('Error response: ', response.status, response.statusText);
            this.emit('error', response);
            return this.init().then(() => this._apiRequest(path, options));
          }
        })
        .catch(reason => {
          logger.log('Request error: ', reason);
          return Promise.reject(reason);
        });
  }

  private _getBaseUrl(networkId: number, root: boolean) {
    const config = this.getNetworkConfig(networkId).appConfig;
    return root ? config.api.urlRoot : `${config.api.urlRoot}/${config.network_key}`;
  }

  private _getHeaders(url: URL, options: {
    json?: boolean;
    networkId?: number;
  } = {}) {
    options = { json: true, ...options };

    const headers = {
      ...DEFAULT_HEADERS,
      'referer': url.origin,
    };

    if (options.json) {
      headers['accept'] = ACCEPT_HEADER_JSON;
      headers['content-type'] = 'application/json';

      if (options.networkId) {
        const config = this.getNetworkConfig(options.networkId);

        if (config) {
          if (config.csrfToken) {
            headers['x-csrf-token'] = config.csrfToken;
          }

          if (config.appConfig.user.session_key) {
            headers['x-session-key'] = config.appConfig.user.session_key;
          }
        }
      }
    } else {
      headers['accept'] = ACCEPT_HEADER_HTML;
      headers['content-type'] = 'text/html';
    }

    return headers;
  }
}
