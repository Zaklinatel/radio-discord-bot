import { createWriteStream, WriteStream } from 'fs';

export class Logger {
  _writeStream: WriteStream;

  private static readonly _plainTypes = ['string', 'number'];

  private static _getTimeStamp(): string {
    const d = new Date();
    const [day, mon, hrs, min, sec] = [d.getDate(), d.getMonth()+1, d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => Logger._padDateTime(n, 2));
    const year = d.getFullYear();
    const mil = Logger._padDateTime(d.getMilliseconds(), 3);

    return `${day}.${mon}.${year} ${hrs}:${min}:${sec}.${mil}`
  }

  private static _padDateTime(num: number, pad: number): string {
    return num.toString().padStart(pad, '0');
  }

  private static _serialize(object: object): void {
    JSON.stringify(object, null, 2);
  }

  constructor(private _prefix, private _output = null) {
    if (_output) {
      this._writeStream = createWriteStream(_output, { flags: 'w+' });
    }
  }

  log(...data: any): void {
    if (!this._writeStream) {
      console.log(this._getPrefix(), ...data);
      return;
    }

    for (const message of data) {
      let text = this._getPrefix() + ' ';
      if (Logger._plainTypes.includes(typeof message)) {
        text += message;
      } else {
        text += Logger._serialize(message);
      }
    }
  }

  private _getPrefix(): string {
    return `[${Logger._getTimeStamp()}] [${this._prefix}]`;
  }
}
