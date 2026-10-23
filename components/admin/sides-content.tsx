"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  redoAllPartyTestsAction,
  redoFullPartyProfileAction,
  redoPartyBotPromptAction,
  redoPartyTestAction,
  updatePartyMetaAction,
} from "@/app/admin/sides/actions";
import { useLocale } from "@/components/locale-provider";
import { ModalOverlay } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/format-datetime";
import type { SideListRow } from "@/lib/room/list-sides";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

type SideListTab = "admin" | "mediator";

type SideTableRow = SideListRow & {
  roleLabel: string;
  roleShort: string;
  mediatorDisplay: string;
  testsCompleteCount: number;
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted) {
    return (
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">
        unfold_more
      </span>
    );
  }
  return (
    <span className="material-symbols-outlined text-[16px] text-tertiary">
      {sorted === "asc" ? "arrow_upward" : "arrow_downward"}
    </span>
  );
}

function StatusChip({
  label,
  ready,
  date,
  locale,
}: {
  label: string;
  ready: boolean;
  date: string | null;
  locale: "en" | "uk";
}) {
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[11px] font-bold leading-none",
          ready ? "bg-success/20 text-success" : "bg-error/20 text-error",
        )}
        title={date ? formatDateTime(date, locale) : undefined}
      >
        {label}
      </span>
      <span className="whitespace-nowrap text-[10px] leading-none text-on-surface-variant">
        {date ? formatDateTime(date, locale) : "—"}
      </span>
    </span>
  );
}

