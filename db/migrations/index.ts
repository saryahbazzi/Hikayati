import { init } from "./001_init";

/** Ordered migrations. Append new entries; never edit one that has shipped. */
export const migrations: { id: string; sql: string }[] = [{ id: "001_init", sql: init }];
