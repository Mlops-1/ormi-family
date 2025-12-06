// Global type declarations

declare global {
  interface Window {
    // Add any global window properties here
    __INITIAL_STATE__?: unknown;
  }
}

// Utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Maybe<T> = T | null | undefined;

// Make all properties optional recursively
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make all properties required recursively
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Extract keys of a certain type
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type {
  DeepPartial,
  DeepRequired,
  KeysOfType,
  Maybe,
  Nullable,
  Optional,
};