function RowActions({
  row,
  pending,
  onAction,
  onEdit,
}: {
  row: SideTableRow;
  pending: boolean;
  onAction: (run: () => Promise<void>, confirm: string) => void;
  onEdit: (row: SideTableRow) => void;
}) {
  const { admin } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <button
        className="rounded-md border border-outline-variant/30 p-1.5 text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
        disabled={pending}
        onClick={() => onEdit(row)}
        title={admin.sidesEdit}
        type="button"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
      </button>
      <button
        className="rounded-md border border-outline-variant/30 p-1.5 text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
      {open ? (
        <>
          <button
            aria-label="Close"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-lg border border-outline-variant/30 bg-surface-container py-1 shadow-lg"
            role="menu"
          >
            <button
              className="block w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-law-fill/60 disabled:opacity-50"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onEdit(row);
              }}
              role="menuitem"
              type="button"
            >
              {admin.sidesEdit}
            </button>
            {TEST_KEYS.map((testKey, index) => (
              <button
                className="block w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-law-fill/60 disabled:opacity-50"
                disabled={pending}
                key={testKey}
                onClick={() => {
                  setOpen(false);
                  onAction(
                    () => redoPartyTestAction(row.userId, testKey),
                    admin.sidesRedoConfirmTest,
                  );
                }}
                role="menuitem"
                type="button"
              >
                {admin.sidesRedoTest(`T${index + 1}`)}
              </button>
            ))}
            <button
              className="block w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-law-fill/60 disabled:opacity-50"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onAction(
                  () => redoAllPartyTestsAction(row.userId),
                  admin.sidesRedoConfirmAllTests,
                );
              }}
              role="menuitem"
              type="button"
            >
              {admin.sidesRedoAllTests}
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-law-fill/60 disabled:opacity-50"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onAction(
                  () => redoPartyBotPromptAction(row.userId),
                  admin.sidesRedoConfirmBot,
                );
              }}
              role="menuitem"
              type="button"
            >
              {admin.sidesRedoBot}
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-law-fill/60 disabled:opacity-50"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onAction(
                  () => redoFullPartyProfileAction(row.userId),
                  admin.sidesRedoConfirmAll,
                );
              }}
              role="menuitem"
              type="button"
            >
              {admin.sidesRedoAll}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function SidesContent({
  rows,
  showTabs = false,
}: {
  rows: SideListRow[];
  showTabs?: boolean;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<SideListTab>("admin");
  const [mediatorFilter, setMediatorFilter] = useState("");
  const [editing, setEditing] = useState<SideTableRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const globalFilter = useDebouncedValue(searchQuery, 300);
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [globalFilter, mediatorFilter]);

  const tableRows = useMemo<SideTableRow[]>(() => {
    return rows.map((row) => ({
      ...row,
      roleLabel: admin.roles[row.partyRole] ?? row.partyRole,
      roleShort: row.partyRole === "party_a" ? "A" : "B",
      mediatorDisplay: row.mediatorTitle ?? admin.unknownMediator,
      testsCompleteCount: TEST_KEYS.reduce(
        (count, key) => count + (row.tests[key].complete ? 1 : 0),
        0,
      ),
    }));
  }, [rows, admin.roles, admin.unknownMediator]);

  const tabBaseRows = useMemo(() => {
    if (!showTabs) return tableRows;
    if (activeTab === "admin") {
      return tableRows.filter((row) => !row.roomCreatedByUserId);
    }
    return tableRows.filter((row) => !!row.roomCreatedByUserId);
  }, [tableRows, showTabs, activeTab]);

  const showMediatorColumn = showTabs && activeTab === "mediator";

  const mediatorOptions = useMemo(() => {
    if (!showMediatorColumn) return [];
    const byId = new Map<string, string>();
    for (const row of tabBaseRows) {
      if (!row.roomCreatedByUserId) continue;
      byId.set(row.roomCreatedByUserId, row.mediatorDisplay);
    }
    return [...byId.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [showMediatorColumn, tabBaseRows]);

  useEffect(() => {
    if (!mediatorFilter) return;
    if (!mediatorOptions.some((option) => option.id === mediatorFilter)) {
      setMediatorFilter("");
    }
  }, [mediatorFilter, mediatorOptions]);

  const tabRows = useMemo(() => {
    if (!showMediatorColumn || !mediatorFilter) return tabBaseRows;
    return tabBaseRows.filter((row) => row.roomCreatedByUserId === mediatorFilter);
  }, [tabBaseRows, showMediatorColumn, mediatorFilter]);

  const openEdit = useCallback((row: SideTableRow) => {
    setEditing(row);
    setEditTitle(row.title);
    setEditDescription(row.description);
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editing) return;
    startTransition(async () => {
      try {
        await updatePartyMetaAction(editing.userId, editTitle, editDescription);
        toast.success(admin.sidesEditSuccess);
        setEditing(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : admin.sidesEditError);
      }
    });
  }, [
    admin.sidesEditError,
    admin.sidesEditSuccess,
    editDescription,
    editTitle,
    editing,
    router,
  ]);

  const runAction = useCallback(
    (run: () => Promise<void>, confirm: string) => {
      if (!window.confirm(confirm)) return;
      startTransition(async () => {
        try {
          await run();
          toast.success(admin.sidesRedoSuccess);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : admin.sidesRedoError);
        }
      });
    },
    [admin.sidesRedoError, admin.sidesRedoSuccess, router],
  );

  const columns = useMemo<ColumnDef<SideTableRow>[]>(() => {
    const defs: ColumnDef<SideTableRow>[] = [];

    if (showMediatorColumn) {
      defs.push({
        accessorKey: "mediatorDisplay",
        id: "mediator",
        header: admin.roles.mediator,
        cell: ({ getValue }) => (
          <span className="text-body-sm text-on-surface">{String(getValue() ?? "")}</span>
        ),
      });
    }

    defs.push(
      {
        accessorKey: "title",
        header: admin.titleLabel,
        cell: ({ row }) => (
          <div className="min-w-[8rem] max-w-[14rem]">
            <button
              className="text-left font-display text-body-md font-semibold text-on-surface hover:text-law"
              onClick={() => openEdit(row.original)}
              type="button"
            >
              {row.original.title}
            </button>
            {row.original.description ? (
              <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">
                {row.original.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "login",
        header: admin.sidesLoginColumn,
        cell: ({ getValue }) => (
          <span className="font-mono text-body-sm text-on-surface">{String(getValue() ?? "")}</span>
        ),
      },
      {
        accessorKey: "roleShort",
        id: "role",
        header: admin.sidesRoleColumn,
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-md text-label-md font-bold",
              row.original.partyRole === "party_a"
                ? "bg-primary/15 text-primary"
                : "bg-tertiary/15 text-tertiary",
            )}
            title={row.original.roleLabel}
          >
            {row.original.roleShort}
          </span>
        ),
      },
      {
        accessorKey: "roomTitle",
        id: "room",
        header: admin.sidesRoomColumn,
        cell: ({ getValue }) => (
          <span className="text-body-sm text-on-surface">{String(getValue() ?? "")}</span>
        ),
      },
      {
        accessorKey: "testsCompleteCount",
        id: "tests",
        header: admin.sidesTestsColumn,
        sortingFn: (rowA, rowB) =>
          rowA.original.testsCompleteCount - rowB.original.testsCompleteCount,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {TEST_KEYS.map((key: TestKey, index) => {
              const test = row.original.tests[key];
              return (
                <StatusChip
                  date={test.airtableCreatedAt}
                  key={key}
                  label={`T${index + 1}`}
                  locale={locale}
                  ready={test.complete}
                />
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: "personalBotReady",
        id: "bot",
        header: admin.sidesBotColumn,
        sortingFn: (rowA, rowB) =>
          Number(rowA.original.personalBotReady) - Number(rowB.original.personalBotReady),
        cell: ({ row }) => (
          <StatusChip
            date={row.original.personalBotAirtableUpdatedAt}
            label="BP"
            locale={locale}
            ready={row.original.personalBotReady}
          />
        ),
      },
      {
        id: "actions",
        header: admin.sidesActionsColumn,
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            onAction={runAction}
            onEdit={openEdit}
            pending={pending}
            row={row.original}
          />
        ),
      },
    );

    return defs;
  }, [admin, locale, openEdit, pending, runAction, showMediatorColumn]);

  const table = useReactTable({
    data: tabRows,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      if (!query) return true;
      const haystack = [
        row.original.title,
        row.original.description,
        row.original.login,
        row.original.roleLabel,
        row.original.roleShort,
        row.original.roomTitle,
        row.original.mediatorDisplay,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    },
  });

  const emptyMessage = () => {
    if (showTabs) {
      return activeTab === "admin" ? admin.sidesNoAdmin : admin.sidesNoMediator;
    }
    return admin.sidesNoRows;
  };

  const visibleRows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const pageLabel = admin.tablePageOf
    .replace("{page}", String(table.getState().pagination.pageIndex + 1))
    .replace("{pages}", String(pageCount));

  const editDirty =
    !!editing &&
    (editTitle.trim() !== editing.title.trim() ||
      editDescription.trim() !== editing.description.trim());

  return (
    <section className="space-y-stack-lg">
      <ModalOverlay onClose={closeEdit} open={!!editing} panelClassName="max-w-md">
        {editing ? (
          <div
            aria-labelledby="sides-edit-title"
            aria-modal="true"
            className="space-y-5 rounded-xl border border-hair bg-surface-container p-6 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="font-display text-headline-md text-on-surface"
                  id="sides-edit-title"
                >
                  {admin.sidesEditTitle}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {editing.login} · {editing.roleLabel}
                </p>
              </div>
              <button
                className="grid h-8 w-8 place-items-center rounded-full border border-hair text-on-surface-variant hover:text-on-surface"
                onClick={closeEdit}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">
                  {admin.titleLabel}
                </label>
                <input
                  className={inputClass}
                  onChange={(event) => setEditTitle(event.target.value)}
                  required
                  value={editTitle}
                />
              </div>
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">
                  {admin.descriptionLabel}
                </label>
                <textarea
                  className={inputClass}
                  onChange={(event) => setEditDescription(event.target.value)}
                  required
                  rows={3}
                  value={editDescription}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high"
                onClick={closeEdit}
                type="button"
              >
                {admin.cancel}
              </button>
              <button
                className="btn-primary flex items-center gap-1.5 px-4 py-2 disabled:opacity-60"
                disabled={pending || !editDirty || !editTitle.trim() || !editDescription.trim()}
                onClick={saveEdit}
                type="button"
              >
                {pending ? <Spinner size="sm" /> : null}
                {admin.saveChanges}
              </button>
            </div>
          </div>
        ) : null}
      </ModalOverlay>

      <div>
        <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.sidesTitle}</h3>
        <p className="max-w-xl text-on-surface-variant">{admin.sidesSubtitle}</p>
      </div>

      {showTabs ? (
        <div className="flex gap-2 border-b border-outline-variant/20">
          {(["admin", "mediator"] as const).map((tab) => (
            <button
              className={
                activeTab === tab
                  ? "border-b-2 border-law px-4 py-3 font-display text-body-md font-semibold text-ink"
                  : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
              }
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setMediatorFilter("");
                setSearchQuery("");
                setSorting([{ id: "title", desc: false }]);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              type="button"
            >
              {tab === "admin" ? admin.sidesTabAdmin : admin.sidesTabMediator}
            </button>
          ))}
        </div>
      ) : null}

      {tabBaseRows.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-on-surface-variant">
          {emptyMessage()}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full rounded-md border border-ink/25 bg-surface-container py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={admin.searchPlaceholder}
                type="search"
                value={searchQuery}
              />
            </div>
            {showMediatorColumn && mediatorOptions.length > 0 ? (
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span className="shrink-0">{admin.sidesFilterMediator}</span>
                <select
                  className="min-w-[12rem] rounded-md border border-ink/25 bg-surface-container px-3 py-2.5 text-sm text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
                  onChange={(event) => setMediatorFilter(event.target.value)}
                  value={mediatorFilter}
                >
                  <option value="">{admin.sidesFilterMediatorAll}</option>
                  {mediatorOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-ink/30 bg-surface-variant">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    className="border-b border-ink/30 bg-ink/[0.08]"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => (
                      <th className="px-4 py-3" key={header.id}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            className="flex w-full items-center gap-1 font-display text-body-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        ) : (
                          <span className="font-display text-body-md font-semibold text-on-surface-variant">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr className="bg-surface-container">
                    <td
                      className="px-4 py-8 text-center text-on-surface-variant"
                      colSpan={columns.length}
                    >
                      {admin.noSearchResults}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr
                      className="border-b border-ink/25 bg-surface-container transition-colors last:border-b-0 hover:bg-law-fill/40"
                      key={row.id}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td className="px-4 py-3 align-top" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredCount > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span>{admin.tableRowsPerPage}</span>
                <select
                  className="rounded-md border border-hair bg-paper px-2 py-1.5 text-sm text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
                  onChange={(event) => {
                    table.setPageSize(Number(event.target.value));
                  }}
                  value={table.getState().pagination.pageSize}
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-3">
                <p className="text-body-sm text-on-surface-variant">{pageLabel}</p>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                    type="button"
                  >
                    {admin.tablePreviousPage}
                  </button>
                  <button
                    className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                    type="button"
                  >
                    {admin.tableNextPage}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
