/**
 * Browser polyfills for Node.js modules
 * Required for packages like @irys/web-upload that use Node.js APIs
 */

import { Buffer } from 'buffer'
import process from 'process'
import { EventEmitter } from 'events'

// Make Buffer globally available
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer
}

// Make process globally available
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process
}
if (typeof window.process === 'undefined') {
  window.process = process
}

// Make EventEmitter available
if (typeof globalThis.EventEmitter === 'undefined') {
  globalThis.EventEmitter = EventEmitter
}

// Polyfill util functions that Vite externalizes
if (typeof globalThis.util === 'undefined') {
  globalThis.util = {
    debuglog: () => () => {},
    inspect: (obj: any) => JSON.stringify(obj),
    deprecate: (fn: Function, msg: string) => fn,
    format: (...args: any[]) => args.join(' '),
    inherits: (ctor: any, superCtor: any) => {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  }
}

// Ensure process.env exists
if (!process.env) {
  process.env = {}
}

// Set browser flag
process.browser = true

export {}
