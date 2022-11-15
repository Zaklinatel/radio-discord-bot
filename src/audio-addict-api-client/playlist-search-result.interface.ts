import { ImageInfoDefault } from '../util/types';

export interface IPlaylistSearchResult {
	metadata: {
		facets: {
			label: string;
			field: string;
			name: string;
			count: number;
			active: boolean;
		}[]
	};

	results: {
		id: number;
		name: string;
		slug: string;
		description: string;

		curator: {
			id: number;
			name: string;
			slug: string;
			bio: string;
			images: ImageInfoDefault,
			playlists_count: number;
			play_count: number;
			official: boolean;
		};

		images: {
			tall_banner: string;
			default: string;
			square: string;
			vertical: string;
		};

		tags: {
			name: string;
			id: number;
		}[];

		channel: null,
		following: boolean;
		track_count: number;
		play_count: number;
		follow_count: number;
		length: number;
		duration: string;
		popularity: number;
	}[];
}