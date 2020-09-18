export interface IDiFmAppConfig {
  appVersion: string;
  appDeployTime: string;
  networks: {
    "active": boolean,
    "created_at": string,
    "description": string | null,
    "id": number,
    "key": string,
    "name": string,
    "updated_at": string,
    "url": string,
    "listen_url": string,
    "service_key": string,
    "active_channel_count": number
  }[];
  "channels": {
    "ad_channels": string,
    "ad_dfp_unit_id": string,
    "channel_director": string,
    "created_at": string,
    "description_long": string,
    "description_short": string,
    "id": number,
    "key": string,
    "name": string,
    "network_id": number,
    "premium_id": number | null,
    "public": boolean,
    "tracklist_server_id": number,
    "updated_at": string,
    "asset_id": number,
    "asset_url": string,
    "banner_url": string,
    "description": string,
    "similar_channels": {
      "id": number,
      "similar_channel_id": number
    }[],
    "artists": {
      "id": number,
      "name": string,
      "asset_url": string | null,
      "images": {}
    }[],
    "images": {
      "default": string,
      "horizontal_banner": string,
      "compact": string
    },
    "favorite": boolean
  }[],
  "channel_filters": {
    "display": boolean,
    "id": number,
    "key": string,
    "meta": boolean,
    "name": string,
    "network_id": number,
    "position": number,
    "channels": number[]
  }[],
  "calendar": {
    "enabled": boolean
  },
  "stream_set_configs": {
    "extension": string,
    "format_label": string,
    "format_name": string,
    "id": number,
    "label": string,
    "premium": boolean,
    "public": boolean,
    "quality_name": string,
    "visible": boolean,
    "stream_set": {
      "description": boolean,
      "id": number,
      "key": string,
      "name": string,
      "network_id": number
    },
    "content_format": {
      "extension": string,
      "id": number,
      "key": string,
      "mime_type": string,
      "name": string
    },
    "content_quality": {
      "id": number,
      "key": string,
      "kilo_bitrate": number,
      "name": string
    }
  }[],
  "requestEnv": {
    "ip": string,
    "countryName": string,
    "countryCode": string,
    "date": string
  },
  "currentUserType": string,
  "user": {
    "authenticated": boolean,
    "hasPremium": boolean,
    "trialAvailable": boolean,
    "created_at": string,
    "audio_token": string,
    "session_key": string,
    "hasPassword": boolean,
    "feature_events": {
      "first_time_skip": boolean,
      "first_time_votedown": boolean,
      "first_time_live_show_skip": boolean
    },
    "first_name": string,
    "last_name": string,
    "email": string,
    "id": number,
    "api_key": string,
    "listen_key": string,
    "favorites": {
      "channel_id": number,
      "position": number
    }[],
    "isBillable": boolean,
    "processingPaymentId": number | null
  },
  "api": {
    "featureBranch": null,
    "urlRoot": string,
    "url": string
  },
  "network_key": string,
  "network_name": string,
  "network_description": string,
  "service_key": string,
  "service_name": string,
  "twitterId": string,
  "listen_url": string,
  "registration_wall": null,
  "facebook": {
    "app_id": string,
    "sdk_url": string,
    "version": string,
    "xfbml": boolean,
    "status": boolean,
    "cookie": boolean
  },
  "apps": {
    "android_app_id": string
  },
  "messages": any[],
  "advertising": {
    "web_session_lifetime_minutes": number,
    "midroll_banner_continue_delay": number,
    "gpt_midroll_slot_id": string,
    "interruptible_track_grace_period": number,
    "interruptible_track_length": number,
    "max_ad_frequency": number,
    "ad_repeat_cap": number
  },
  "adblock_wall": {
    "passthru_enabled": symbol,
    "passthru_user_agent_regex": string
  },
  "crowdfunding": {
    "enabled": boolean,
    "url": string,
    "expiry_days": string
  },
  "performance_reporting": string,
  "asset_paths": {
    "fastclick.js": string,
    "blockadblock.js": string,
    "howler.js": string,
    "branch.js": string
  },
  "firebase": {
    "sdk": string,
    "apiKey": string,
    "authDomain": string,
    "databaseURL": string,
    "projectId": string,
    "storageBucket": string,
    "messagingSenderId": string
  },
  "mobile_webview": boolean,
  "playlists": {
    "enabled": boolean
  },
  "tracking": {
    "adroll_adv_id": string,
    "adroll_pix_id": string,
    "google_conversion_id": string,
    "google_analytics_property_id": string,
    "google_analytics": string,
    "adroll_conversion_id": string,
    "facebook_enabled": boolean,
    "facebook_pixel_id": string,
    "adwords_enabled": boolean,
    "adwords_conversion_id": string,
    "adwords_created_account": string,
    "adwords_premium_1_month": string,
    "adwords_premium_1_year": string,
    "adwords_premium_2_year": string,
    "adwords_started_trial": string,
    "adwords_track_purchase": string,
    "bing_enabled": boolean,
    "bing_tracking_id": string,
    "error_reporting_enabled": boolean,
    "adroll_enabled": boolean,
    "ga_ecommerce_enabled": boolean,
    "adwords_remarketing_enabled": boolean,
    "triton_enabled": boolean,
    "triton_id": string,
    "adroll_registration_conversion_id": string,
    "adroll_trial_conversion_id": string,
    "branch_enabled": boolean,
    "branch_key": string,
    "google_tag_manager_enabled": boolean,
    "google_tag_manager_container_id": string
  },
  "google_gtag_config": {
    "anonymize_ip": boolean,
    "send_page_view": boolean,
    "custom_map": {
      "dimension1": string
    },
    "member_type": string,
    "transport": string,
    "allow_display_features": boolean,
    "user_id": number
  },
  "adwords_conversion": {
    "created_account": string,
    "started_trial": string,
    "premium": {
      "1-month": string,
      "1-year": string,
      "2-year": string
    }
  },
  "external_players": {
    "enabled": boolean
  },
  "stripe": {
    "public_key": string,
    "element_theme": {
      "base": {
        "color": string,
        "lineHeight": string,
        "padding": string,
        "fontSize": string,
        "iconColor": string,
        "::placeholder": {
          "color": string
        }
      },
      "invalid": {
        "color": string,
        "iconColor": string
      }
    }
  },
  "modals": {
    "defaultBackgroundImage": string
  },
  "email": {
    "legal": string,
    "abuse": string,
    "support": string,
    "billing": string
  },
  "discord_url": string,
  "instructions": {
    "homepageMosaicFilterBar": {
      "enabled": boolean
    },
    "webplayerFavoriteButton": {
      "enabled": boolean
    }
  },
  "freshchat_key": string
}
