import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./screens/LoginScreen";
import {
  AuditScreen,
  AbdmgatewayScreen,
  AthenaScreen,
  CuratedScreen,
  DashboardScreen,
  EtlScreen,
  IamScreen,
  IngestionScreen,
  LifecycleScreen,
  MonitoringScreen,
  PharmacyBedsScreen,
  QualityScreen,
  SystemLogsScreen,
} from "./screens/ComplianceScreens";
import { NotFoundScreen } from "./screens/NotFoundScreen";
import { SnsAlertsScreen } from "./screens/SnsAlertsScreen";
import { RootLayout } from "./layouts/RootLayout";
import { ProtectedRoute, RequireRole } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            path: "/",
            element: <DashboardScreen />,
          },
          {
            path: "/dashboard",
            element: <DashboardScreen />,
          },
          {
            path: "/ingestion",
            element: (
              <RequireRole allowedRoles={["analyst", "admin"]}>
                <IngestionScreen />
              </RequireRole>
            ),
          },
          {
            path: "/etl",
            element: (
              <RequireRole allowedRoles={["analyst", "admin"]}>
                <EtlScreen />
              </RequireRole>
            ),
          },
          {
            path: "/quality",
            element: (
              <RequireRole allowedRoles={["analyst", "admin"]}>
                <QualityScreen />
              </RequireRole>
            ),
          },
          {
            path: "/monitoring",
            element: (
              <RequireRole allowedRoles={["admin"]}>
                <MonitoringScreen />
              </RequireRole>
            ),
          },
          {
            path: "/sns",
            element: (
              <RequireRole allowedRoles={["admin"]}>
                <SnsAlertsScreen />
              </RequireRole>
            ),
          },
          {
            path: "/iam",
            element: (
              <RequireRole allowedRoles={["admin"]}>
                <IamScreen />
              </RequireRole>
            ),
          },
          {
            path: "/audit",
            element: (
              <RequireRole allowedRoles={["doctor", "admin"]}>
                <AuditScreen />
              </RequireRole>
            ),
          },
          {
            path: "/curated",
            element: <CuratedScreen />,
          },
          {
            path: "/lifecycle",
            element: (
              <RequireRole allowedRoles={["admin"]}>
                <LifecycleScreen />
              </RequireRole>
            ),
          },
          {
            path: "/abdm",
            element: (
              <RequireRole allowedRoles={["doctor", "admin"]}>
                <AbdmgatewayScreen />
              </RequireRole>
            ),
          },
          {
            path: "/pharmacy-beds",
            element: (
              <RequireRole allowedRoles={["doctor", "admin"]}>
                <PharmacyBedsScreen />
              </RequireRole>
            ),
          },
          {
            path: "/athena",
            element: (
              <RequireRole allowedRoles={["analyst", "admin"]}>
                <AthenaScreen />
              </RequireRole>
            ),
          },
          {
            path: "/logs",
            element: (
              <RequireRole allowedRoles={["admin"]}>
                <SystemLogsScreen />
              </RequireRole>
            ),
          },
          {
            path: "/upload",
            element: (
              <RequireRole allowedRoles={["analyst", "admin"]}>
                <IngestionScreen />
              </RequireRole>
            ),
          },
          {
            path: "*",
            element: <NotFoundScreen />,
          },
        ],
      },
    ],
  },
]);
