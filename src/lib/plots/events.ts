import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlotEvent = {
  id: number;
  plotId: string | null;
  eventType: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type GlobalEvents = typeof globalThis & { __craterclaimEvents?: PlotEvent[] };

function memory() {
  const globalRef = globalThis as GlobalEvents;
  if (!globalRef.__craterclaimEvents) globalRef.__craterclaimEvents = [];
  return globalRef.__craterclaimEvents;
}

export async function recordPlotEvent(
  plotId: string | null,
  eventType: string,
  actorId?: string | null,
  metadata?: Record<string, unknown>,
) {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      await admin.from("plot_events").insert({
        plot_id: plotId,
        event_type: eventType,
        actor_id: actorId ?? null,
        metadata: metadata ?? null,
      });
      return;
    }
  }
  memory().unshift({
    id: Date.now(),
    plotId,
    eventType,
    actorId: actorId ?? null,
    metadata: metadata ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function listPlotEvents(limit = 80): Promise<PlotEvent[]> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("plot_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as {
        id: number;
        plot_id: string | null;
        event_type: string;
        actor_id: string | null;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }[]).map((row) => ({
        id: row.id,
        plotId: row.plot_id,
        eventType: row.event_type,
        actorId: row.actor_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    }
  }
  return memory().slice(0, limit);
}
