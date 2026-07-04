import React from 'react';
import { Navigate } from 'react-router-dom';
import { getRoleDefaultRoute } from './roleRouting';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  if (allowedRoles.length > 0 && user) {
    const userRole = String(user.role || user.userRole || '').toUpperCase();
    const userRolesAssigned = Array.isArray(user.roles)
      ? user.roles.map((entry) => String(entry).toUpperCase())
      : [userRole];

    let hasSecondaryAccess = false;
    if (user.secondaryRole && user.secondaryRoleExpiresAt) {
      const expiresAt = new Date(user.secondaryRoleExpiresAt);
      if (expiresAt > new Date()) {
        hasSecondaryAccess = allowedRoles.includes(String(user.secondaryRole).toUpperCase());
      }
    }

    const hasImplicitAccess = userRole === 'SUPER_ADMIN' || userRole === 'MANAGER';
    const hasExplicitAccess = allowedRoles.some((allowedRole) =>
      userRolesAssigned.includes(allowedRole)
    );

    if (!hasExplicitAccess && !hasImplicitAccess && !hasSecondaryAccess) {
      return <Navigate to={getRoleDefaultRoute(userRole)} replace />;
    }
  }

  return children;
}
