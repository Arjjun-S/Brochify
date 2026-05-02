import { useMutation, useQueryClient } from "@tanstack/react-query";

type RequestType = {
  name: string;
  json: string;
  width: number;
  height: number;
};

type ResponseType = {
  data: {
    id: number;
  };
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (values) => {
      const response = await fetch("/api/design-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return mutation;
};
