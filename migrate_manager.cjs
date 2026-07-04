const fs = require('fs');

const files = [
  ['Sales.jsx', {
    '../../context/BranchContext': '@/context/BranchContext',
    '../../services/managerService': '../services/managerService',
    '../../context/SystemNameContext': '@/context/SystemNameContext'
  }],
  ['SalesReports.jsx', {
    '../../services/managerService': '../services/managerService'
  }],
  ['UserRegistrations.jsx', {
    '../../services/managerService': '../services/managerService'
  }],
  ['SecondaryRoleAssignment.jsx', {
    '../../services/managerService': '../services/managerService'
  }]
];

files.forEach(([f, replacements]) => {
  let content = fs.readFileSync('src/manager/pages/' + f, 'utf8');
  Object.entries(replacements).forEach(([from, to]) => {
    content = content.split(from).join(to);
  });
  fs.writeFileSync('src/features/manager/pages/' + f, content, 'utf8');
  console.log('Migrated ' + f);
});
