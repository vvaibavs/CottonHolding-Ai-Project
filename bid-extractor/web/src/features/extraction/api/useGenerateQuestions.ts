import { useMutation, useQueryClient } from "@tanstack/react-query";

import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

import type { QuestionSet } from "../schemas";

export function useGenerateQuestions(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<QuestionSet> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${env.API_BASE_URL}/api/documents/${jobId}/questions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail ?? "Failed to generate questions");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extractions", jobId] });
    },
  });
}
