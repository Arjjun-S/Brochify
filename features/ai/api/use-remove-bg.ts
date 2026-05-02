import { useMutation } from "@tanstack/react-query";

export const useRemoveBg = () => {
  const mutation = useMutation({
    mutationFn: async ({ image }: { image: string }) => {
      const response = await fetch("/api/design-ai/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!response.ok) {
        throw new Error("Failed to remove background");
      }
      return response.json();
    },
  });

  return mutation;
};
