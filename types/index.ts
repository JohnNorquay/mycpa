// Re-export database types
export type { Database, Json, Tables, InsertTables, UpdateTables } from './database'

// Common types used across the application
export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }
