const fs = require('fs');
const files = [
  "d:/EMS/employee-management-frontend/src/contexts/AuthContext.tsx",
  "d:/EMS/employee-management-frontend/src/utils/api.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useAttendance.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useDepartments.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useEmployees.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useLeaveRequests.ts",
  "d:/EMS/employee-management-frontend/src/hooks/usePayslips.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useRecruitment.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useReports.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useTasks.ts",
  "d:/EMS/employee-management-frontend/src/hooks/useAnnouncements.ts",
  "d:/EMS/employee-management-frontend/src/hooks/index.ts",
  "d:/EMS/employee-management-frontend/src/pages/EmployeesPage.tsx",
  "d:/EMS/employee-management-frontend/src/pages/LeavePage.tsx",
  "d:/EMS/employee-management-frontend/src/pages/ProfilePage.tsx",
  "d:/EMS/employee-management-frontend/src/pages/SettingsPage.tsx",
  "d:/EMS/employee-management-frontend/src/components/employees/EmployeeForm.tsx"
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Remove console.error and console.warn, handling newlines within parenthesis
    content = content.replace(/^[ \t]*console\.(error|warn)\([^;]*\);?[ \t]*\r?\n?/gm, '');
    
    // Fallback for cases where it might not match the beginning of line
    content = content.replace(/console\.(error|warn)\([^;]*\);?/g, '');
    
    fs.writeFileSync(file, content);
  } else {
    console.log("Missing:", file);
  }
}
