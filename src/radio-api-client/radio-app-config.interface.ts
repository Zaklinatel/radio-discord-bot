import { ImageInfoDefault, TimestampISO } from '../util/types';
import { VisibilityOption } from './visibility-option.enum';

export interface IRadioAppConfig {
  appVersion: string;
  appDeployTime: TimestampISO;

  networks: {
    id: number;
    name: string;
    key: string;
    url: string;
    description: string | null;
    created_at: TimestampISO;
    updated_at: TimestampISO;
    active: boolean;
    listen_url: string;
    service_key: string;
    active_channel_count: number;
  }[];

  channels: {
    id: number;
    network_id: number;
    name: string;
    key: string;
    ad_channels: string;
    description_short: string;
    description_long: string;
    tracklist_server_id: number;
    premium_id: number | null;
    created_at: TimestampISO;
    updated_at: TimestampISO;
    channel_director: string;
    ad_dfp_unit_id: string;
    public: boolean;
    asset_id: number;
    asset_url: string;
    banner_url: string;
    description: string;

    similar_channels: {
      id: number;
      similar_channel_id: number;
    }[];

    artists: {
      id: number;
      name: string;
      asset_url: string | null;
      images: ImageInfoDefault
    }[];

    images: {
      tall_banner: string;
      horizontal_banner: string;
      square: string;
      default: string;
      vertical: string;
      compact: string;
    };

    favorite: boolean;
  }[];

  channelFavorites: {
    favoriteText: string;
    unfavoriteText: string;
    addFavoriteText: string;
    removeFavoriteText: string;
    announceFavoriteTpl: string;
    announceUnfavoriteTpl: string;
  };

  channel_filters: {
    id: number;
    network_id: number;
    name: string;
    key: string;
    position: number;
    display: boolean;
    meta: boolean;
    genre: boolean;
    display_description: boolean;
    description_title: string;
    description_text: string;
    created_at: TimestampISO | null;
    updated_at: TimestampISO | null;
    channels: number[];

    images: {
      compact?: string;
      default?: string;
      horizontal_banner?: string;
    }
  }[];

  daily_free_channels: {
    id: number;
    network_id: number;
    name: string;
    key: string;
    position: number;
    display: boolean;
    meta: boolean;
    genre: boolean;
    display_description: boolean;
    description_title: string;
    description_text: string;
    created_at: TimestampISO | null;
    updated_at: TimestampISO | null;
    channels: number[];

    images: {
      compact?: string;
      default?: string;
      horizontal_banner?: string;
    }
  };

  banners: {
    id: number;
    banner_type_id: number;
    name: string;
    description: string;
    label_text: string;
    network_id: number;
    channel_id: number | null;
    url: string;
    position: number;
    active: boolean;
    starts_at: TimestampISO;
    ends_at: TimestampISO;
    created_at: TimestampISO;
    updated_at: TimestampISO;
    visibility_option_keys: VisibilityOption[];

    banner_type: {
      id: number;
      name: string;
      key: string;
    };

    channel_filters: unknown[];

    images: {
      tall_banner: string;
    }
  }[];

  calendar: {
    enabled: boolean;
  };

  stream_set_configs: {
    id: number;
    public: boolean;
    premium: boolean;
    format_name: string;
    quality_name: string;
    label: string;
    format_label: string;
    extension: string;
    visible: boolean;

    stream_set: {
      id: number;
      network_id: number;
      name: string;
      key: string;
      description: string | null
    };

    content_format: {
      id: number;
      key: string;
      name: string;
      extension: string;
      mime_type: string;
    };

    content_quality: {
      id: number;
      key: string;
      name: string;
      kilo_bitrate: number;
    }
  }[];

  requestEnv: {
    ip: string;
    countryName: string;
    countryCode: string;
    date: string;
  };

  currentUserType: string;

