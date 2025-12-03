// Re-export types
// Database types will be generated and imported here after schema is defined
// export type { Database } from './database';

// Common types used across the application
export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }
