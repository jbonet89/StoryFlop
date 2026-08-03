import { describe, expect, it } from "vitest";
import { getFinalEstimate } from "@/lib/tasks";
import type { PokerTask } from "@/lib/types";

const task = (final_estimate: string | null, status: PokerTask["status"]="completed"): PokerTask => ({ id:"task",room_id:"room",title:"Historia",description:null,task_url:null,sort_order:7,status,final_estimate,finalized_from_round_id:null,final_estimate_updated_at:null,final_estimate_updated_by:null,created_at:"2026-01-01",updated_at:"2026-01-01" });

describe("estimación final", () => {
  it.each(["0","13","21","34","?","☕"])("muestra correctamente %s", value => expect(getFinalEstimate(task(value))?.value).toBe(value));
  it("no confunde el orden con la estimación", () => { const result=getFinalEstimate(task("13")); expect(result?.value).toBe("13"); expect(result?.value).not.toBe("7"); });
  it("no muestra valores internos o tareas pendientes", () => { expect(getFinalEstimate(task("-1"))).toBeNull(); expect(getFinalEstimate(task("13","pending"))).toBeNull(); });
});
