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
import { DiFmClient } from './di-fm-client/di-fm-client';
import { Logger } from './logger/logger';
import { DISCORD_CHANNEL_NAME } from "./constants";
import { EmbedController } from "./player/embed-controller";
import { Player } from "./player/player";

config();

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
  discordLogger.log('Guild / bot channel / embed:');

  for (const guild of discord.guilds.cache.array()) {
    await initGuild(guild);
  }
}

async function onMessage(message: Message) {
  if (!message.guild) {
    return;
  }

  const player = guildPlayers.get(message.guild.id) || await initGuild(message.guild);

  if (message.channel.id === player.getEmbedController().getMessage().channel.id) {
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
            sendNotice(message.channel as TextChannel, `Can not find a channel related to "${search}" :C`);
          }
        }

        if (!player.connected()) {
          if (message.member.voice.channel) {
            await player.connect(message.member.voice.channel);
          } else {
            sendNotice(message.channel as TextChannel, 'You need to join a voice channel first!');
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
        const list = player.getDiFmClient().getChannelList();
        await message.member.send('Hello! Here is a full list of channels:\n```\n' + list.join('\n') + '```');
        break;

      case 'help':
        const help =
`Command list:
\`play [channel]\` - connect and play / resume. If channel passed, tries to find channel and tune in it. \`list\` to give list of channels.
\`pause\` - pause
\`stop\` - stop playing and disconnect bot
\`list\` - list of channels
\`help\` - this help
`;
        await message.member.send(help);
        break;
    }
  }
}

async function onMessageReactionAdd(messageReaction: MessageReaction, user: User) {
  const message = messageReaction.message;
  const player = guildPlayers.get(message.guild.id);

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
  const ch = guild.channels.cache.find(c => c.name === DISCORD_CHANNEL_NAME && c.type === 'text' && c.manageable);
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

  return guild.channels.create(DISCORD_CHANNEL_NAME, {
    type: 'text',
    topic: 'SabaTONE Bot channel'
  });
}

async function createEmbedMessage(channel: TextChannel): Promise<Message> {
  discordLogger.log(`Create embed message in ${channel.guild.name}/${channel.name}`);

  const content = '\u200B\n**Controls:**\n⏯ Play / Pause\n🎲 Random channel!\n\u200B';
  const message = await channel.send({ embed: new MessageEmbed(), content });
  message.react('⏯');
  message.react('🎲');

  return message;
}

function sendNotice(channel: TextChannel, text, timeout = 5000) {
  return channel
      .send({ embed: { color: '#59b2e0', description: text } })
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
