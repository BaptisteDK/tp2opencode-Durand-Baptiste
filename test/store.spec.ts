import { describe, it, expect } from "vitest";
import { rooms, findRoom, bookingsForRoom } from "../src/store.js";

// Note : le store sera remplace par la vraie base (INFRA-140) et src/store.ts ne
// doit pas etre modifie. On teste donc les accesseurs en lecture seule, pas des
// doubles : un test sur un double prouve le double, pas le code.

describe("store", () => {
  it("expose le catalogue de salles", () => {
    expect(rooms.length).toBeGreaterThan(0);
  });

  it("retrouve une salle par son identifiant", () => {
    const room = findRoom("salle-a");
    expect(room?.id).toBe("salle-a");
    expect(room?.capacity).toBe(12);
  });

  it("rend undefined pour une salle inconnue", () => {
    expect(findRoom("cave")).toBeUndefined();
  });

  it("retourne les reservations de la salle et rien pour une salle libre", () => {
    expect(bookingsForRoom("salle-a")).toHaveLength(1);
    expect(bookingsForRoom("labo")).toHaveLength(0);
  });
});
