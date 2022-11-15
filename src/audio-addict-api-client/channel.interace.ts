export interface IChannel {
  ad_channels: string,
  ad_dfp_unit_id: string,
  channel_director: string,
  created_at: string,
  description_long: string,
  description_short: string,
  id: number,
  key: string,
  name: string,
  network_id: number,
  premium_id: null,
  public: boolean,
  tracklist_server_id: number,
  updated_at: string,
  asset_id: number,
  asset_url: string,
  banner_url: string,
  description: string,
  similar_channels: {
    id: number,
    similar_channel_id: number
  }[],
  artists: {
    id: number,
    name: string,
    asset_url: null,
    images: Record<string, unknown>
  }[],
  images: {
    default: string,
    horizontal_banner: string,
    compact: string
  },
  favorite: boolean
}
