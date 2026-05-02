import { useQuery } from "@tanstack/react-query";

type ResponseType = {
  data: Array<{
    id: number;
    name: string;
    width: number;
    height: number;
    thumbnailUrl: string | null;
    isTemplate: boolean;
    isPro: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export const useGetProjects = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/design-projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
  });

  return query;
};
