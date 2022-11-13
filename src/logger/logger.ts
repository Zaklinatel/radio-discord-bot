export class Logger {
  private static _getTimeStamp(): string {
    const d = new Date();
    const [day, mon, hrs, min, sec] = [
      d.getDate(),
      d.getMonth() + 1,
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ].map(n => Logger._padDateTime(n, 2));

    const year = d.getFullYear();
    const mil = Logger._padDateTime(d.getMilliseconds(), 3);

    return `${day}.${mon}.${year} ${hrs}:${min}:${sec}.${mil}`;
  }

  private static _padDateTime(num: number, pad: number): string {
    return num.toString().padStart(pad, '0');
  }

  constructor(private readonly _prefix) {
  }

  log(...data: unknown[]): void {
    console.log(this._getPrefix(), ...data);
  }

  private _getPrefix(): string {
    return `[${Logger._getTimeStamp()}] [${this._prefix}]`;
  }
}
