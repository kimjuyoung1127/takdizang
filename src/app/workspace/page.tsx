import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { SummaryCard } from "@/components/shared/summary-card";
import { AuthError } from "@/lib/workspace-guard";
import { getSettingsSummary } from "@/features/workspace-hub/home-feed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "워크스페이스 | Takdi Studio",
  description: "워크스페이스 허브에서 운영 상태와 확장 준비 항목을 확인합니다.",
};

function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="takdi-panel rounded-[1.8rem] border-dashed p-6">
      <p className="text-sm font-semibold text-[var(--takdi-text)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--takdi-text-muted)]">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--takdi-text-subtle)]">B2B expansion slot</p>
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

export default async function WorkspacePage() {
  let summary;
  try {
    summary = await getSettingsSummary();
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="takdi-page-intro px-6 py-8 lg:px-8">
          <p className="takdi-kicker">Workspace hub</p>
          <h1 className="takdi-display mt-4 max-w-[11ch]">
            {summary.workspaceName}
          </h1>
          <p className="takdi-lead mt-5 max-w-3xl">
            현재 워크스페이스의 운영 상태를 확인하고, 향후 팀·권한·브랜드 운영으로 확장할 자리를 한 화면에서 정리합니다.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="프로젝트"
            value={String(summary.projectCount)}
            description="현재 워크스페이스에서 관리 중인 전체 프로젝트 수입니다."
          />
          <SummaryCard
            title="저장 템플릿"
            value={String(summary.templateCount)}
            description="반복 제작을 위해 저장한 상세페이지 템플릿 수입니다."
          />
          <SummaryCard
            title="에셋"
            value={String(summary.assetCount)}
            description="업로드 및 생성 결과를 포함한 전체 연결 에셋 수입니다."
          />
          <SummaryCard
            title="월간 작업량"
            value={String(summary.monthlyEventCount)}
            description="이번 달 누적된 실행 이벤트 수를 기준으로 작업량을 보여줍니다."
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="takdi-panel-strong rounded-[1.9rem] p-6">
            <h2 className="text-lg font-semibold text-[var(--takdi-text)]">운영 현황</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SummaryCard
                title="내보내기"
                value={String(summary.exportCount)}
                description="완료된 결과물과 저장 기록의 누적 수입니다."
              />
              <SummaryCard
                title="추정 비용"
                value={`$${summary.totalEstimatedCost.toFixed(2)}`}
                description="운영 참고용 누적 추정 비용입니다."
              />
              <SummaryCard
                title="업로드 경로"
                value="uploads"
                description={summary.uploadsPath}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <PlaceholderCard
              title="멤버와 권한"
              description="초대, 역할, 승인 흐름 같은 팀 기능을 여기에 확장할 수 있습니다."
            />
            <PlaceholderCard
              title="브랜드와 플랜"
              description="브랜드별 워크스페이스 운영, 플랜, 청구 관련 구조를 붙일 위치입니다."
            />
          </div>
        </section>

        <section className="takdi-panel-strong rounded-[1.9rem] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--takdi-text)]">최근 활동</h2>
              <p className="mt-2 text-sm text-[var(--takdi-text-muted)]">
                최근 작업 상태를 한 번에 확인하고, 어떤 프로젝트에서 어떤 이벤트가 발생했는지 빠르게 볼 수 있습니다.
              </p>
            </div>
          </div>

          {summary.recentActivity.length > 0 ? (
            <div className="mt-6 space-y-3">
              {summary.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="takdi-activity-item"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--takdi-text)]">{item.label}</p>
                    <p className="mt-1 text-sm text-[var(--takdi-text-muted)]">{item.detail}</p>
                  </div>
                  <div className="text-sm text-[var(--takdi-text-subtle)] md:text-right">
                    <p>{formatDateTime(item.createdAt)}</p>
                    <p className="mt-1">
                      {item.costEstimate != null ? `$${item.costEstimate.toFixed(2)}` : "비용 기록 없음"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--takdi-text-muted)]">아직 기록된 최근 활동이 없습니다.</p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
