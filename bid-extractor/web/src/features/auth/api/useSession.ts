import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return query;
}
