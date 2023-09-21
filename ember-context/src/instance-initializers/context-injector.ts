import type ApplicationInstance from '@ember/application/instance';
import { CONTEXT_COMPONENT_INSTANCE_PROPERTY } from '../-private/symbols';
import { ContextProvider } from '../-private/create-context';

export function initialize(applicationInstance: ApplicationInstance) {
  const owner = applicationInstance;

  // Renderer is a private interface
  const renderer = owner.lookup('renderer:-dom') as any;
  // Glimmer doesn't expose the actual DebbugRenderTree class/type
  const debugRenderTree = renderer?.debugRenderTree as any;

  if (debugRenderTree != null) {
    const originalCreate = debugRenderTree.create;
    debugRenderTree.create = function (state: any, _node: any) {
      originalCreate.call(debugRenderTree, state, _node);

      // nodeFor is a private method, not typed
      // the node itself would be of type InternalRenderNode, but that is also
      // not exposed
      const node = this.nodeFor(state);
      const { instance, parent } = node;

      if (instance == null) {
        return;
      }

      // If there is a parent component and it has the contexts object, copy it
      // to the child component
      if (parent?.instance?.[CONTEXT_COMPONENT_INSTANCE_PROPERTY] != null) {
        instance[CONTEXT_COMPONENT_INSTANCE_PROPERTY] = {
          ...parent[CONTEXT_COMPONENT_INSTANCE_PROPERTY],
        };
      }

      if (instance instanceof ContextProvider) {
        if ((instance as any)[CONTEXT_COMPONENT_INSTANCE_PROPERTY] == null) {
          (instance as any)[CONTEXT_COMPONENT_INSTANCE_PROPERTY] = {};
        }

        (instance as any)[CONTEXT_COMPONENT_INSTANCE_PROPERTY][instance.id] =
          instance;
      }
    };
  }
}

export default {
  initialize,
};