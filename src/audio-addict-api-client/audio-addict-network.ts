import fetch, { HeadersInit, RequestInit, Response } from 'node-fetch';
import { API_REQUEST_RETRIES, DEFAULT_HTML_HEADERS, DEFAULT_JSON_HEADERS } from '../constants';
import { IAppConfig } from './app-config.interface';
import { IRoutine } from './routine.interface';
import { IRequestOptions } from './request.options.interface';
import { Logger } from '../logger/logger';
import { IChannel } from './channel.interace';
import { IPlaylistSearchResult } from './playlist-search-result.interface';
import { IPlaylistSearchParameters } from './playlist-search-parameters.interface';
import { ITrack } from './track.interface';
import { fillUrlParametersObject } from '../helpers';
import { IPlaylistProgress } from './playlist-progress.interface';

export class AudioAddictNetwork {
  private _appConfig?: IAppConfig;
  private _csrfToken?: string;
  private _networkId?: number;
  private readonly _logger;

  constructor(public readonly websiteUrl: string) {
    this._logger = new Logger(`Network ${websiteUrl}`);
  }

  async updateCredentials(): Promise<IAppConfig> {
    const body = await this._htmlRequest(this.websiteUrl);

    const configParseResult = /di\.app\.start\(({.*})\);/.exec(body);
    if (configParseResult == null) {
      throw new Error(`Can not find appConfig in response from ${this.websiteUrl}`);
    }

    const csrfParseResult = /<meta[^>]+name\s*=\s*"csrf-token" content="(.*?)"/.exec(body);
    if (csrfParseResult == null) {
      throw new Error(`Can not find CSRF-token in response from ${this.websiteUrl}`);
    }

    this._csrfToken = csrfParseResult[1];

    try {
      this._appConfig = JSON.parse(
        configParseResult[1],
        (k, v) => (v instanceof Object) ? Object.freeze(v) : v
      ) as IAppConfig;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Can not parse appConfig JSON from page ${this.websiteUrl}: ${error.message}`);
      }

      throw error;
    }

    const thisNetwork = this._appConfig.networks.find(n => n.key === this.getConfig().network_key);

    if (!thisNetwork) {
      throw new Error(`AppConfig does not contain info about self network (config structure was changed?)`);
    }

    this._networkId = thisNetwork.id;
    this._logger.log(`Initialized`);

    return this._appConfig;
  }

  getNetworkId(): number {
    if (!this._networkId) {
      throw new Error('Can not get networkId. Maybe network is not initialized?');
    }

    return this._networkId;
  }

  getConfig(): IAppConfig {
    if (!this._appConfig) {
      throw new Error('Can not get appConfig. Maybe network is not initialized?');
    }

    return this._appConfig;
  }

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

  listenHistoryPlaylist(playlistId: number, trackId: number) {
    return this._apiRequest(`/listen_history`, {
      method: 'POST',
      body: JSON.stringify({
        track_id: trackId,
        playlist_id: playlistId,
      }),
    });
  }

  tuneIn(channelId: number): Promise<IRoutine> | undefined {
    const config = this._appConfig;
    if (config) {
      return this._apiRequest(`/routines/channel/${channelId}?tune_in=true&audio_token=${config.user.audio_token}`);
    }
  }

  channel(channelId: number): Promise<IChannel> {
    return this._apiRequest('/channels/' + channelId);
  }

  playlists({ page, perPage, facets }: IPlaylistSearchParameters): Promise<IPlaylistSearchResult> {
    return this._apiRequest(`/search/playlists`, {
      queryParams: {
        page,
        per_page: perPage,
        facets: {
          tag_name: facets,
        },
      },
    });
  }

  playlist(playlistId: number): Promise<ITrack[]> {
    return this._apiRequest(`/playlist_collections/${playlistId}`);
  }

  play(playlistId: number): Promise<IPlaylistProgress> {
    return this._apiRequest(`/playlists/${playlistId}/play`);
  }

  findChannelId(searchString: string): number | undefined {
    let channel;

    if (/^\d+$/.test(searchString.trim())) {
      /*
       * If search string is a number, then search by position (not ID!).
       */
      const num = parseInt(searchString, 10);
      if (num > 0) {
        channel = this.getConfig().channels[num - 1];
      }
    }

    if (!channel) {
      /*
       * Search by full match
       */
      channel = this.getConfig().channels.find(ch => searchString.toLowerCase() === ch.name.toLowerCase());
    }

    if (!channel) {
      /*
       * Search by partial matching
       */
      channel = this.getConfig().channels.find(ch => new RegExp(searchString, 'gi').test(ch.name));
    }

    if (!channel) {
      /*
       * split search string by words and count a matches in channel name by each,
       * then select a channel by highest match count (lower ids goes first).
       */

      const words = searchString.toLowerCase()
        .split(' ')
        .filter(word => /^[A-Za-z0-9]+$/gi.test(word));

      channel = this.getConfig().channels
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
    return this.getConfig().channels.map(ch => ch.name);
  }

  private async _apiRequest<T extends object>(path, options: Partial<IRequestOptions> = {}): Promise<T> {
    const opt = { root: false, retries: API_REQUEST_RETRIES, ...options };

    let url = this._getBaseUrl(opt.root) + path;
    if (opt.queryParams) {
      url += `?${fillUrlParametersObject(opt.queryParams)}`;
    }

    opt.headers = {
      ...DEFAULT_JSON_HEADERS,
      'referer': this.websiteUrl,
      'x-csrf-token': this._csrfToken,
      'x-session-key': this.getConfig().user.session_key,
      ...opt.headers,
    } as HeadersInit;

    return this._request(url, opt).then(r => r.json());
  }

  private async _htmlRequest(url: string): Promise<string> {
    const options = {
      headers: {
        ...DEFAULT_HTML_HEADERS,
        'referer': url,
      },
    };

    return this._request(url, options).then(r => r.text());
  }

  private async _request(url: string, options: RequestInit, retries = API_REQUEST_RETRIES): Promise<Response> {
    const opt: RequestInit = { method: 'GET', ...options };
    let response: Response;

    this._logger.log(`Request: ${opt.method} ${url}`);

    try {
      response = await fetch(url, opt);
    } catch (error) {
      if (error instanceof Error) {
        const msg = `Request error: ${error.message}`;
        this._logger.log(msg);
        throw new Error(msg);
      }

      throw error;
    }

    if (response.ok) {
      return response;
    } else {
      const msg = `Error response ${response.status} ${response.statusText}`;
      this._logger.log(msg);

      if (response.status === 401 && retries > 0) {
        this._logger.log(`Update credentials and retry... Retries: ${retries}`);
        await this.updateCredentials();
        return this._request(url, options, --retries);
      }

      throw new Error(msg);
    }
  }

  private _getBaseUrl(root: boolean) {
    return root ? this.getConfig().api.urlRoot : `${this.getConfig().api.urlRoot}/${this.getConfig().network_key}`;
  }
}
