import { useMutation } from "@tanstack/react-query";

export const useGenerateImage = () => {
  const mutation = useMutation({
    mutationFn: async ({ prompt }: { prompt: string }) => {
      const response = await fetch("/api/design-ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate image");
      }
      return response.json();
    },
  });

  return mutation;
};
