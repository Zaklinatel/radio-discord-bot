import { ITrack } from './track.interface';

export interface IPlaylistProgress {
	id: number;
	tracks: ITrack[];
	last_tracks: boolean;
	current_progress: {
		played_tracks: number;
		remaining_tracks: number;
		percent_complete: number;
	}
}