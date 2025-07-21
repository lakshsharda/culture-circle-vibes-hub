/// <reference types="vite/client" />

// Fix for duplicate gc variable declaration
declare var gc: (() => void) | undefined;

// Fix for duplicate prepareStackTrace declaration
declare interface ErrorConstructor {
  prepareStackTrace(err: Error, stackTraces: any[]): any;
}
