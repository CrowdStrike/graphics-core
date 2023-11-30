import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import EngineInstance from '@ember/engine/instance';

import type Owner from '@ember/owner';

/**
 * Get the app's config from an addon
 *
 * There is *no* need to use this from an app, as you can directly import the config!
 *
 * @param objectWithOwner The object (component, controller, router etc.) that was instantiated through Ember's DI system and thus has an associated owner
 * @returns The app's config
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- for now this is shamefully typed as `any`, as this is how it was historically. Ideally this can be returned as the actual shape of the config in the future...
export function getAppConfig(objectWithOwner: Parameters<typeof getOwner>[0]): any {
  let owner: Owner | undefined;

  // if the object passed is already the owner, we can directly lookup the config
  if (objectWithOwner instanceof EngineInstance) {
    owner = objectWithOwner;
  } else {
    owner = getOwner(objectWithOwner);
  }

  assert(
    "The object you passed does not have an owner! You can only use framework objects that have been instantiated by Ember's dependency injection system!",
    owner,
  );

  const entry = owner.factoryFor('config:environment');

  assert("Cannot find app config under 'config:environment' key", entry);

  return entry.class;
}
