import { useQuery } from "@tanstack/react-query";

type ResponseType = {
  data: Array<{
    id: string;
    urls: {
      raw: string;
      full: string;
      regular: string;
      small: string;
      thumb: string;
    };
    alt_description: string | null;
    user: {
      name: string;
    };
  }>;
};

export const useGetImages = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["images"],
    queryFn: async () => {
      const response = await fetch("/api/design-images");
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      return response.json();
    },
  });

  return query;
};
