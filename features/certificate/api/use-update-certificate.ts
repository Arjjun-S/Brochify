import { useMutation, useQueryClient } from "@tanstack/react-query";

type RequestType = {
  content: unknown;
};

type ResponseType = {
  certificate: { id: number };
};

export const useUpdateCertificate = (id: number) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationKey: ["certificate", { id }],
    mutationFn: async (values) => {
      const response = await fetch(`/api/certificate/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update certificate");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate", { id }] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });

  return mutation;
};
