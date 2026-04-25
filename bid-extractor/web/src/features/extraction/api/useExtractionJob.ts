import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export function useExtractionJob(jobId: string | null) {
  return useQuery({
    queryKey: ["extractions", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extractions")
        .select("*")
        .eq("id", jobId!)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "complete" || s === "failed" ? false : 2500;
    },
    refetchIntervalInBackground: false,
  });
}
