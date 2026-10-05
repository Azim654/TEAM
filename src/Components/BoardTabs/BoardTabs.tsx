import { useEffect, useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../Modal/Modal"
import { useBoardStore } from "../../store/useBoardStore"
import type { Board } from "../../types"

import "./BoardTabs.scss"

interface BoardTabsProps {
  projectId: string
  isOwner: boolean
  selectedBoardId: string | null
  onSelectBoard: (id: string) => void
}

function BoardTabs({ projectId, isOwner, selectedBoardId, onSelectBoard }: BoardTabsProps) {
  const { t } = useTranslation()
  const { boards, loading, fetchBoardsByProject, createBoard, renameBoard, removeBoard } =
    useBoardStore()

  const projectBoards = boards.filter((b) => b.projectId === projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetchBoardsByProject(projectId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (!selectedBoardId && projectBoards.length > 0) {
      onSelectBoard(projectBoards[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectBoards.length, selectedBoardId])

  useEffect(() => {
    if (!menuOpenFor) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpenFor])

  const openCreate = () => {
    setForm({ name: "", description: "" })
    setCreateError(null)
    setCreateOpen(true)
  }

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setCreateError(t("boards.errorNameRequired"))
      return
    }
    setSubmitting(true)
    setCreateError(null)
    try {
      const board = await createBoard({
        projectId,
        name: form.name.trim(),
        description: form.description.trim(),
      })
      setCreateOpen(false)
      onSelectBoard(board.id)
    } catch (err) {
      setCreateError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const startRename = (board: Board) => {
    setRenameId(board.id)
    setRenameValue(board.name)
    setMenuOpenFor(null)
  }

  const submitRename = async (board: Board) => {
    const value = renameValue.trim()
    setRenameId(null)
    if (!value || value === board.name) return
    try {
      await renameBoard(board.id, { name: value })
    } catch {
      // при ошибке просто оставляем прежнее имя доски
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const wasSelected = selectedBoardId === deleteTarget.id
      await removeBoard(deleteTarget.id)
      if (wasSelected) {
        const remaining = projectBoards.filter((b) => b.id !== deleteTarget.id)
        if (remaining[0]) onSelectBoard(remaining[0].id)
      }
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="board-tabs">
      <div className="board-tabs__list">
        {projectBoards.map((board) => (
          <div
            key={board.id}
            className={`board-tabs__tab ${
              selectedBoardId === board.id ? "board-tabs__tab--active" : ""
            }`}
          >
            {renameId === board.id ? (
              <input
                className="board-tabs__rename-input"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => submitRename(board)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename(board)
                  if (e.key === "Escape") setRenameId(null)
                }}
              />
            ) : (
              <button
                type="button"
                className="board-tabs__tab-label"
                onClick={() => onSelectBoard(board.id)}
                onDoubleClick={() => isOwner && startRename(board)}
                title={board.description || board.name}
              >
                {board.name}
              </button>
            )}

            {isOwner && renameId !== board.id && (
              <div
                className="board-tabs__tab-menu-wrap"
                ref={menuOpenFor === board.id ? menuRef : undefined}
              >
                <button
                  type="button"
                  className="board-tabs__tab-menu-trigger"
                  onClick={() => setMenuOpenFor((v) => (v === board.id ? null : board.id))}
                  aria-label={t("boards.actionsMenu")}
                >
                  ⋮
                </button>
                {menuOpenFor === board.id && (
                  <div className="board-tabs__tab-menu">
                    <button type="button" onClick={() => startRename(board)}>
                      {t("boards.rename")}
                    </button>
                    <button
                      type="button"
                      className="board-tabs__tab-menu-danger"
                      onClick={() => {
                        setMenuOpenFor(null)
                        setDeleteTarget(board)
                      }}
                      disabled={projectBoards.length <= 1}
                      title={
                        projectBoards.length <= 1 ? t("boards.errorLastBoard") : undefined
                      }
                    >
                      {t("boards.delete")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          className="board-tabs__add"
          onClick={openCreate}
          title={t("boards.addBoard")}
        >
          + {t("boards.addBoard")}
        </button>

        {loading && projectBoards.length === 0 && (
          <span className="board-tabs__loading">{t("common.loading")}</span>
        )}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <h1>{t("boards.createTitle")}</h1>

        {createError && <div className="auth-error">{createError}</div>}

        <form className="create-project" onSubmit={handleCreateSubmit}>
          <label className="auth-field">
            <span>{t("boards.nameLabel")}</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("boards.namePlaceholder")}
              autoFocus
            />
          </label>

          <label className="auth-field">
            <span>{t("boards.description")}</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("boards.descriptionPlaceholder")}
              rows={3}
            />
          </label>

          <div className="buttons">
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setCreateOpen(false)}
            >
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("common.creating") : t("common.create")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <h1>{t("boards.deleteConfirmTitle")}</h1>
        <p className="project__delete-text">
          {t("boards.deleteConfirmText", { name: deleteTarget?.name })}
        </p>
        {deleteError && <div className="auth-error">{deleteError}</div>}
        <div className="project__delete-buttons">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setDeleteTarget(null)}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? t("common.saving") : t("boards.deleteConfirmSubmit")}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default BoardTabs