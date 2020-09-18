import { EmbedController } from "./embed-controller";
import {
  VoiceChannel,
  VoiceConnection,
  StreamDispatcher,
  Constants
} from 'discord.js';
import { DiFmClient } from "../di-fm-client/di-fm-client";
import { ITrack } from "../di-fm-client/track.interface";
import { IChannel } from "../di-fm-client/channel.interace";
import fetch from 'node-fetch';

export class Player {
  private _playlist: ITrack[];
  private _position;
  private _channel: IChannel;
  private _connection: VoiceConnection;
  private _dispatcher: StreamDispatcher;
  onInit: Promise<this>;

  constructor(
      private _embedController: EmbedController,
      private _difmClient: DiFmClient,
  ) {
    this.onInit = _difmClient.init()
        .then(() => {
          this._embedController.online = true;
          return this.tune(492);
        });
  }

  getEmbedController(): EmbedController {
    return this._embedController;
  }

  getDiFmClient(): DiFmClient {
    return this._difmClient;
  }

  connected() {
    return this._connection && this._connection.status === Constants.VoiceStatus.CONNECTED;
  }

  playing() {
    return this.connected() && this._dispatcher && !this._dispatcher.destroyed && !this._dispatcher.paused;
  }

  async connect(channel: VoiceChannel) {
    if (this.connected()) {
      this._dispatcher.destroy();
      this._connection.disconnect();
    }

    this._connection = (await channel.join())
        .on('disconnect', () => {
          if (this._dispatcher && !this._dispatcher.destroyed) {
            this._dispatcher.destroy();
          }

          this._embedController.connected = false;
          this._embedController.playing = false;
          this._embedController.sync();
        });

    this._embedController.connected = true;
    this._embedController.sync();
  }

  async tune(channelId: number): Promise<IChannel> {
    this._channel = await this._difmClient.channel(channelId);
    await this.refreshPlaylist();

    this._embedController.loadChannel(this._channel);
    this._embedController.loadTrack(this.getCurrentTrack());
    this._embedController.sync();

    if (this.playing()) {
      this._dispatcher.destroy();
      await this.play();
    }

    return this._channel;
  }

  async play() {
    if (!this._channel || !this.connected()) {
      return false;
    }

    if (!this._dispatcher || this._dispatcher.destroyed) {
      const track = await this.next();
      const file = await fetch('https:' + track.content.assets[0].url)
          .then(response => response.body);

      this._dispatcher = await this._connection.play(file as any, {
        volume: 0.5,
        type: 'unknown'
      });

      this._embedController.playing = true;
      this._embedController.sync();

      this._dispatcher.on('finish', () => {
        this._dispatcher.destroy();
        this.play();
      });
    }

    if (this._dispatcher.paused) {
      this._embedController.playing = true;
      this._embedController.sync();
      this._dispatcher.resume();
    }

    return true;
  }

  pause() {
    if (this.playing()) {
      this._dispatcher.pause();

      this._embedController.playing = false;
      this._embedController.sync();
    }
  }

  stop() {
    if (this.connected()) {
      this._connection.disconnect();
    }
  }

  async next(): Promise<ITrack> {
    if (!this._channel) return null;

    const prevTrack = this.getCurrentTrack();
    this._position++;

    if (this._position >= this._playlist.length) {
      await this.refreshPlaylist();

      if (prevTrack) {
        this.findAndSetTrack(prevTrack.id);
      }
    }

    this._embedController.loadTrack(this._playlist[this._position]);
    this._embedController.sync();

    if (this.playing()) {

    }

     return this._playlist[this._position];
  }

  getCurrentTrack() {
    if (!this._playlist || this._playlist.length === 0 || !this._playlist[this._position]) {
      return null;
    }

    return this._playlist[this._position];
  }

  findAndSetTrack(trackId: number): void {
    const i = this._playlist.findIndex(t => t.id === trackId);
    if (i !== -1) {
      this._position = i;
    }
  }

  async refreshPlaylist(): Promise<ITrack[]> {
    if (!this._channel) {
      return null;
    }

    this._playlist = await this._difmClient.tuneIn(this._channel.id).then(routine => routine.tracks);
    this._position = 0;
    return this._playlist;
  }
}
