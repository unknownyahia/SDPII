import { updateProfileRoleById } from '../repositories/profileRepository';

export class OrganizationValidationError extends Error {}

export async function markUserAsOrganization(input: {
  adminRole: string | null | undefined;
  targetUserId: string;
}) {
  if (input.adminRole !== 'admin') {
    throw new OrganizationValidationError('Admin access is required.');
  }

  const targetUserId = input.targetUserId.trim();
  if (!targetUserId) {
    throw new OrganizationValidationError('Target user id is required.');
  }

  await updateProfileRoleById(targetUserId, 'organization');
}
