import { useQuery } from "@tanstack/react-query";

export type AssetType = "logo" | "badge" | "certificate_template";

type AssetResponse = {
  data: Array<{
    id: number;
    name: string;
    type: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
  }>;
};

export const useGetAssets = (type: AssetType | null = null) => {
  const query = useQuery<AssetResponse>({
    queryKey: ["assets", type],
    queryFn: async () => {
      const url = type ? `/api/assets?type=${type}` : "/api/assets";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      return response.json();
    },
  });

  return query;
};