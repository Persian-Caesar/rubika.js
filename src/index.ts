import { version } from '../package.json';

export * from './types/index';

export * from './rest/RESTManager';
export * from './rest/errors';

export * from './structures/Base';
export * from './structures/User';
export * from './structures/Chat';
export * from './structures/Message';
export * from './structures/CallbackQuery';
export * from './structures/TypedEmitter';

export * from './managers/BaseManager';
export * from './managers/MessageManager';
export * from './managers/MediaManager';
export * from './managers/PollingManager';
export * from './managers/WebhookManager';

export * from './builders/BaseBuilder';
export * from './builders/InlineKeypadBuilder';
export * from './builders/MetadataBuilder';

export * from './client/RubikaClient';

export * from './util/Collection';

export type { ClientEvents } from './types/events';

export const VERSION = version;