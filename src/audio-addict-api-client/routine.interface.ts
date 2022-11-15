import { ITrack } from './track.interface';

export interface IRoutine {
  channel_id: number,
  expires_on: string,
  routine_id: number,
  tracks: ITrack[]
}
