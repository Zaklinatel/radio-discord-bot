import { RequestInit } from 'node-fetch';

export interface RequestOptionsInterface extends RequestInit {
  api: boolean;
  root: boolean;
  queryParams: Record<string, string>;
}
