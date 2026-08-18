import type { Task } from "../types"

export interface ProjectProgress {
  done: number
  total: number
  percent: number
}

export function getProjectProgress(
  tasks: Task[],
  projectId: string | number
): ProjectProgress {
  const projectTasks = tasks.filter((t) => String(t.projectId) === String(projectId))
  const done = projectTasks.filter((t) => t.status === "done").length
  const total = projectTasks.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { done, total, percent }
}
