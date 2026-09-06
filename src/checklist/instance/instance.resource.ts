import { NestLinkFactory, toHandler } from '@app/hateoas-nest';
import { ResourceTypes } from '@app/resource-enrichers';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { ChecklistInstanceDocument } from './instance.repository';
import { UserChecklistInstanceController } from './user-checklist-instance.controller';

export class InstanceResource {
  static toResource(
    instance: ChecklistInstanceDocument,
    userId: string,
    linkFactory: NestLinkFactory<ResourceTypes>,
  ) {
    const resource = linkFactory.buildResource('checklist-instance');

    resource.withRel(
      'update',
      toHandler(ChecklistInstanceController, 'addItem', {
        name: 'add-item',
        params: { instanceId: instance.id },
      }),
    );

    resource.withRel(
      'create-from',
      toHandler(
        UserChecklistInstanceController,
        'createChecklistFromInstance',
        {
          name: 'checklist',
          params: { userId, instanceId: instance.id },
        },
      ),
    );

    const incompleteItems = instance.items.filter((item) => !item.completed);
    if (incompleteItems.length > 0) {
      resource.withRel(
        'complete-item',
        ...incompleteItems.map((item) =>
          toHandler(ChecklistInstanceController, 'completeItem', {
            name: item.id,
            title: item.title,
            params: { instanceId: instance.id, itemId: item.id },
          }),
        ),
      );
    }

    const completedItems = instance.items.filter((item) => item.completed);
    if (completedItems.length > 0) {
      resource.withRel(
        'mark-incomplete-item',
        ...completedItems.map((item) =>
          toHandler(ChecklistInstanceController, 'markItemIncomplete', {
            name: item.id,
            title: item.title,
            params: { instanceId: instance.id, itemId: item.id },
          }),
        ),
      );

      resource.withRel(
        'update',
        toHandler(ChecklistInstanceController, 'clearCompletedItems', {
          name: 'clear-completed-items',
          params: { instanceId: instance.id },
        }),
      );
    }

    const transformedInstance = {
      ...instance,
      items: instance.items.map(({ id, ...rest }) => ({
        ...rest,
        name: id,
      })),
    };

    return resource.toResource(transformedInstance);
  }
}
