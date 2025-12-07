const Storage = {
  get: ({ key, persist }: { key: string; persist?: boolean }) => {
    return persist ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  set: ({
    key,
    value,
    persist,
  }: {
    key: string;
    value: string;
    persist?: boolean;
  }) => {
    if (persist) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  remove: ({ key, persist }: { key: string; persist?: boolean }) => {
    if (persist) {
      localStorage.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
    }
  },
};

export { Storage };
