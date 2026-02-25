import { z } from "zod";

export const NudgeRecordSchema = z.object({
  slot_name: z.string(),
  nudged_at: z.string(),
  turn: z.number(),
});

export const NudgeStateResponseSchema = z.object({
  session_id: z.string(),
  total_nudges: z.number(),
  nudge_history: z.array(NudgeRecordSchema),
  last_nudged_at_by_slot: z.record(z.string(), z.string()),
  suppressed: z.boolean(),
});

export type NudgeRecord = z.infer<typeof NudgeRecordSchema>;
export type NudgeStateResponse = z.infer<typeof NudgeStateResponseSchema>;
