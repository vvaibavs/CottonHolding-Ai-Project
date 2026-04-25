import { Navigate } from "react-router-dom";

import { useSession } from "@/features/auth/api/useSession";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  const { data: session } = useSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
