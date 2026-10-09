import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

interface AvailabilityBody {
  roomId?: string;
  date?: string;
  freeSlots?: Array<{ startsAt: string; endsAt: string }>;
  error?: string;
}

async function call(path: string): Promise<{ status: number; body: AvailabilityBody }> {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    return { status: res.status, body: (await res.json()) as AvailabilityBody };
  } finally {
    server.close();
  }
}

describe("GET /rooms/:id/availability", () => {
  it("renvoie les creneaux libres autour d'une reservation existante", async () => {
    const res = await call("/rooms/salle-a/availability?date=2026-10-05");
    expect(res.status).toBe(200);
    expect(res.body.roomId).toBe("salle-a");
    expect(res.body.date).toBe("2026-10-05");
    expect(res.body.freeSlots).toEqual([
      { startsAt: "2026-10-05T00:00:00.000Z", endsAt: "2026-10-05T09:00:00.000Z" },
      { startsAt: "2026-10-05T11:00:00.000Z", endsAt: "2026-10-06T00:00:00.000Z" },
    ]);
  });

  it("renvoie la journee entiere pour une salle sans reservation ce jour-la", async () => {
    const res = await call("/rooms/labo/availability?date=2026-10-05");
    expect(res.status).toBe(200);
    expect(res.body.freeSlots).toEqual([
      { startsAt: "2026-10-05T00:00:00.000Z", endsAt: "2026-10-06T00:00:00.000Z" },
    ]);
  });

  it("404 sur salle inconnue", async () => {
    const res = await call("/rooms/cave/availability?date=2026-10-05");
    expect(res.status).toBe(404);
  });

  it("400 si date manquante ou invalide", async () => {
    const missing = await call("/rooms/salle-a/availability");
    expect(missing.status).toBe(400);
    const invalid = await call("/rooms/salle-a/availability?date=pas-une-date");
    expect(invalid.status).toBe(400);
  });
});
