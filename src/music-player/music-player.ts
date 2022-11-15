import { Readable } from 'node:stream';
import { StageChannel, VoiceChannel } from 'discord.js';
import { IChannel, ITrack, AudioAddictNetwork } from '../audio-addict-api-client';
import { getHttpFileStream } from '../helpers';
import { MessageController } from '../message-controller';
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';

export class MusicPlayer {
  onInit: Promise<this>;

  private _position = 0;
  private _playlist: ITrack[] = [];
  private _channel?: IChannel;
  private _connection?: VoiceConnection;
  private _connectedChannel?: VoiceChannel | StageChannel;
  private _player?: AudioPlayer;

  constructor(
      private readonly _embedController: MessageController,
      private readonly _difmClient: AudioAddictNetwork,
  ) {
    this.onInit = this.tune(492)
      .then(() => this);
  }

  getMessageController(): MessageController {
    return this._embedController;
  }

  getDiFmClient(): AudioAddictNetwork {
    return this._difmClient;
  }

  getChannel(): IChannel | undefined {
    return this._channel;
  }

  getConnection(): VoiceConnection | undefined {
    return this._connection;
  }

  getConnectedChannel(): VoiceChannel | StageChannel | undefined {
    return this._connectedChannel;
  }

  isConnected(): boolean {
    return this._connection != null && this._connection.state.status === VoiceConnectionStatus.Ready;
  }

  isPlaying(): boolean {
    return this.isConnected()
      && this._player != null
      && [
        AudioPlayerStatus.Playing,
        AudioPlayerStatus.Buffering,
      ].includes(this._player.state.status);
  }

  connect(voiceChannel: VoiceChannel | StageChannel): VoiceConnection {
    if (this.isConnected()) {
      this._player?.stop(true);
      this._connection?.destroy();
    }

    this._connectedChannel = voiceChannel;
    this._connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    this._connection.on(VoiceConnectionStatus.Disconnected, () => {
      this._connection?.destroy();

      this._embedController.connected = false;
      this._embedController.playing = false;
      this._embedController.sync();
    });

    this._embedController.connected = true;
    this._embedController.sync();

    return this._connection;
  }

  async tune(channelId: number): Promise<IChannel> {
    this._channel = await this._difmClient.channel(channelId);
    await this.refreshPlaylist();

    if (this.isPlaying()) {
      this._player?.stop(true);
      await this.play();
    }

    const currentTrack = this.getCurrentTrack();

    if (currentTrack) {
      this._embedController.setChannel(this._channel);
      this._embedController.setTrack(currentTrack);
      this._embedController.sync();
    }

    return this._channel;
  }

  async play() {
    if (!this._channel || !this.isConnected()) {
      return false;
    }

    if (!this._player) {
      this._player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Stop,
        },
      });
    }

    if (this._player.state.status === AudioPlayerStatus.Idle) {
      const track = await this.next();

      if (track != null) {
        const file = await getHttpFileStream(track.content.assets[0].url);

        if (file != null) {
          const resource = createAudioResource(new Readable().wrap(file));

          this._player.play(resource);
          this._player.on(AudioPlayerStatus.Idle, () => {
            this.play();
          });

          // this._difmClient.listenHistoryChannel(this._channel.network_id, this._channel.id, track.id);
        }
      }
    }

    if (this._player.state.status === AudioPlayerStatus.Paused) {
      this._player.unpause();
    }

    this._embedController.playing = true;
    this._embedController.sync();

    return true;
  }

  pause() {
    this._player?.pause();
  }

  stop() {
    if (this.isConnected()) {
      this._player?.stop();
      this._connection?.disconnect();
      this._connectedChannel = undefined;
    }
  }

  async next(): Promise<ITrack | undefined> {
    if (!this._channel) {
      return;
    }

    const prevTrack = this.getCurrentTrack();
    this._position++;

    if (this._position >= this._playlist.length) {
      await this.refreshPlaylist();

      if (prevTrack) {
        this.findAndSetTrack(prevTrack.id);
      }
    }

     return this._playlist[this._position];
  }

  getCurrentTrack(): ITrack | null {
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

  async refreshPlaylist(): Promise<ITrack[] | undefined> {
    if (!this._channel) {
      return;
    }

    this._playlist = await this._difmClient.tuneIn(this._channel.id)?.then(routine => routine.tracks) || [];
    this._position = 0;
    return this._playlist;
  }
}
