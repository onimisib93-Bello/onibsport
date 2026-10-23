import { z } from "zod";
import { AD_PLACEMENTS } from "@/lib/ads";

const placementIds = AD_PLACEMENTS.map((p) => p.id) as [string, ...string[]];

const imageField = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Upload the banner image");

/** Dates arrive as "YYYY-MM-DD" from the form, or empty for no limit. */
const dateField = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Use a valid date")
  .optional();

export const adInputSchema = z
  .object({
    name: z.string().trim().min(2, "Give the ad a name, e.g. the advertiser").max(120),
    size: z.enum(["leaderboard", "rectangle", "sidebar"]),
    imageUrl: imageField,
    mobileImageUrl: z.union([imageField, z.literal("")]).optional(),
    linkUrl: z
      .string()
      .trim()
      .max(1000)
      .refine((v) => {
        try {
          return ["http:", "https:"].includes(new URL(v).protocol);
        } catch {
          return false;
        }
      }, "Paste the full web address, starting with https://"),
    altText: z.string().trim().max(200).optional().default(""),
    placements: z.array(z.enum(placementIds)).min(1, "Tick at least one place for the ad to show"),
    startsAt: dateField,
    endsAt: dateField,
    active: z.boolean().optional().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.startsAt && v.endsAt && Date.parse(v.endsAt) < Date.parse(v.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "The end date is before the start date" });
    }
    const wrong = v.placements.filter((id) => AD_PLACEMENTS.find((p) => p.id === id)?.size !== v.size);
    if (wrong.length) ctx.addIssue({ code: "custom", path: ["placements"], message: "Some ticked places are a different size from this banner" });
  });

export const adToggleSchema = z.object({ active: z.boolean() });

export type AdInput = z.infer<typeof adInputSchema>;

/** Form dates are whole days: the ad starts at the beginning of its start day and runs to the end of its end day (Lagos time). */
export function adDates(input: Pick<AdInput, "startsAt" | "endsAt">) {
  return {
    startsAt: input.startsAt ? new Date(`${input.startsAt.slice(0, 10)}T00:00:00+01:00`) : null,
    endsAt: input.endsAt ? new Date(`${input.endsAt.slice(0, 10)}T23:59:59+01:00`) : null,
  };
}
