import { Agent } from 'http';

export interface RequestOptionsInterface {
  api: boolean;
  root: boolean;
  queryParams: Record<string, string>

  // These properties are part of the Fetch Standard
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS',
  headers: {[key:string]: string}, // Request headers. format is the identical to that accepted by the Headers constructor (see below)
  body: null | string | Buffer | Blob | ReadableStream, // Request body. can be null, a string, a Buffer, a Blob, or a Node.js Readable stream
  redirect: 'follow' | 'manual' | 'error',     // Set to `manual` to extract redirect headers, `error` to reject redirect
  signal: AbortSignal, // Pass an instance of AbortSignal to optionally abort requests

  // The following properties are node-fetch extensions
  follow: number,             // maximum redirect count. 0 to not follow redirect
  compress: boolean,         // support gzip/deflate content encoding. false to disable
  size: number,                // maximum response body size in bytes. 0 to disable
  agent: Agent, // http(s).Agent instance or function that returns an instance (see below)
  highWaterMark: number,   // the maximum number of bytes to store in the internal buffer before ceasing to read from the underlying resource.
  insecureHTTPParser: boolean
}
