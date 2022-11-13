import {
  ActivityType,
  ChannelType,
  Client as DiscordClient,
  ClientPresence,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Guild,
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  Snowflake,
  TextChannel,
  User,
  VoiceState,
} from 'discord.js';
import { getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { Logger } from '../logger/logger';
import { MusicPlayer } from '../music-player';
import { COLOR_DANGER, COLOR_INFO, COLOR_WARNING, HELP_TEXT } from '../constants';
import { canInvokeCommand, guildString } from '../helpers';
import { RadioApiClient } from '../radio-api-client';
import { NoticeConfig } from './notice-config.interface';
import { NoticeResult } from './notice-result.interface';
import { IGuildInstance } from './guild-instance.interface';
import { MessageController } from '../message-controller';

const discordLogger = new Logger('Discord Client');

export class DiScord {
  private readonly _discordClient = new DiscordClient({
    intents: [
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });
  private readonly _instances = new Map<Snowflake, IGuildInstance>();

  constructor(private readonly _channelName: string) {}

  async init(token: string): Promise<void> {
    try {
      await this._discordClient.login(token);
    } catch (e) {
      console.error(e);
      throw new Error('Can\'t login to discord');
    }

    discordLogger.log('Logged in');

    await this._setStatus();

    this._discordClient.once(Events.ClientReady, () => this._onReady());
    this._discordClient.on(Events.GuildCreate, guild => this._onGuildCreate(guild));
    this._discordClient.on(Events.MessageCreate, msg => this._onMessage(msg));

    this._discordClient.on(
      Events.MessageReactionAdd,
      (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        return this._onMessageReactionAdd(reaction, user);
      },
    );

    this._discordClient.on(
      Events.VoiceStateUpdate,
      (oldState: VoiceState, newState: VoiceState) => {
        return this._onVoiceStateUpdate(oldState, newState);
      },
    );
  }

  private _onReady() {
    discordLogger.log('Ready');
    discordLogger.log('Initializing guilds');

    this._discordClient.guilds.cache.each(guild => {
      getVoiceConnection(guild.id)?.destroy();
      this._initGuild(guild);
    });
  }

  private async _onGuildCreate(guild: Guild) {
    discordLogger.log('A new guild joined: ' + guild.name);

    const channel = this._findBotChannel(guild);
    if (channel) {
      await channel.delete();
    }

    await this._initGuild(guild);
  }

  private async _onMessage(message: Message) {
    if (!message.guild || message.member?.id === this._discordClient.user?.id) {
      return;
    }

    const instance = this._instances.get(message.guild.id);

    if (!instance) {
      discordLogger.log(`Instance not found for guild ${message.guild.name}#${message.guild.id}`);
      return;
    }

    if (message.channel.id !== instance.musicPlayer.getMessageController().getMessage().channel.id) {
      return;
    }

    discordLogger.log(`Message in ${message.guild.name}#${message.guild.id} from ${message.member?.user.tag}: ${message.content}`);

    const command = message.content.toLowerCase().split(' ');
    message.delete();

    switch (command[0]) {
      case 'play':
        await instance.musicPlayer.onInit;

        if (message.member && !canInvokeCommand(message.member.user, instance.musicPlayer)) {
          this._notice(
              message.channel as TextChannel,
              `You can not control the player while someone listening it!`,
              { color: COLOR_DANGER },
          );
          break;
        }

        if (command.length > 1) {
          const search = command.slice(1).join(' ');
          const networks = instance.musicPlayer.getDiFmClient().getActiveNetworks();
          let foundChannelId: number | undefined;
          let foundNetworkId: number | undefined;

          for (const network of networks) {
            foundChannelId = instance.musicPlayer.getDiFmClient().findChannelId(network.networkId, search);

            if (foundChannelId) {
              if (
                  instance.musicPlayer.isPlaying()
                  && instance.musicPlayer.getChannel()?.id === foundChannelId
                  && instance.musicPlayer.getChannel()?.network_id === network.networkId
              ) {
                this._notice(
                    message.channel as TextChannel,
                    `Already playing this channel! 😎`,
                );
                foundChannelId = undefined;
                break;
              }

              foundNetworkId = network.networkId;
              break;
            }
          }

          if (foundChannelId != null) {
            await instance.musicPlayer.tune(foundNetworkId as number, foundChannelId);
          } else {
            this._notice(
                message.channel as TextChannel,
                `Can't find a channel matches with "${search}"`,
                { color: COLOR_DANGER },
            );
          }
        }

        if (!instance.musicPlayer.isConnected()) {
          if (message.member?.voice.channel) {
            await instance.musicPlayer.connect(message.member.voice.channel);
          } else {
            this._notice(
                message.channel as TextChannel,
                'You need to join a voice channel first!',
                { color: COLOR_WARNING },
            );
          }
        }

        await instance.musicPlayer.play();
        break;

      case 'pause':
        await instance.musicPlayer.onInit;

        if (message.member && !canInvokeCommand(message.member.user, instance.musicPlayer)) {
          this._notice(message.channel as TextChannel, `You can not control the player while someone listening it!`, { color: COLOR_DANGER });
          break;
        }

        instance.musicPlayer.pause();
        break;

      case 'stop':
        await instance.musicPlayer.onInit;

        if (message.member && !canInvokeCommand(message.member.user, instance.musicPlayer)) {
          this._notice(message.channel as TextChannel, `You can not control the player while someone listening it!`, { color: COLOR_DANGER });
          break;
        }

        instance.musicPlayer.stop();
        break;

      case 'list':
      case 'l':
        let rows: string[] = [];
        const networks = instance.musicPlayer.getDiFmClient().getActiveNetworks();

        for (const network of networks) {
          rows = [`\n${network.appConfig.network_name}:\n---------------`];
          const list = instance.musicPlayer.getDiFmClient().getChannelList(network.networkId).map((ch, n) => `${n + 1}. ${ch}`);
          rows.push(...list);
          await message.member?.send(`**${network.appConfig.network_name}:**` + '\n```' + rows.join('\n') + '```');
        }

        break;

      case 'help':
      case '?':
        await message.member?.send(HELP_TEXT);
        break;

      default:
        this._notice(message.channel as TextChannel, 'Unknown command! Type `help` or `?` to see list of commands', { color: COLOR_DANGER, timeout: 10000 });
    }
  }

  private async _onMessageReactionAdd(messageReaction?: MessageReaction | PartialMessageReaction, user?: User | PartialUser) {
    if (!messageReaction || !user) {
      return;
    }

    const message = messageReaction.message;

    if (!message.guild) {
      return;
    }

    const instance = this._instances.get(message.guild.id);

    if (!instance) {
      discordLogger.log(`Instance not found for guild ${guildString(message.guild)}`);
      return;
    }

    if (user.id === this._discordClient.user?.id || instance.messageController.getMessage().id !== message.id) {
      return;
    }

    messageReaction.users.cache.each(u => {
      if (u.id !== this._discordClient.user?.id) {
        messageReaction.users.remove(u);
      }
    });

    await instance.musicPlayer.onInit;

    if (!canInvokeCommand(user, instance.musicPlayer)) {
      this._notice(
          message.channel as TextChannel,
          `You can not control the player while someone listening it!`,
          { color: COLOR_DANGER },
      );
      return;
    }

    if (messageReaction.emoji.name === '⏯') {
      if (instance.musicPlayer.isPlaying()) {
        instance.musicPlayer.pause();
      } else {
        if (!instance.musicPlayer.isConnected()) {
          const _user = await message.guild.members.fetch(user.id);
          const channel = _user.voice.channel;

          if (channel) {
            await instance.musicPlayer.connect(channel);

            instance.musicPlayer.getConnection()?.on(VoiceConnectionStatus.Ready, () => {
              instance.musicPlayer.play();
            });
          } else {
            this._notice(message.channel as TextChannel, 'You need to join a voice channel first!');
          }
        }

        instance.musicPlayer.play();
      }
    }
  }

  private async _onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const instance = this._instances.get(newState.guild.id);

    if (!instance) {
      discordLogger.log(`Instance not found for guild ${guildString(newState.guild)}`);
      return;
    }

    if (!instance.musicPlayer.isConnected()) {
      return;
    }

    const channel = instance.musicPlayer.getConnectedChannel();

    if (oldState.channel && oldState.channel.id === channel?.id && newState.channel?.id !== channel?.id && oldState.channel.members.size < 2) {
      instance.musicPlayer.stop();
      this._notice(
          instance.messageController.getMessage().channel as TextChannel,
          'Last listener leave from channel. Stop playing.',
          { color: COLOR_WARNING, timeout: 10000 },
      );
    }
  }

  private _findBotChannel(guild: Guild): TextChannel | null {
    const ch = guild.channels.cache.find(c => c.name === this._channelName && c.type === ChannelType.GuildText && c.manageable);
    if (ch) {
      return ch as TextChannel;
    } else {
      return null;
    }
  }

  private async _findChannelEmbedMessage(channel: TextChannel): Promise<Message | undefined> {
    const messages = await channel.messages.fetch();
    return messages
        .filter(m => m.author.id === this._discordClient.user?.id && m.embeds.length === 1)
        .first();
  }

  private async _initGuild(guild: Guild): Promise<IGuildInstance> {
    discordLogger.log(`Init guild ${guildString(guild)}`);

    let channel = this._findBotChannel(guild);
    let message: Message | undefined;

    if (!channel) {
      channel = await this._createBotChannel(guild);
      message = await this._createEmbedMessage(channel);
    } else {
      message = await this._findChannelEmbedMessage(channel);
      if (!message) {
        message = await this._createEmbedMessage(channel);
      }
    }

    const embedController = new MessageController(message);
    const difm = new RadioApiClient();
    const musicPlayer = new MusicPlayer(embedController, difm);
    const messageController = new MessageController(message);
    const instance = {
      guild,
      messageController,
      musicPlayer,
    };

    this._instances.set(guild.id, instance);

    return instance;
  }

  private _createBotChannel(guild: Guild): Promise<TextChannel> {
    discordLogger.log(`Create bot channel in ${guild.name}#${guild.id}`);

    return guild.channels.create<ChannelType.GuildText>({
      name: this._channelName,
      type: ChannelType.GuildText,
      topic: 'Sabantuychik Bot Channel',
    });
  }

  private _notice(
      channel: TextChannel,
      text: string,
      {
        timeout = 10000,
        color = COLOR_INFO,
      }: Partial<NoticeConfig> = {},
  ): Promise<NoticeResult> {
    return channel
      .send({ embeds: [{
        color: parseInt(color.slice(1), 16),
        author: { name: text },
        description: '',
        footer: { text: `This message will removed in ${Math.round(timeout / 1000)} s.` },
      }] })
      .then(message => ({
        message,
        deleted: new Promise(res => {
          setTimeout(() => message.delete().then(res), timeout);
        }),
      }));
  }

  private _setStatus(): ClientPresence | undefined {
    discordLogger.log('Set activity');
    return this._discordClient.user?.setActivity(
      'DI.FM',
      {
        type: ActivityType.Listening,
      },
    );
  }

  private async _createEmbedMessage(channel: TextChannel): Promise<Message> {
    discordLogger.log(`Create embed message in ${channel.guild.name}/${channel.name}`);

    const content = '\u200B\n**Controls:**\n⏯ Play / Pause\n🎲 Random channel!\n\u200B';
    const embed = new EmbedBuilder({ description: 'Loading...' });
    const message = await channel.send({ embeds: [embed], content });
    message.react('⏯');
    // message.react('🎲');

    return message;
  }
}