import { useMemo, useState, type DragEvent } from "react"
import { useTranslation } from "react-i18next"
import TaskCard from "../TaskCard/TaskCard"
import TaskModal from "../TaskModal/TaskModal"
import { useTaskStore } from "../../store/useTaskStore"
import { useProjectStore } from "../../store/useProjectStore"
import { useAuthStore } from "../../store/useAuthStore"
import { hasPermission } from "../../utils/permissions"
import type { StoryPoint, Task, TaskPriority, TaskStatus } from "../../types"
import { STORY_POINTS } from "../../types"

import "./Board.scss"

interface BoardProps {
  projectId: string
  boardId: string
}

interface Column {
  status: TaskStatus
  title: string
}

type PriorityFilter = "all" | TaskPriority
type StoryPointFilter = "all" | StoryPoint
type SortOption = "manual" | "dueDate" | "priority" | "storyPoint" | "newest" | "oldest"

const priorityWeight: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 }

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const sorted = [...tasks]
  switch (sortBy) {
    case "dueDate":
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      break
    case "priority":
      sorted.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
      break
    case "storyPoint":
      sorted.sort((a, b) => (b.storyPoint ?? 0) - (a.storyPoint ?? 0))
      break
    case "newest":
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      break
    case "oldest":
      sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      break
    default:
      break
  }
  return sorted
}

function Board({ projectId, boardId }: BoardProps) {
  const { t } = useTranslation()
  const { getTasksByBoard, updateTaskStatus } = useTaskStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const canCreateTasks = currentProject
    ? hasPermission(currentProject, user?.id, "create_tasks")
    : false
  const canEditTasks = currentProject
    ? hasPermission(currentProject, user?.id, "edit_tasks")
    : false

  const columns: Column[] = [
    { status: "backlog", title: t("board.columnBacklog") },
    { status: "todo", title: t("board.columnTodo") },
    { status: "in_progress", title: t("board.columnInProgress") },
    { status: "review", title: t("board.columnReview") },
    { status: "testing", title: t("board.columnTesting") },
    { status: "done", title: t("board.columnDone") },
  ]
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [modalStatus, setModalStatus] = useState<TaskStatus>("todo")
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [storyPointFilter, setStoryPointFilter] = useState<StoryPointFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("manual")

  const allTasks = getTasksByBoard(boardId)

  const tasks = useMemo(() => {
    let filtered = allTasks
    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter)
    }
    if (storyPointFilter !== "all") {
      filtered = filtered.filter((t) => t.storyPoint === storyPointFilter)
    }
    return sortTasks(filtered, sortBy)
  }, [allTasks, priorityFilter, storyPointFilter, sortBy])

  const openCreateModal = (status: TaskStatus) => {
    setActiveTask(null)
    setModalStatus(status)
    setModalOpen(true)
    setModalKey((k) => k + 1)
  }

  const openEditModal = (task: Task) => {
    setActiveTask(task)
    setModalStatus(task.status)
    setModalOpen(true)
    setModalKey((k) => k + 1)
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData("text/plain", taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStatus(status)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault()
    const taskId = draggedTaskId ?? e.dataTransfer.getData("text/plain")
    if (taskId && canEditTasks) {
      updateTaskStatus(taskId, status)
    }
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }

  return (
    <div className="board-wrap">
      <div className="board-toolbar">
        <label className="board-toolbar__field">
          <span>{t("board.priority")}</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
          >
            <option value="all">{t("board.priorityAll")}</option>
            <option value="high">{t("board.priorityHigh")}</option>
            <option value="medium">{t("board.priorityMedium")}</option>
            <option value="low">{t("board.priorityLow")}</option>
          </select>
        </label>

        <label className="board-toolbar__field">
          <span>{t("board.storyPoint")}</span>
          <select
            value={storyPointFilter}
            onChange={(e) =>
              setStoryPointFilter(
                e.target.value === "all" ? "all" : (Number(e.target.value) as StoryPoint)
              )
            }
          >
            <option value="all">{t("board.storyPointAll")}</option>
            {STORY_POINTS.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </label>

        <label className="board-toolbar__field">
          <span>{t("board.sort")}</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <option value="manual">{t("board.sortManual")}</option>
            <option value="dueDate">{t("board.sortDueDate")}</option>
            <option value="priority">{t("board.sortPriority")}</option>
            <option value="storyPoint">{t("board.sortStoryPoint")}</option>
            <option value="newest">{t("board.sortNewest")}</option>
            <option value="oldest">{t("board.sortOldest")}</option>
          </select>
        </label>
      </div>

      <div className="board">
        {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status)
        return (
          <div
            key={column.status}
            className={`board__column ${
              dragOverStatus === column.status ? "board__column--over" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="board__column-header">
              <h3>
                {column.title}
                <span className="board__count">{columnTasks.length}</span>
              </h3>
              {canCreateTasks && (
                <button
                  type="button"
                  className="board__add"
                  onClick={() => openCreateModal(column.status)}
                  title={t("board.addTask")}
                >
                  +
                </button>
              )}
            </div>

            <div className="board__column-body">
              {columnTasks.length === 0 ? (
                <div className="board__empty">{t("board.noTasks")}</div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable={canEditTasks}
                    onClick={() => openEditModal(task)}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={() => {
                      setDraggedTaskId(null)
                      setDragOverStatus(null)
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
      </div>

      <TaskModal
        key={modalKey}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        boardId={boardId}
        status={modalStatus}
        task={activeTask}
      />
    </div>
  )
}

export default Board