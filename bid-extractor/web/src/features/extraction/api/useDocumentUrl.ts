import { useQuery } from "@tanstack/react-query";

import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

export function useDocumentUrl(jobId: string | null) {
  return useQuery({
    queryKey: ["document-url", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${env.API_BASE_URL}/api/documents/${jobId}/url`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail ?? "Failed to get document URL");
      }
      const { url } = await res.json();
      return url as string;
    },
    staleTime: 50 * 60 * 1000,
    retry: 1,
  });
}
