import { useMutation, useQueryClient } from "@tanstack/react-query";

type RequestType = {
  name?: string;
  json?: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
};

export const useUpdateProject = (id: number) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["project", { id }],
    mutationFn: async (values: RequestType) => {
      const response = await fetch(`/api/design-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error("Failed to update project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", { id: String(id) }] });
    },
  });

  return mutation;
};
