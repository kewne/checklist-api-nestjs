import { NestLinkFactory, toHandler, toHandlerCall } from '@app/hateoas-nest';
import { ChecklistInstanceController } from '../checklist-instance.controller';
import { ChecklistController } from '../checklist.controller';
import { ChecklistInstanceDocument } from '../instance.repository';
import { UserChecklistInstanceController } from '../user-checklist-instance.controller';

export class InstanceResource {
  static toResource(
    instance: ChecklistInstanceDocument,
    userId: string,
    linkFactory: NestLinkFactory,
  ) {
    const resource = linkFactory.buildResource();

    if (instance.checklistId) {
      resource.withRel(
        'related',
        toHandlerCall({
          controller: ChecklistController,
          name: 'checklist',
          title: instance.checklistId,
        }).findOne({ params: { id: instance.checklistId } }),
      );
    }

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
