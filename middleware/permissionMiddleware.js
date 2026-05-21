const PERMISSIONS = {
  admin: {
    leads: ['read', 'create', 'update', 'delete', 'export', 'import'],
    callbacks: ['read', 'create', 'update', 'delete'],
    blog: ['read', 'create', 'update', 'delete'],
    analytics: ['read'],
    users: ['read', 'create', 'update', 'delete']
  }
};

const hasPermission = (admin, resource, action) => {
  const role = admin.role || 'admin';
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  return rolePermissions[resource]?.includes(action);
};

const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!hasPermission(req.admin, resource, action)) {
      return res.status(403).json({ 
        success: false, 
        message: `You don't have permission to ${action} ${resource}` 
      });
    }

    next();
  };
};

module.exports = { requirePermission };
