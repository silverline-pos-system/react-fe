export function getRoleDefaultRoute(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'MANAGER':
      return '/manager';
    case 'STORE_KEEPER':
      return '/inventory';
    case 'DTV_TECHNICIAN':
      return '/dtv-tech';
    case 'MOBILE_TECHNICIAN':
      return '/mobile-tech';
    case 'CASHIER':
    case 'SUPERVISOR':
    default:
      return '/pos';
  }
}
