import { Navigate } from "react-router-dom";

import { useSession } from "@/features/auth/api/useSession";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  const { data: session } = useSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-card)_0%,_transparent_50%)]" />
      <div className="relative">
        <LoginForm />
      </div>
    </div>
  );
}
