import { BrowserRouter, Route, Routes } from "react-router-dom";

import ProtectedLayout from "./routes/_protected";
import DashboardPage from "./routes/dashboard";
import ExtractionPage from "./routes/extraction.$id";
import HistoryPage from "./routes/history";
import LoginPage from "./routes/login";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/extraction/:id" element={<ExtractionPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
