"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#161616",
            color: "#f5f5f5",
            border: "1px solid #222",
            borderRadius: "12px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#b4f47a", secondary: "#080808" } },
          error: { iconTheme: { primary: "#f43f5e", secondary: "#080808" } },
        }}
      />
    </QueryClientProvider>
  );
}
