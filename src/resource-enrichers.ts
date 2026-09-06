import { EnricherRegistry, toHandlerCall } from './hateoas-nest';
import { ChecklistController } from './checklist/checklist.controller';
import { ChecklistShareController } from './checklist/checklist-share.controller';
import { ChecklistDocument, ItemCompleted } from './checklist/checklist.repository';
import { ChecklistInvitationController } from './checklist/invitation/checklist-invitation.controller';
import { ChecklistInstanceController } from './checklist/instance/checklist-instance.controller';
import { ChecklistListItem } from './checklist/instance/instance.repository';
import { UserChecklistInstanceController } from './checklist/instance/user-checklist-instance.controller';
import { ShareDocument } from './checklist/share.repository';
import { UserChecklistController } from './checklist/user-checklist.controller';

export interface ChecklistSharesResource {
  checklistId: string;
  shares: ShareDocument[];
}

export interface ChecklistInvitationsResource {
  checklistId: string;
  invitations: { id: string; title: string; expiresAt: Date }[];
}

export interface UserChecklistsResource {
  userId: string;
  checklists: ChecklistDocument[];
}

export interface UserChecklistInstancesResource {
  userId: string;
  instances: ChecklistListItem[];
}

export interface SharedChecklistsResource {
  checklists: ChecklistDocument[];
}

export interface ShareResource {
  userId: string;
  title: string;
  createdAt: Date;
}

export interface InvitationResource {
  title: string;
  checklistTitle: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface InvitationPreviewResource {
  checklistTitle: string;
  expiresAt: Date;
}

export interface ChecklistInstanceResourceItem {
  name: string;
  completed: ItemCompleted | null;
  title: string;
  description?: string;
}

export interface ChecklistInstanceResource {
  id: string;
  checklistId: string | null;
  createdBy: string;
  createdAt: Date;
  title: string;
  items: ChecklistInstanceResourceItem[];
}

export interface ResourceTypes {
  checklist: ChecklistDocument;
  'checklist-instance': ChecklistInstanceResource;
  'checklist-shares': ChecklistSharesResource;
  'checklist-invitations': ChecklistInvitationsResource;
  'user-checklists': UserChecklistsResource;
  'user-checklist-instances': UserChecklistInstancesResource;
  'shared-checklists': SharedChecklistsResource;
  share: ShareResource;
  invitation: InvitationResource;
  'invitation-preview': InvitationPreviewResource;
  root: Record<string, never>;
}

export const resourceEnrichers: EnricherRegistry<ResourceTypes> = {
  checklist: [
    (builder, checklist) => {
      builder.withRel(
        'create-from',
        toHandlerCall({
          controller: UserChecklistInstanceController,
          name: 'instance',
        }).createFromChecklist({
          params: { userId: builder.userId ?? '' },
          query: { checklist_id: checklist.id },
        }),
      );
      builder.withRel(
        'related',
        toHandlerCall({
          controller: ChecklistShareController,
          name: 'shares',
        }).list({ params: { checklistId: checklist.id } }),
      );
    },
  ],
  'checklist-instance': [
    (builder, instance) => {
      if (instance.checklistId) {
        builder.withRel(
          'related',
          toHandlerCall({
            controller: ChecklistController,
            name: 'checklist',
            title: instance.checklistId,
          }).findOne({ params: { id: instance.checklistId } }),
        );
      }
    },
  ],
  root: [],
  'checklist-shares': [
    (builder, { checklistId, shares }) => {
      builder.withRel(
        'items',
        ...shares.map((share) =>
          toHandlerCall({
            controller: ChecklistShareController,
            title: share.title,
          }).findOne({ params: { checklistId, shareId: share.id } }),
        ),
      );
      builder.withRel(
        'related',
        toHandlerCall({
          controller: ChecklistInvitationController,
          name: 'invitations',
        }).list({ params: { checklistId } }),
      );
      builder.withRel(
        'up',
        toHandlerCall({
          controller: ChecklistController,
          name: 'checklist',
        }).findOne({ params: { id: checklistId } }),
      );
      builder.withRel(
        'related',
        toHandlerCall({
          controller: ChecklistController,
          name: 'checklist',
        }).findOne({ params: { id: checklistId } }),
      );
    },
  ],
  'checklist-invitations': [
    (builder, { checklistId, invitations }) => {
      builder.withRel(
        'create',
        toHandlerCall({
          controller: ChecklistInvitationController,
        }).create({ params: { checklistId } }),
      );
      builder.withRel(
        'items',
        ...invitations.map((inv) => {
          const isExpired = Date.now() > inv.expiresAt.getTime();
          return toHandlerCall({
            controller: ChecklistInvitationController,
            title: isExpired ? `${inv.title} (expired)` : inv.title,
          }).findOne({ params: { checklistId, id: inv.id } });
        }),
      );
      builder.withRel(
        'up',
        toHandlerCall({
          controller: ChecklistController,
          name: 'checklist',
        }).findOne({ params: { id: checklistId } }),
      );
      builder.withRel(
        'related',
        toHandlerCall({
          controller: ChecklistController,
          name: 'checklist',
        }).findOne({ params: { id: checklistId } }),
      );
    },
  ],
  'user-checklists': [
    (builder, { userId, checklists }) => {
      builder.withRel(
        'items',
        ...checklists.map((checklist) =>
          toHandlerCall({
            controller: ChecklistController,
            name: checklist.title,
          }).findOne({ params: { id: checklist.id } }),
        ),
      );
      builder.withRel(
        'create',
        toHandlerCall({
          controller: UserChecklistController,
        }).create({ params: { userId } }),
      );
      builder.withRel(
        'related',
        toHandlerCall({
          controller: UserChecklistController,
          name: 'shared',
        }).findAllSharedWith({ params: { userId } }),
      );
    },
  ],
  'user-checklist-instances': [
    (builder, { userId, instances }) => {
      builder.withRel(
        'items',
        ...instances.map((instance) =>
          toHandlerCall({
            controller: ChecklistInstanceController,
            name: instance.id,
            title: instance.title,
          }).findOne({ params: { instanceId: instance.id } }),
        ),
      );
      builder.withRel(
        'create',
        toHandlerCall({
          controller: UserChecklistInstanceController,
        }).createInstance({ params: { userId } }),
      );
    },
  ],
  'shared-checklists': [
    (builder, { checklists }) => {
      builder.withRel(
        'items',
        ...checklists.map((checklist) =>
          toHandlerCall({
            controller: ChecklistController,
            name: checklist.title,
          }).findOne({ params: { id: checklist.id } }),
        ),
      );
    },
  ],
};
