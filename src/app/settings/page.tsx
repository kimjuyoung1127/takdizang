/** Read-only workspace operations summary for the current local setup. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthError } from "@/lib/workspace-guard";
import { getSettingsSummary } from "@/features/workspace-hub/home-feed";
import { formatCurrentScope } from "@/i18n/format";
import { getMessages } from "@/i18n/get-messages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "설정 | Takdi Studio",
  description: "워크스페이스 운영 상태를 확인해요.",
};

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="takdi-panel-strong min-h-[140px] rounded-[1.8rem] p-6">
      <p className="takdi-stat-label">{title}</p>
      <p className="takdi-stat-value mt-3">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--takdi-text-muted)]">{description}</p>
    </div>
  );
}

function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function SettingsPage() {
  let summary;
  try {
    summary = await getSettingsSummary();
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }
  const messages = getMessages();

  return (
    <AppLayout>
      <section className="takdi-page-intro px-6 py-7 lg:px-8">
        <p className="takdi-kicker">Runtime and storage</p>
        <h1 className="takdi-display mt-4 max-w-[9ch]">{messages.settingsPage.title}</h1>
        <p className="takdi-lead mt-5">{messages.settingsPage.description}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title={messages.settingsPage.workspace}
          value={summary.workspaceName}
          description={formatCurrentScope(messages, summary.workspaceId)}
        />
        <SummaryCard
          title={messages.settingsPage.projects}
          value={String(summary.projectCount)}
          description={messages.settingsPage.projectCountDescription}
        />
        <SummaryCard
          title={messages.settingsPage.savedTemplates}
          value={String(summary.templateCount)}
          description={messages.settingsPage.templateCountDescription}
        />
        <SummaryCard
          title={messages.settingsPage.assets}
          value={String(summary.assetCount)}
          description={messages.settingsPage.assetCountDescription}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="takdi-panel-strong rounded-[1.9rem] p-6">
          <h2 className="text-lg font-semibold text-[var(--takdi-text)]">{messages.settingsPage.runtimeSummaryTitle}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--takdi-text-muted)]">{messages.settingsPage.nextJs}</dt>
              <dd className="text-right text-[var(--takdi-text)]">{summary.nextVersion}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--takdi-text-muted)]">{messages.settingsPage.prisma}</dt>
              <dd className="text-right text-[var(--takdi-text)]">{summary.prismaVersion}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--takdi-text-muted)]">{messages.settingsPage.remotionPreview}</dt>
              <dd className="text-right text-[var(--takdi-text)]">
                {summary.remotionPreviewEnabled ? messages.settingsPage.enabled : messages.settingsPage.disabled}
              </dd>
            </div>
          </dl>
        </div>

        <div className="takdi-panel-strong rounded-[1.9rem] p-6">
          <h2 className="text-lg font-semibold text-[var(--takdi-text)]">{messages.settingsPage.storageSummaryTitle}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-[var(--takdi-text-muted)]">{messages.settingsPage.database}</dt>
              <dd className="mt-1 break-all text-[var(--takdi-text)]">{summary.databaseUrl}</dd>
            </div>
            <div>
              <dt className="text-[var(--takdi-text-muted)]">{messages.settingsPage.uploadsPath}</dt>
              <dd className="mt-1 break-all text-[var(--takdi-text)]">{summary.uploadsPath}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="takdi-kicker">Overview</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">운영 현황</h2>
            <p className="mt-2 text-sm text-[var(--takdi-text-muted)]">이번 달 사용량과 비용을 확인할 수 있어요.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="월간 작업량"
            value={String(summary.monthlyEventCount)}
            description="이번 달 실행한 작업 수예요."
          />
          <SummaryCard
            title="내보내기 수"
            value={String(summary.exportCount)}
            description="완성해서 내보낸 결과물 수예요."
          />
          <SummaryCard
            title="추정 비용"
            value={`$${summary.totalEstimatedCost.toFixed(2)}`}
            description="이번 달 누적 비용 추정치예요."
          />
        </div>
      </section>

      <section className="takdi-panel-strong rounded-[1.9rem] p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="takdi-kicker">Recent activity</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">최근 실행 이력</h2>
            <p className="mt-2 text-sm text-[var(--takdi-text-muted)]">최근 8건의 작업 내역을 보여줘요.</p>
          </div>
        </div>

        {summary.recentActivity.length > 0 ? (
          <div className="mt-6 space-y-3">
            {summary.recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-[1.45rem] border border-[rgb(232_219_206_/_0.9)] bg-[linear-gradient(160deg,rgba(252,250,247,0.96),rgba(255,255,255,0.74))] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--takdi-text)]">{item.label}</p>
                  <p className="mt-1 text-sm text-[var(--takdi-text-muted)]">{item.detail}</p>
                </div>
                <div className="text-sm text-[var(--takdi-text-subtle)] md:text-right">
                  <p>{formatDateTime(item.createdAt)}</p>
                  <p className="mt-1">{item.costEstimate != null ? `$${item.costEstimate.toFixed(2)}` : "비용 정보 없음"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--takdi-text-muted)]">아직 실행 이력이 없어요. 작업을 시작하면 여기에 표시돼요.</p>
        )}
      </section>
    </AppLayout>
  );
}
