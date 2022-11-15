import { AUDIO_ADDICT_FIRST_FETCH_HOST, BANNED_NETWORK_KEYS } from '../constants';
import { Logger } from '../logger/logger';
import { AudioAddictNetwork } from './audio-addict-network';
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

		let startNetwork: AudioAddictNetwork;

		try {
			startNetwork = new AudioAddictNetwork(AUDIO_ADDICT_FIRST_FETCH_HOST);
			await startNetwork.updateCredentials();
		} catch (error) {
			if (error instanceof Error) {
				const msg = `Can not make first-fetch: ${error.message}`;
				logger.log(msg);
				throw new Error(msg);
			}

			throw error;
		}

		this._networksMap.set(startNetwork.getNetworkId(), startNetwork);

		for (const networkConfig of startNetwork.getConfig().networks) {
			if (
				!networkConfig.active
				|| networkConfig.id === startNetwork.getNetworkId()
				|| BANNED_NETWORK_KEYS.includes(networkConfig.key)
			) {
				continue;
			}

			let network: AudioAddictNetwork;

			try {
				network = new AudioAddictNetwork(networkConfig.url);
				await network.updateCredentials();
			} catch (error) {
				if (error instanceof Error) {
					const msg = `Network ${networkConfig.key}#${networkConfig.id} initializing error: ${error.message}`;
					logger.log(msg);
					throw new Error(msg);
				}

				throw error;
			}

			this._networksMap.set(network.getNetworkId(), network);
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
}
