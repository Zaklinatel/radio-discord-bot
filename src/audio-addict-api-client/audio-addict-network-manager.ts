import fetch, { Response } from 'node-fetch';
import { IAppConfig } from './app-config.interface';
import { ACCEPT_HEADER_HTML, AUDIO_ADDICT_FIRST_FETCH_HOST, BANNED_NETWORK_KEYS, DEFAULT_HEADERS } from '../constants';
import { Logger } from '../logger/logger';
import { AudioAddictNetwork } from './audio-addict-network';
import { IAppConfigWithCsrf } from './app-config-with-csrf.interface';

const logger = new Logger('Audio Addict Network Manager');

export class AudioAddictNetworkManager {
	private readonly _networksMap = new Map<number, AudioAddictNetwork>();
	private _initialized = false;

	async init(): Promise<void> {
		if (this._initialized) {
			const e = new Error();
			logger.log(`Trying to double-initialize: \n${e.stack}`);
			return;
		}

		let startAppConfig: IAppConfigWithCsrf;

		try {
			startAppConfig = await this._fetchAppConfigAndCsrf(AUDIO_ADDICT_FIRST_FETCH_HOST);
		} catch (error) {
			if (error instanceof Error) {
				const msg = `Can not make first-fetch: ${error.message}`;
				logger.log(msg);
				throw new Error(msg);
			}

			throw error;
		}

		const startAppId = startAppConfig.appConfig.networks.find(n => n.key === startAppConfig.appConfig.network_key)?.id || 1;
		this._networksMap.set(
			startAppId,
			new AudioAddictNetwork(startAppId, startAppConfig.appConfig, startAppConfig.csrfToken)
		);

		for (const network of startAppConfig.appConfig.networks) {
			if (!network.active || network.id === startAppId || BANNED_NETWORK_KEYS.includes(network.key)) {
				continue;
			}

			let config: IAppConfigWithCsrf;

			try {
				config = await this._fetchAppConfigAndCsrf(network.url);
			} catch (error) {
				if (error instanceof Error) {
					const msg = `Network ${network.key}#${network.id} initializing error: ${error.message}`;
					logger.log(msg);
					throw new Error(msg);
				}

				throw error;
			}

			this._networksMap.set(
				network.id,
				new AudioAddictNetwork(network.id, config.appConfig, config.csrfToken)
			);
		}

		logger.log('Initialized');

		this._initialized = true;
	}

	getActiveNetworks(): AudioAddictNetwork[] {
		return Array.from(this._networksMap.values());
	}

	getNetwork(networkId: number): AudioAddictNetwork | undefined {
		return this._networksMap.get(networkId);
	}

	private async _fetchAppConfigAndCsrf(url: string): Promise<IAppConfigWithCsrf> {
		const body = await this._request(url);

		const configParseResult = /di\.app\.start\(({.*})\);/.exec(body);
		if (configParseResult == null) {
			throw new Error(`Can not find appConfig in response from ${url}`);
		}

		const csrfParseResult = /<meta[^>]+name\s*=\s*"csrf-token" content="(.*?)"/.exec(body);
		if (csrfParseResult == null) {
			throw new Error(`Can not find CSRF-token in response from ${url}`);
		}

		const csrfToken = csrfParseResult[1];
		let appConfig: IAppConfig;

		try {
			appConfig = JSON.parse(
				configParseResult[1],
				(k, v) => (v instanceof Object) ? Object.freeze(v) : v
			) as IAppConfig;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Can not parse appConfig JSON from page ${url}: ${error.message}`);
			}

			throw error;
		}

		return { appConfig, csrfToken };
	}

	private async _request(url: string): Promise<string> {
		const options = {
			headers: {
				...DEFAULT_HEADERS,
				accept: ACCEPT_HEADER_HTML,
				referer: url,
			},
		};

		logger.log(`Request: GET ${url}`);

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
			return response.text();
		} else {
			const msg = `Error response ${response.status} ${response.statusText}`;
			logger.log(msg);
			throw new Error(msg);
		}
	}
}
