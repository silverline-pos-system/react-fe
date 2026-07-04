import React from 'react';
import { Navigate } from 'react-router-dom';
import { getRoleDefaultRoute } from './roleRouting';

export default function RoleBasedRedirect() {
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  let role = '';

  try {
    const user = JSON.parse(userStr);
    role = String(user.role || user.userRole || '').toUpperCase();
  } catch {
    role = '';
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleDefaultRoute(role)} replace />;
}
