declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    transports?: string | string[];
    sessionId?: number | (() => string);
    devel?: boolean;
    debug?: boolean;
    protocols_whitelist?: string[];
    rtt?: number;
    timeout?: number;
  }

  class SockJS {
    constructor(url: string, protocols?: string | string[] | null, options?: SockJSOptions);
    
    readyState: number;
    protocol: string;
    extensions: string;
    url: string;
    
    send(data: string): void;
    close(code?: number, reason?: string): void;
    
    onopen: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    dispatchEvent(event: any): boolean;
  }

  export = SockJS;
}
