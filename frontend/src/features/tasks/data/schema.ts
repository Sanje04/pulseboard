import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
  description: z.string().max(500).optional().nullable(),
})

export const taskListSchema = z.array(taskSchema)

export type Task = z.infer<typeof taskSchema>
