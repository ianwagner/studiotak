export type MediaRecord = {
  id: string;
  name: string;
  url: string;
  industry: string[];
  type: string;
  alt?: string;
  mediaType?: "image" | "video";
  uploadedAt: string;
  featured?: boolean;
};
