import type { JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
