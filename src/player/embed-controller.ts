import { Message, MessageEmbed } from 'discord.js';
import { ITrack } from "../di-fm-client/track.interface";
import { IChannel } from "../di-fm-client/channel.interace";
import { Logger } from "../logger/logger";

const logger = new Logger('EmbedController');

export class EmbedController {
  static readonly defaultCover = 'https://lh3.googleusercontent.com/proxy/AkWx4hPKf6inyiVNW-ZbiEZpsv0MfmpOUl63-JyMN7xOI4tKwIck6TMX6MxKT55P3zSF2qWNy82WB4b6y22_MrGK9doZ8S85_w19tEmXH6MYp2-SaQE';
  static readonly defaultChannelCover = 'https://c7.hotpng.com/preview/955/252/1006/apple-music-itunes-streaming-media-music.jpg';
  static readonly defaultTitle = 'SabanTONE Music Player';
  static readonly onlineImage = 'https://www.iconfinder.com/data/icons/flat-actions-icons-9/792/Tick_Mark_Dark-512.png';
  static readonly offlineImage = 'https://www.metiista.com/wp-content/themes/metiista/img/icons/png/cross-large-0.png';

  channelName: string;
  playlistName: string;
  artist: string;
  title: string;
  trackLength: number;
  cover: string;
  channelCover: string;
  progress: [number, number];
  online: boolean = false;
  connected: boolean = false;
  playing: boolean = false;

  constructor(private _message: Message) { }

  getMessage(): Message {
    return this._message;
  }

  loadTrack(track: ITrack) {
    this.artist = track.display_artist;
    this.title = track.display_title;
    this.cover = track.asset_url ? 'https:' + track.asset_url : EmbedController.defaultCover;
    this.trackLength = track.content.length;
  }

  loadChannel(channel: IChannel) {
    this.channelName = channel.name;
    this.channelCover = channel.asset_url ? 'https:' + channel.asset_url : EmbedController.defaultChannelCover;
  }

  sync() {
    return this._message.edit({ embed: this._generateEmbed() })
        .catch(reason => {
          logger.log('Syncing error: ', reason, this);
          return Promise.reject(reason);
        })
  }

  private _getMessageEmbed() {
    return this._message.embeds[0];
  }

  private _getColor() {
    if (!this.online) return '#e91e28';
    if (this.playing) return '#52e44d';
    if (this.connected) return '#e0cc3b';
    return '#59b2e0';
  }

  private _getStatus() {
    if (!this.online) return ['💀', 'OFFLINE'];
    if (this.playing) return ['▶', 'Playing'];
    if (this.connected) return ['⏸', 'Paused'];
    return ['💃', 'Ready'];
  }

  private _getTrackString() {
    return this.title + ` \`${(this.trackLength / 60 | 0).toString().padStart(2, '0')}:${(this.trackLength % 60 | 0).toString().padStart(2, '0')}\``
  }

  private _generateEmbed() {
    const status = this._getStatus();
    const title = this.title ? this._getTrackString() : EmbedController.defaultTitle;

    const embed = new MessageEmbed()
        .setColor(this._getColor())
        .setTitle(title)
        .addField('\u200B', status[0], true)
        .setFooter(
            this.online ? 'source online' : 'source offline',
            this.online ? EmbedController.onlineImage : EmbedController.offlineImage
        );

    if (this.channelName) {
      embed.addField('\u200B', 'channel', true);
      embed.addField('\u200B', '\u200B', true);
    } else if (this.playlistName) {
      embed.addField('\u200B', 'playlist', true);
      embed.addField('\u200B', 'progress', true);
    }

    embed.addField(status[1], '\u200B', true);

    if (this.channelName) {
      embed.addField(this.channelName, '\u200B', true);
      embed.addField('\u200B', '\u200B', true);
    } else if (this.playlistName) {
      embed.addField(this.playlistName, '\u200B', true);
      embed.addField(`\`${this.progress[0]/this.progress[1]}\``, '\u200B', true);
    }

    if (this.title) {
      embed.setImage(this.cover || EmbedController.defaultCover);
    }

    if (this.artist) {
      embed.setAuthor(this.artist);
    }

    if (this.channelCover) {
      embed.setThumbnail(this.channelCover);
    }

    return embed;
  }
}
