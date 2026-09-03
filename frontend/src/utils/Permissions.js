export const PERMISSIONS = {
  employe: {
    posts: { deleteOwn: true, deleteOthers: false },
    users: { deactivate: false, changeRole: false, delete: false },
    groups: { deleteGroup: false }
  },
  manager: {
    posts: { deleteOwn: true, deleteOthers: true },
    users: { deactivate: true, changeRole: false, delete: false },
    groups: { deleteGroup: false }
  },
  admin: {
    posts: { deleteOwn: true, deleteOthers: true },
    users: { deactivate: true, changeRole: true, delete: true },
    groups: { deleteGroup: true }
  }
};

export function can(user, resource, action) {
  if (!user) return false;
  return !!PERMISSIONS[user.role]?.[resource]?.[action];
}

export function canDeleteGroup(user, group) {
  if (!user || !group) return false;
  const isGroupAdmin = group.members?.some(
    m => m.user === user._id && m.role === 'admin'
  );
  const isSystemAdmin = can(user, 'groups', 'deleteGroup');
  return isGroupAdmin || isSystemAdmin;
}