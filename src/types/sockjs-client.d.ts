declare module 'sockjs-client' {
  interface SockJSOptions {
    [key: string]: any;
  }

  class SockJS {
    constructor(url: string, protocols?: string | string[], options?: SockJSOptions);
    close(): void;
    send(data: string): void;
    [key: string]: any;
  }

  export default SockJS;
}

