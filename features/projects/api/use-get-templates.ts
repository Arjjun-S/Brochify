import { useQuery } from "@tanstack/react-query";

export type ResponseType = {
  data: Array<{
    id: number;
    name: string;
    json: string;
    width: number;
    height: number;
    thumbnailUrl: string | null;
    isPro: boolean;
    createdAt: string;
  }>;
};

type Props = {
  page: string;
  limit: string;
};

export const useGetTemplates = ({ page, limit }: Props) => {
  const query = useQuery<ResponseType>({
    queryKey: ["templates", { page, limit }],
    queryFn: async () => {
      const response = await fetch(
        `/api/design-projects/templates?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    },
  });

  return query;
};
