const PERMISSIONS = {
  employe: {
    posts: { deleteOwn: true, deleteOthers: false },
    users: { deactivate: false, changeRole: false, delete: false },
    groups: { deleteGroup: false } // sauf s'il est admin DU groupe (logique séparée)
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

module.exports = PERMISSIONS;