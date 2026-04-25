import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

interface CreateExtractionParams {
  file: File;
  thinkingBudget: number;
}

export function useCreateExtraction() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ file, thinkingBudget }: CreateExtractionParams) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const form = new FormData();
      form.append("file", file);
      form.append("thinking_budget", String(thinkingBudget));

      const res = await fetch(`${env.API_BASE_URL}/api/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail ?? "Upload failed");
      }

      return res.json() as Promise<{ job_id: string; status: string }>;
    },
    onSuccess: (data) => {
      navigate(`/extraction/${data.job_id}`);
    },
  });
}
