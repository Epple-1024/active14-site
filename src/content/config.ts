import { defineCollection, z } from "astro:content";

const reports = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    summary: z.string(),
    participants: z.string(),
    collected: z.string()
  })
});

export const collections = { reports };
