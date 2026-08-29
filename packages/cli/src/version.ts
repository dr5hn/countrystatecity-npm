import { createRequire } from 'node:module';

const manifest = createRequire(import.meta.url)('../package.json') as {
  name: string;
  version: string;
};

export const CLI_VERSION = manifest.version;
export const CLI_USER_AGENT = `${manifest.name}/${manifest.version}`;
