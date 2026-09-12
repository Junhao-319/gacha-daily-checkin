import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("shows full game names and opens a game-specific task list", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("崩坏：星穹铁道")).toBeInTheDocument();
    expect(screen.getByText("鸣潮")).toBeInTheDocument();
    expect(screen.getByText("明日方舟：终末地")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /打开 崩坏：星穹铁道，已完成 0\/4/ }));

    expect(screen.getByRole("heading", { name: "崩坏：星穹铁道" })).toBeInTheDocument();
    expect(screen.getByText("完成每日实训")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /完成每日实训/ }));
    expect(screen.getByText(/完成于/)).toBeInTheDocument();
  });

  it("adds a catalog game with its own default tasks", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "添加游戏" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /原神/ }));
    await user.click(screen.getByRole("button", { name: /打开 原神，已完成 0\/4/ }));

    expect(screen.getByText("完成每日委托")).toBeInTheDocument();
    expect(screen.getByText("消耗原粹树脂")).toBeInTheDocument();
  });

  it("adds a custom game with an editable task", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "添加游戏" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("输入完整游戏名称"), "测试二游");
    await user.click(within(dialog).getByRole("button", { name: "添加" }));
    await user.click(screen.getByRole("button", { name: /打开 测试二游，已完成 0\/1/ }));

    expect(screen.getByText("完成今日日常")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "编辑任务" }));
    expect(screen.getByRole("heading", { name: "编辑任务清单" })).toBeInTheDocument();
  });

  it("keeps archived task history visible in the selected day detail", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /打开 鸣潮，已完成 0\/4/ }));
    await user.click(screen.getByRole("button", { name: /完成每日活跃/ }));
    await user.click(screen.getByRole("button", { name: "返回今日清单" }));
    await user.click(screen.getByRole("button", { name: "管理游戏与外观" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "归档 鸣潮" }));
    await user.click(within(dialog).getByRole("button", { name: "关闭" }));

    const detail = document.querySelector(".day-detail");
    expect(detail).not.toBeNull();
    expect(within(detail as HTMLElement).getByText("鸣潮")).toBeInTheDocument();
    expect(within(detail as HTMLElement).getByText(/1\/4 项/)).toBeInTheDocument();
    expect(within(detail as HTMLElement).getByText(/已归档/)).toBeInTheDocument();
  });
});