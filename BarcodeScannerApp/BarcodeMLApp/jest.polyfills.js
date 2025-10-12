/**
 * Jest Polyfills
 * Provides browser APIs needed by Expo that aren't available in Jest
 */

// Polyfill TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill stream APIs that Expo's winter runtime tries to access
global.TextDecoderStream = class TextDecoderStream {
  constructor(encoding = 'utf-8', options = {}) {
    this.encoding = encoding;
    this.fatal = options.fatal || false;
    this.ignoreBOM = options.ignoreBOM || false;
    this.readable = new (global.ReadableStream || class ReadableStream {})();
    this.writable = new (global.WritableStream || class WritableStream {})();
  }
};

global.TextEncoderStream = class TextEncoderStream {
  constructor() {
    this.encoding = 'utf-8';
    this.readable = new (global.ReadableStream || class ReadableStream {})();
    this.writable = new (global.WritableStream || class WritableStream {})();
  }
};

// Polyfill ReadableStream if not available
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor(underlyingSource = {}, strategy = {}) {
      this.locked = false;
    }
    
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
        closed: Promise.resolve(),
      };
    }
    
    cancel(reason) {
      return Promise.resolve();
    }
  };
}

// Polyfill WritableStream if not available
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {
    constructor(underlyingSink = {}, strategy = {}) {
      this.locked = false;
    }
    
    getWriter() {
      return {
        write: (chunk) => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: (reason) => Promise.resolve(),
        releaseLock: () => {},
        closed: Promise.resolve(),
        ready: Promise.resolve(),
      };
    }
    
    abort(reason) {
      return Promise.resolve();
    }
  };
}

// Polyfill TransformStream if not available
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor(transformer = {}, writableStrategy = {}, readableStrategy = {}) {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
    }
  };
}

// Polyfill atob/btoa for base64 encoding/decoding
if (typeof global.atob === 'undefined') {
  global.atob = function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
  };
}

if (typeof global.btoa === 'undefined') {
  global.btoa = function btoa(str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

// Polyfill fetch if not available (some test environments need this)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob([]),
      arrayBuffer: async () => new ArrayBuffer(0),
    })
  );
}

// Polyfill FormData if not available
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this._data = new Map();
    }
    
    append(key, value, filename) {
      if (!this._data.has(key)) {
        this._data.set(key, []);
      }
      this._data.get(key).push(value);
    }
    
    delete(key) {
      this._data.delete(key);
    }
    
    get(key) {
      const values = this._data.get(key);
      return values ? values[0] : null;
    }
    
    getAll(key) {
      return this._data.get(key) || [];
    }
    
    has(key) {
      return this._data.has(key);
    }
    
    set(key, value, filename) {
      this._data.set(key, [value]);
    }
    
    forEach(callback, thisArg) {
      for (const [key, values] of this._data) {
        for (const value of values) {
          callback.call(thisArg, value, key, this);
        }
      }
    }
    
    entries() {
      return this._data.entries();
    }
    
    keys() {
      return this._data.keys();
    }
    
    values() {
      const values = [];
      for (const arr of this._data.values()) {
        values.push(...arr);
      }
      return values[Symbol.iterator]();
    }
  };
}

// Polyfill Blob if not available
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.options = options;
      this.size = parts.reduce((size, part) => {
        if (typeof part === 'string') return size + part.length;
        if (part instanceof ArrayBuffer) return size + part.byteLength;
        return size;
      }, 0);
      this.type = options.type || '';
    }
    
    slice(start = 0, end = this.size, contentType = '') {
      return new Blob(this.parts.slice(start, end), { type: contentType });
    }
    
    async text() {
      return this.parts.join('');
    }
    
    async arrayBuffer() {
      return new ArrayBuffer(this.size);
    }
  };
}

// Polyfill File if not available
if (typeof global.File === 'undefined') {
  global.File = class File extends global.Blob {
    constructor(parts, name, options = {}) {
      super(parts, options);
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

// Polyfill Headers if not available
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this.append(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.append(key, value));
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.append(key, value));
        }
      }
    }
    
    append(name, value) {
      const normalizedName = name.toLowerCase();
      if (!this._headers.has(normalizedName)) {
        this._headers.set(normalizedName, []);
      }
      this._headers.get(normalizedName).push(String(value));
    }
    
    delete(name) {
      this._headers.delete(name.toLowerCase());
    }
    
    get(name) {
      const values = this._headers.get(name.toLowerCase());
      return values ? values.join(', ') : null;
    }
    
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
    
    set(name, value) {
      this._headers.set(name.toLowerCase(), [String(value)]);
    }
    
    forEach(callback, thisArg) {
      for (const [name, values] of this._headers) {
        callback.call(thisArg, values.join(', '), name, this);
      }
    }
    
    entries() {
      return Array.from(this._headers.entries()).map(([name, values]) => [name, values.join(', ')]);
    }
    
    keys() {
      return this._headers.keys();
    }
    
    values() {
      return Array.from(this._headers.values()).map(values => values.join(', '));
    }
  };
}

// Suppress specific console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const message = args[0];
  
  // Suppress known React Native warnings that aren't relevant in tests
  if (
    typeof message === 'string' &&
    (message.includes('Animated: `useNativeDriver`') ||
     message.includes('componentWillReceiveProps') ||
     message.includes('componentWillMount'))
  ) {
    return;
  }
  
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args[0];
  
  // Suppress known React Native errors that aren't relevant in tests
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render') ||
     message.includes('Not implemented: HTMLFormElement'))
  ) {
    return;
  }
  
  originalError.apply(console, args);
};

// Export for verification in tests
module.exports = {
  TextEncoder,
  TextDecoder,
  TextDecoderStream: global.TextDecoderStream,
  TextEncoderStream: global.TextEncoderStream,
};