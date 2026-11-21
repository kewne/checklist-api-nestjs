import { NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import { ResourceTypes } from '@app/resource-enrichers';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { ChecklistInstanceDocument } from './instance.repository';
import { MyChecklistInstanceController } from './my-checklist-instance.controller';

export class InstanceResource {
  static toResource(
    instance: ChecklistInstanceDocument,
    linkFactory: NestLinkFactory<ResourceTypes>,
  ) {
    const resource = linkFactory.buildResource('checklist-instance');

    resource.withRel(
      'update',
      toHandlerCall({
        controller: ChecklistInstanceController,
        name: 'add-item',
      }).addItem({
        params: { instanceId: instance.id },
      }),
    );

    resource.withRel(
      'create-from',
      toHandlerCall({
        controller: MyChecklistInstanceController,
        name: 'checklist',
      }).createChecklistFromInstance({
        params: { instanceId: instance.id },
      }),
    );

    const incompleteItems = instance.items.filter((item) => !item.completed);
    if (incompleteItems.length > 0) {
      resource.withRel(
        'complete-item',
        ...incompleteItems.map((item) =>
          toHandlerCall({
            controller: ChecklistInstanceController,
            name: item.id,
            title: item.title,
          }).completeItem({
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
          toHandlerCall({
            controller: ChecklistInstanceController,
            name: item.id,
            title: item.title,
          }).markItemIncomplete({
            params: { instanceId: instance.id, itemId: item.id },
          }),
        ),
      );

      resource.withRel(
        'update',
        toHandlerCall({
          controller: ChecklistInstanceController,
          name: 'clear-completed-items',
        }).clearCompletedItems({
          params: { instanceId: instance.id },
        }),
      );
    }

    const nestedItems = instance.items.map((item) => {
      const itemResource = linkFactory.buildNestedResource();
      if (item.completed) {
        itemResource.withRel(
          'mark-incomplete-item',
          toHandlerCall({
            controller: ChecklistInstanceController,
          }).markItemIncomplete({
            params: { instanceId: instance.id, itemId: item.id },
          }),
        );
      } else {
        itemResource.withRel(
          'complete-item',
          toHandlerCall({
            controller: ChecklistInstanceController,
          }).completeItem({
            params: { instanceId: instance.id, itemId: item.id },
          }),
        );
      }
      itemResource.withRel(
        'update',
        toHandlerCall({
          controller: ChecklistInstanceController,
          name: 'note',
        }).setItemNote({
          params: { instanceId: instance.id, itemId: item.id },
        }),
      );
      return itemResource.toResource(item);
    });

    resource.withNested('items', ...nestedItems);

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
