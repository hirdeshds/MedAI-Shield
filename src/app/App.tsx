import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./lib/auth";
import { router } from "./routes";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}
