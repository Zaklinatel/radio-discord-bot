export interface ITrack {
  "artist": {
    "asset_url": null;
    "id": number;
    "images": {};
    "name": string
  };
  "artists": {
    "id": number;
    "images": {};
    "name": string;
    "slug": string;
    "type": string
  }[];
  "asset_url": string;
  "content": {
    "interactive": boolean;
    "length": number;
    "offset": number;
    "assets": {
      "content_format_id": number;
      "content_quality_id": number;
      "size": number;
      "url": string
    }[]
  };
  "content_accessibility": number;
  "details_url": string;
  "display_artist": string;
  "display_title": string;
  "id": number;
  "images": {
    "default": string
  };
  "is_show_asset": boolean;
  "isrc": string;
  "length": number;
  "mix": boolean;
  "parental_advisory": boolean;
  "preview": null;
  "preview_accessibility": number;
  "release": null;
  "release_date": null;
  "retail": {};
  "retail_accessibility": number;
  "title": string;
  "track": string;
  "track_container_id": number;
  "version": string;
  "votes": {
    "up": number;
    "down": number;
    "who_upvoted": {
      "size": number;
      "hashes": number;
      "seed": number;
      "bits": number[];
      "items": null
    };
    "who_downvoted": {
      "size": number;
      "hashes": number;
      "seed": number;
      "bits": number[];
      "items": null
    }
  };
  "waveform_url": string
}
