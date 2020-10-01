import { config } from 'dotenv';
import {
  Client as DiscordClient,
  TextChannel,
  Guild,
  Message,
  MessageEmbed,
  User,
  MessageReaction
} from 'discord.js';
import { DiFmClient } from './di-fm-client';
import { EmbedController, Player } from "./player";
import { Logger } from './logger/logger';
import { COLOR_DANGER, COLOR_INFO, COLOR_WARNING } from "./constants";
import { NoticeConfig } from "./notice-config.interface";

config();

const CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME || 'di-scord';

const mainLogger = new Logger('Main');
const discordLogger = new Logger('Discord');

const discord: DiscordClient = new DiscordClient();
const guildPlayers = new Map<string, Player>();

async function start() {
  mainLogger.log('Start');

  try {
    await discord.login(process.env.BOT_TOKEN);
  } catch(e) {
    throw new Error('Cant login to discord');
  }

  discordLogger.log('Logged in');

  discord.on('guildCreate', onGuildCreate);
  discord.on('ready', onReady);
  discord.on('message', onMessage);
  discord.on('messageReactionAdd', onMessageReactionAdd);

  setStatus();
}

async function onGuildCreate(guild: Guild) {
  discordLogger.log("Joined a new guild: " + guild.name);

  const channel = await findBotChannel(guild);
  if (channel) {
    await channel.delete();
  }

  await initGuild(guild);
}

async function onReady() {
  discordLogger.log('Ready');
  discordLogger.log('Initializing guilds');

  for (const guild of discord.guilds.cache.array()) {
    await initGuild(guild);
  }
}

async function onMessage(message: Message) {
  if (!message.guild || message.member.id === discord.user.id) {
    return;
  }

  const player = guildPlayers.get(message.guild.id) || await initGuild(message.guild);

  if (message.channel.id === player.getEmbedController().getMessage().channel.id) {
    discordLogger.log(`Message in ${message.guild.name} from ${message.member.displayName}: ${message.content}`);

    const command = message.content.toLowerCase().split(' ');
    message.delete();

    switch (command[0]) {
      case 'play':
        await player.onInit;

        if (command.length > 1) {
          const search = command.slice(1).join(' ');
          const channelId = player.getDiFmClient().findChannelId(search);

          if (channelId) {
            await player.tune(channelId);
          } else {
            sendNotice(message.channel as TextChannel, `Can not find a channel matches with "${search}" :C`, { color: COLOR_INFO });
          }
        }

        if (!player.connected()) {
          if (message.member.voice.channel) {
            await player.connect(message.member.voice.channel);
          } else {
            sendNotice(message.channel as TextChannel, 'You need to join a voice channel first!', { color: COLOR_WARNING });
          }
        }

        await player.play();
        break;

      case 'pause':
        player.pause();
        break;

      case 'stop':
        player.stop();
        break;

      case 'list':
      case 'l':
        const list = player.getDiFmClient().getChannelList().map((ch, n) => `${n+1}. ${ch}`);
        await message.member.send('Hello! Here is a full list of channels:\n```\n' + list.join('\n') + '```');
        break;

      case 'help':
      case '?':
        const help =
`There is how you can control me 😉
\`reactions\` means you can execute this command by adding a reaction to bot message
\`[DM]\` means bot will reply you in direct messages

**play [channel], p [channel]**, ⏯
Connect and play or resume playing selected channel.
If \`channel\` passed, tries to find channel and tune in it. \`Channel\` may be case insensitive full name, part of name or number of channel.
Send \`list\` to give list of channels.
*Examples: \`play LoFi Lounge & Chillout\`, \`play 27\`, \`play lofi\`*

**pause**, ⏯
Pause ¯\\_(ツ)_/¯

**stop**
Stop playing and disconnect bot from channel

**list, l**  \`[DM]\`
Full list of channels

**help, ?**  \`[DM]\`
This help
`;
        await message.member.send(help);
        break;

      default:
        sendNotice(message.channel as TextChannel, 'Unknown command! Type `help` or `?` to see list of commands', { color: COLOR_DANGER, timeout: 10000 });
    }
  }
}

async function onMessageReactionAdd(messageReaction: MessageReaction, user: User) {
  const message = messageReaction.message;
  const player = guildPlayers.get(message.guild.id);

  if (user.id === discord.user.id) {
    return;
  }

  if (player.getEmbedController().getMessage().id === message.id) {
    if (messageReaction.emoji.name === '⏯') {
      if (player.playing()) {
        player.pause();
      } else {
        if (!player.connected()) {
          const channel = message.guild.member(user.id).voice.channel;

          if (channel) {
            await player.connect(channel);
          } else {
            sendNotice(message.channel as TextChannel, 'You need to join a voice channel first!');
          }
        }

        player.play();
      }
    }

    messageReaction.users.remove(user.id);
  }
}

async function findBotChannel(guild: Guild): Promise<TextChannel> {
  const ch = guild.channels.cache.find(c => c.name === CHANNEL_NAME && c.type === 'text' && c.manageable);
  if (ch) {
    return ch as TextChannel;
  } else {
    return null;
  }
}

async function findChannelEmbedMessage(channel: TextChannel): Promise<Message> {
  const messages = await channel.messages.fetch();
  return messages
      .filter(m => m.author.id === discord.user.id && m.embeds.length === 1)
      .first();
}

async function initGuild(guild: Guild): Promise<Player> {
  discordLogger.log(`Init guild ${guild.name}#${guild.id}`);

  let channel = await findBotChannel(guild);
  let message: Message;

  if (!channel) {
    channel = await createBotChannel(guild);
    message = await createEmbedMessage(channel);
  } else {
    message = await findChannelEmbedMessage(channel);

    if (!message) {
      message = await createEmbedMessage(channel);
    }
  }

  const embedController = new EmbedController(message);
  const difm = new DiFmClient();
  const player = new Player(embedController, difm);

  guildPlayers.set(guild.id, player);

  return player;
}

function createBotChannel(guild: Guild): Promise<TextChannel> {
  discordLogger.log(`Create bot channel in ${guild.name}#${guild.id}`);

  return guild.channels.create(CHANNEL_NAME, {
    type: 'text',
    topic: 'SabaTONE Bot channel'
  });
}

async function createEmbedMessage(channel: TextChannel): Promise<Message> {
  discordLogger.log(`Create embed message in ${channel.guild.name}/${channel.name}`);

  const content = '\u200B\n**Controls:**\n⏯ Play / Pause\n🎲 Random channel!\n\u200B';
  const message = await channel.send({ embed: new MessageEmbed(), content });
  message.react('⏯');
  // message.react('🎲');

  return message;
}

function sendNotice(
    channel: TextChannel,
    text: string,
    { timeout = 5000, color = COLOR_INFO }: Partial<NoticeConfig> = {}
) {
  return channel
      .send({ embed: { color, description: text } })
      .then(msg => {
        setTimeout(() => msg.delete(), timeout);
      });
}

function setStatus() {
  discordLogger.log('Set activity');
  discord.user.setActivity({
    name: "DI.FM",
    type: "LISTENING"
  });
}

start();
