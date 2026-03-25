/** Full workspace explorer for projects and saved compose templates. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthError } from "@/lib/workspace-guard";
import { RecentProjects } from "@/components/home/recent-projects";
import { SavedTemplates } from "@/components/home/saved-templates";
import { getProjectsPageData } from "@/features/workspace-hub/home-feed";
import { getMessages } from "@/i18n/get-messages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "프로젝트 | Takdi Studio",
  description: "내 프로젝트와 저장된 템플릿을 한눈에 관리해요.",
};

export default async function ProjectsPage() {
  let data;
  try {
    data = await getProjectsPageData();
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }
  const { projects, templates } = data;
  const messages = getMessages();

  return (
    <AppLayout>
      <section className="takdi-page-intro grid gap-6 px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <p className="takdi-kicker">Project explorer</p>
          <h1 className="takdi-display mt-4 max-w-[10ch]">{messages.projectsPage.title}</h1>
          <p className="takdi-lead mt-5">{messages.projectsPage.description}</p>
        </div>

        <div className="takdi-panel rounded-[1.7rem] p-5">
          <p className="takdi-stat-label">Browse faster</p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">
            검색과 필터로 원하는 프로젝트를 빠르게 찾을 수 있어요.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--takdi-text-muted)]">
            프로젝트와 템플릿을 한 화면에서 관리하고, 바로 작업을 이어가세요.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="takdi-kicker">Projects</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">
            {messages.projectsPage.explorerTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--takdi-text-muted)]">
            {messages.projectsPage.explorerDescription}
          </p>
        </div>
        <RecentProjects projects={projects} collapsible managementMode="bulk" />
      </section>

      <section className="space-y-4">
        <div>
          <p className="takdi-kicker">Templates</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--takdi-text)]">
            {messages.projectsPage.savedTemplatesTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--takdi-text-muted)]">
            {messages.projectsPage.savedTemplatesDescription}
          </p>
        </div>
        <SavedTemplates templates={templates} searchable collapsible managementMode="bulk" />
      </section>
    </AppLayout>
  );
}
