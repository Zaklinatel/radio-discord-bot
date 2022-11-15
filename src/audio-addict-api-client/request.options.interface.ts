import { RequestInit } from 'node-fetch';

type QueryParam = string | string[] | number | number[] | QueryParameters;
export interface QueryParameters {
  [p: string]: QueryParam
}

export interface IRequestOptions extends RequestInit {
  root: boolean;
  retries: number;
  queryParams: QueryParameters;
}
