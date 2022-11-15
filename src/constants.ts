import { HexColorString } from 'discord.js';

export const AUDIO_ADDICT_FIRST_FETCH_HOST = 'https://di.fm';

export const DEFAULT_HEADERS = {
  'accept-language': 'en-US,en;q=0.9,ru;q=0.8,sk;q=0.7,de;q=0.6',
  'accept-encoding': 'gzip, deflate, br',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'pragma': 'no-cache',
  'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

export const DEFAULT_HTML_HEADERS = {
  ...DEFAULT_HEADERS,
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'cache-control': 'max-age=0',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

export const DEFAULT_JSON_HEADERS = {
  ...DEFAULT_HEADERS,
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'content-type': 'application/json',
  'x-requested-with': 'XMLHttpRequest',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
};

export const ACCEPT_HEADER_HTML = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9';
export const ACCEPT_HEADER_JSON = 'application/json, text/javascript, */*; q=0.01';

export const COLOR_DANGER: HexColorString = '#e91e28';
export const COLOR_SUCCESS: HexColorString = '#52e44d';
export const COLOR_INFO: HexColorString = '#59b2e0';
export const COLOR_WARNING: HexColorString = '#e0cc3b';

export const BANNED_NETWORK_KEYS = ['radiotunes'];

export const HELP_TEXT = `There is how you can control me 😉
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