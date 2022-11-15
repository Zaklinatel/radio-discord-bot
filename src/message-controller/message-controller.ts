import { Message, EmbedBuilder } from 'discord.js';
import { ITrack } from '../audio-addict-api-client';
import { IChannel } from '../audio-addict-api-client';
import { Logger } from '../logger/logger';
import { COLOR_INFO, COLOR_SUCCESS, COLOR_WARNING } from '../constants';
import { httpsURL } from '../helpers';
import { IProgressData } from './progress-data.inteface';
import { IStatusLabel } from './status-label.interface';

const logger = new Logger('MessageController');

const STATUS_PLAYING: IStatusLabel = { emoji: '▶', label: 'Playing', color: COLOR_SUCCESS };
const STATUS_PAUSED: IStatusLabel = { emoji: '⏸', label: 'Paused', color: COLOR_WARNING };
const STATUS_READY: IStatusLabel = { emoji: '💃', label: 'Ready', color: COLOR_INFO };

export class MessageController {
  static readonly defaultCover = 'https://lh3.googleusercontent.com/proxy/AkWx4hPKf6inyiVNW-ZbiEZpsv0MfmpOUl63-JyMN7xOI4tKwIck6TMX6MxKT55P3zSF2qWNy82WB4b6y22_MrGK9doZ8S85_w19tEmXH6MYp2-SaQE';
  static readonly defaultChannelCover = 'https://c7.hotpng.com/preview/955/252/1006/apple-music-itunes-streaming-media-music.jpg';
  static readonly defaultTitle = 'DI.scord Music Player';

  connected = false;
  playing = false;

  private _trackLength = 0;
  private _progress: IProgressData = {
    current: 0,
    total: 0,
  };
  private _channelName?: string;
  private _playlistName?: string;
  private _artist?: string;
  private _title?: string;
  private _cover?: string;
  private _channelCover?: string;

  constructor(private _message: Message) { }

  getMessage(): Message {
    return this._message;
  }

  setTrack(track: ITrack) {
    this._artist = track.display_artist;
    this._title = track.display_title;
    this._cover = track.asset_url ? httpsURL(track.asset_url) : MessageController.defaultCover;
    this._trackLength = track.content.length;
  }

  setChannel(channel: IChannel) {
    this._channelName = channel.name;
    this._channelCover = channel.asset_url ? httpsURL(channel.asset_url) : MessageController.defaultChannelCover;
  }

  sync() {
    return this._message.edit({ embeds: [this._generateEmbed()] })
      .catch(reason => {
        logger.log('Syncing error: ', reason, this);
        return Promise.reject(reason);
      });
  }

  private _getStatus(): IStatusLabel {
    if (this.playing) return STATUS_PLAYING;
    if (this.connected) return STATUS_PAUSED;
    return STATUS_READY;
  }

  private _getTrackString() {
    return this._title + ` \`${(this._trackLength / 60 | 0).toString().padStart(2, '0')}:${(this._trackLength % 60 | 0).toString().padStart(2, '0')}\``;
  }

  private _generateEmbed() {
    const status = this._getStatus();
    const title = this._title ? this._getTrackString() : MessageController.defaultTitle;

    const embed = new EmbedBuilder()
      .setColor(status.color)
      .setTitle(title)
      .addFields([
        { name: '\u200B', value: status.emoji, inline: true },
      ]);

    if (this._channelName) {
      embed.addFields([
        { name: '\u200B', value: 'channel', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
      ]);
    } else if (this._playlistName) {
      embed.addFields([
        { name: '\u200B', value: 'playlist', inline: true },
        { name: '\u200B', value: 'progress', inline: true },
      ]);
    }

    embed.addFields([{ name: status.label, value: '\u200B', inline: true }]);

    if (this._channelName) {
      embed.addFields([
        { name: this._channelName, value: '\u200B', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
      ]);
    } else if (this._playlistName) {
      embed.addFields([
        { name: this._playlistName, value: '\u200B', inline: true },
        { name: `\`${this._progress[0] / this._progress[1]}\``, value: '\u200B', inline: true },
      ]);
    }

    if (this._title) {
      embed.setImage(this._cover || MessageController.defaultCover);
    }

    if (this._artist) {
      embed.setAuthor({ name: this._artist });
    }

    if (this._channelCover) {
      embed.setThumbnail(this._channelCover);
    }

    return embed;
  }
}
