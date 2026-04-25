import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export function useHistory() {
  return useQuery({
    queryKey: ["extractions", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extractions")
        .select("id, file_name, status, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}