  user: {
    authenticated: boolean;
    hasPremium: boolean;
    trialAvailable: boolean;
    created_at: TimestampISO;
    audio_token: string;
    session_key: string;
    hasPassword: boolean;

    feature_events: {
      first_time_skip: boolean;
      first_time_votedown: boolean;
      first_time_live_show_skip: boolean;
    };

    first_name: string;
    last_name: string;
    company_name: string;
    vat_number: string;
    email: string;
    mostlyPremium: boolean;
    free_content_exhausted: boolean;
    id: number;
    api_key: string;
    listen_key: string;

    favorites: {
      channel_id: number;
      position: number;
    }[];

    isBillable: boolean;
    processingPaymentId: number | null
  };

  api: {
    urlRoot: string;
    url: string;
  };

  network_key: string;
  network_name: string;
  network_description: string;
  service_key: string;
  service_name: string;
  twitterId: string;
  listen_url: string;
  registration_wall: unknown | null;

  facebook: {
    app_id: string;
    sdk_url: string;
    version: string;
    xfbml: boolean;
    status: boolean;
    cookie: boolean;
  };

  apps: {
    android_app_id: string;
  };

  messages: string[];

  advertising: {
    web_session_lifetime_minutes: number;
    midroll_banner_continue_delay: number;
    gpt_midroll_slot_id: string;
    interruptible_track_grace_period: number;
    interruptible_track_length: number;
    max_ad_frequency: number;
    ad_repeat_cap: number;
  };

  adblock_wall: {
    passthru_enabled: boolean;
    passthru_user_agent_regex: string;
  };

  crowdfunding: {
    enabled: boolean;
    url: string;
    expiry_days: string;
  };

  performance_reporting: boolean;

  asset_paths: {
    'fastclick.js': string;
    'howler.js': string;
    'branch.js': string;
  };

  firebase: {
    sdk: string;
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
  };

  mobile_webview: boolean;

  playlists: {
    enabled: boolean;
  };

  tracking: {
    adroll_adv_id: string;
    adroll_pix_id: string;
    google_conversion_id: string;
    google_analytics_property_id: string;
    google_analytics: boolean;
    adroll_conversion_id: string;
    facebook_enabled: boolean;
    facebook_pixel_id: string;
    adwords_enabled: boolean;
    adwords_conversion_id: string;
    adwords_created_account: string;
    adwords_premium_1_month: string;
    adwords_premium_1_year: string;
    adwords_premium_2_year: string;
    adwords_started_trial: string;
    adwords_track_purchase: string;
    bing_enabled: boolean;
    bing_tracking_id: string;
    error_reporting_enabled: boolean;
    adroll_enabled: boolean;
    ga_ecommerce_enabled: boolean;
    adwords_remarketing_enabled: boolean;
    triton_enabled: boolean;
    triton_id: string;
    adroll_registration_conversion_id: string;
    adroll_trial_conversion_id: string;
    branch_enabled: boolean;
    branch_key: string;
    google_tag_manager_enabled: boolean;
    google_tag_manager_container_id: string;
  };

  google_gtag_config: {
    anonymize_ip: boolean;
    send_page_view: boolean;

    custom_map: {
      dimension1: string;
    };

    member_type: string;
    transport: string;
    user_id: number;
  };

  adwords_conversion: Record<string, unknown>;

  external_players: {
    enabled: boolean;
  };

  stripe: {
    public_key: string;
    api_version: string;

    element_theme: {
      base: {
        color: string;
        lineHeight: string;
        padding: string;
        fontSize: string;
        iconColor: string;
        '::placeholder':{
          color: string;
        }
      };

      invalid: {
        color: string;
        iconColor: string;
      }
    }
  };

  recaptcha: {
    sitekey: string;
    theme: string;
  };

  clevertap: {
    accountId: string;
  };

  modals: {
    defaultBackgroundImage: string;
  };

  email: {
    legal: string;
    abuse: string;
    support: string;
    billing: string;
  };

  discord_url: string;
  instructions: {
    homepageMosaicFilterBar: {
      enabled: boolean;
    };

    webplayerFavoriteButton: {
      enabled: boolean;
    }
  };

  chrome_extension: {
    enabled: boolean;
    store_url: string;
    is_desktop_chrome: boolean;
  }
}
