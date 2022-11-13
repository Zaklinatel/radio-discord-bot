export type TimestampISO = string;

export interface ImageInfoDefault {
	[p: string]: string | undefined;
	default?: string;
}

export type UnknownObject = Record<string, unknown>;