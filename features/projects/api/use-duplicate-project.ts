import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDuplicateProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const getResponse = await fetch(`/api/design-projects/${id}`);
      if (!getResponse.ok) throw new Error("Failed to fetch project");
      const { data: project } = await getResponse.json();

      const createResponse = await fetch("/api/design-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${project.name} (copy)`,
          json: project.json,
          width: project.width,
          height: project.height,
        }),
      });
      if (!createResponse.ok) throw new Error("Failed to duplicate project");
      return createResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return mutation;
};
