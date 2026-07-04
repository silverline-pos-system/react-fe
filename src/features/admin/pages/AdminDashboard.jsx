import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layout/Layout";
import Dashboard from "./Dashboard";
import Users from "./Users";
import SystemActivityLog from "./SystemActivityLog";
import Branches from "./Branches";
import PasswordRequests from "./PasswordRequests";
import FeatureManagement from "./FeatureManagement";
import SystemSettings from "./SystemSettings";
import BillTemplateDesigner from "./BillTemplateDesigner";

export default function AdminDashboard() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="overview" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="system-activity" element={<SystemActivityLog />} />
        <Route path="branches" element={<Branches />} />
        <Route path="features" element={<FeatureManagement />} />
        <Route path="system-settings" element={<SystemSettings />} />
        <Route path="bill-templates" element={<BillTemplateDesigner />} />
        <Route path="password-requests" element={<PasswordRequests />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Layout>
  );
}
