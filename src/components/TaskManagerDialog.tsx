import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from "./Icons";
import { normalizeGameName } from "../lib/games";
import type { Game } from "../types";

interface TaskManagerDialogProps {
  open: boolean;
  game: Game | null;
  onClose: () => void;
  onAdd: (name: string) => void;
  onRename: (taskId: string, name: string) => void;
  onRemove: (taskId: string) => void;
}

export function TaskManagerDialog({
  open,
  game,
  onClose,
  onAdd,
  onRename,
  onRemove
}: TaskManagerDialogProps) {
  const [newTaskName, setNewTaskName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNewTaskName("");
      setAddError(null);
      setEditingId(null);
      setEditingName("");
      setEditError(null);
    }
  }, [open, game?.id]);

  if (!game) {
    return null;
  }

  const validateName = (name: string, currentTaskId?: string): string | null => {
    const normalized = normalizeGameName(name);
    if (!normalized) {
      return "请输入任务名称";
    }
    if (Array.from(normalized).length > 30) {
      return "任务名称不能超过 30 个字符";
    }
    const duplicate = game.tasks.some(
      (task) => task.id !== currentTaskId && normalizeGameName(task.name).toLowerCase() === normalized.toLowerCase()
    );
    return duplicate ? "已经存在同名任务" : null;
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateName(newTaskName);
    if (error) {
      setAddError(error);
      return;
    }

    onAdd(normalizeGameName(newTaskName));
    setNewTaskName("");
    setAddError(null);
  };

  const startEditing = (taskId: string, name: string) => {
    setEditingId(taskId);
    setEditingName(name);
    setEditError(null);
  };

  const handleRename = (event: FormEvent<HTMLFormElement>, taskId: string) => {
    event.preventDefault();
    const error = validateName(editingName, taskId);
    if (error) {
      setEditError(error);
      return;
    }

    onRename(taskId, normalizeGameName(editingName));
    setEditingId(null);
    setEditError(null);
  };

  return (
    <Modal
      description={`当前正在编辑「${game.name}」的任务清单，只影响这款游戏。`}
      onClose={onClose}
      open={open}
      size="wide"
      title="编辑任务清单"
    >
      <form className="task-add-form" onSubmit={handleAdd}>
        <label className="field">
          <span>新增任务</span>
          <div className="inline-field">
            <input
              aria-invalid={Boolean(addError)}
              maxLength={31}
              onChange={(event) => {
                setNewTaskName(event.target.value);
                setAddError(null);
              }}
              placeholder="例如：完成每日委托"
              value={newTaskName}
            />
            <button className="button button-primary" type="submit">
              <PlusIcon width="17" height="17" />
              添加
            </button>
          </div>
        </label>
        {addError ? <p className="field-error" role="alert">{addError}</p> : null}
      </form>

      <div className="task-editor-list">
        {game.tasks.map((task, index) => (
          <div className="task-editor-row" key={task.id}>
            <span className="task-editor-index">{String(index + 1).padStart(2, "0")}</span>
            {editingId === task.id ? (
              <form className="task-rename-form" onSubmit={(event) => handleRename(event, task.id)}>
                <input
                  aria-invalid={Boolean(editError)}
                  onChange={(event) => {
                    setEditingName(event.target.value);
                    setEditError(null);
                  }}
                  value={editingName}
                />
                <button aria-label="保存任务名称" className="mini-action is-primary" type="submit">
                  <CheckIcon width="17" height="17" />
                </button>
                <button className="text-action" onClick={() => setEditingId(null)} type="button">
                  取消
                </button>
                {editError ? <span className="manage-edit-error">{editError}</span> : null}
              </form>
            ) : (
              <>
                <strong>{task.name}</strong>
                <span className="task-editor-actions">
                  <button
                    aria-label={`修改任务：${task.name}`}
                    className="mini-action"
                    onClick={() => startEditing(task.id, task.name)}
                    title="改名"
                    type="button"
                  >
                    <PencilIcon width="16" height="16" />
                  </button>
                  <button
                    aria-label={`删除任务：${task.name}`}
                    className="mini-action remove-action"
                    disabled={game.tasks.length <= 1}
                    onClick={() => onRemove(task.id)}
                    title={game.tasks.length <= 1 ? "至少保留一项任务" : "删除"}
                    type="button"
                  >
                    <TrashIcon width="16" height="16" />
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}