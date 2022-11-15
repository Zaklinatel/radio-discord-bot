import { RequestInit } from 'node-fetch';

export interface IRequestOptions extends RequestInit {
  api: boolean;
  root: boolean;
  queryParams: Record<string, string>;
}
