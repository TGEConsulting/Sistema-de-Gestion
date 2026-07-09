import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { DocumentosPage } from "@/pages/documentos/DocumentosPage";
import { ObjetivosPage } from "@/pages/objetivos/ObjetivosPage";
import { RiesgosPage } from "@/pages/riesgos/RiesgosPage";
import { NoConformidadesPage } from "@/pages/noconformidades/NoConformidadesPage";
import { AuditoriasPage } from "@/pages/auditorias/AuditoriasPage";
import { IndicadoresPage } from "@/pages/indicadores/IndicadoresPage";
import { PersonasPage } from "@/pages/personas/PersonasPage";
import { ProveedoresPage } from "@/pages/proveedores/ProveedoresPage";
import { ComunicacionesPage } from "@/pages/comunicaciones/ComunicacionesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/objetivos" element={<ObjetivosPage />} />
          <Route path="/riesgos" element={<RiesgosPage />} />
          <Route path="/no-conformidades" element={<NoConformidadesPage />} />
          <Route path="/auditorias" element={<AuditoriasPage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/comunicaciones" element={<ComunicacionesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
