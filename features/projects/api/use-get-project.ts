import { useQuery } from "@tanstack/react-query";

export type ResponseType = {
  data: {
    id: number;
    name: string;
    json: string;
    width: number;
    height: number;
    thumbnailUrl: string | null;
    isTemplate: boolean;
    isPro: boolean;
    brochureId: number | null;
    reviewStatus: string | null;
    rejectionReason: string | null;
    brochureTemplate: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export const useGetProject = (id: string) => {
  const query = useQuery<ResponseType>({
    enabled: !!id,
    queryKey: ["project", { id }],
    queryFn: async () => {
      const response = await fetch(`/api/design-projects/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
  });

  return query;
};
