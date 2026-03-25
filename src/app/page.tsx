/** Workspace home with compact mode shortcuts, recent projects, and saved templates. */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthError } from "@/lib/workspace-guard";
import { HomeStartGrid } from "@/components/home/home-start-grid";
import { RecentProjects } from "@/components/home/recent-projects";
import { SavedTemplates } from "@/components/home/saved-templates";
import { getHomeFeed } from "@/features/workspace-hub/home-feed";
import { getMessages } from "@/i18n/get-messages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const messages = getMessages();
  let feed;
  try {
    feed = await getHomeFeed();
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }
  const { projects, templates } = feed;

  return (
    <AppLayout>
      <div className="space-y-10">
        <section id="start-new-work" className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="takdi-kicker">Start</p>
              <h2 className="mt-2 text-[clamp(1.7rem,2vw,2.4rem)] font-semibold tracking-[-0.04em] text-[var(--takdi-text)]">
                어떤 콘텐츠를 만들어볼까요?
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--takdi-text-muted)]">
                원하는 작업을 선택하면 바로 시작할 수 있어요.
              </p>
            </div>

            <Link
              href="/projects"
              className="inline-flex items-center gap-2 self-start rounded-full border border-[rgb(214_199_184_/_0.78)] bg-[rgb(255_255_255_/_0.76)] px-4 py-2.5 text-sm font-medium text-[var(--takdi-text-muted)] transition hover:border-[rgb(212_184_166_/_0.86)] hover:text-[var(--takdi-text)]"
            >
              모든 프로젝트 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <HomeStartGrid />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-3">
            <div>
              <p className="takdi-kicker">Recent</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">
                최근 프로젝트
              </h2>
            </div>
            <RecentProjects projects={projects} collapsible defaultCollapsed />
          </div>

          <div className="space-y-3">
            <div>
              <p className="takdi-kicker">Library</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">
                {messages.home.savedTemplatesTitle}
              </h2>
            </div>
            <SavedTemplates templates={templates} collapsible defaultCollapsed />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
