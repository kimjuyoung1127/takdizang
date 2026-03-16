import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { BlockDocument } from "@/types/blocks";
import Loading from "./loading";

const ComposeShell = dynamic(
  () => import("@/components/compose/compose-shell").then((module) => module.ComposeShell),
  { loading: () => <Loading /> },
);

const DEFAULT_DOC: BlockDocument = {
  format: "blocks",
  blocks: [],
  platform: { width: 780, name: "coupang" },
  version: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: project ? `${project.name} | Compose | Takdi Studio` : "Compose | Takdi Studio",
    description: "Compose product detail blocks for this Takdi Studio project.",
  };
}

export default async function ComposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, content: true, status: true },
  });

  if (!project) {
    notFound();
  }

  let initialDoc = DEFAULT_DOC;
  if (project.content) {
    try {
      const parsed = JSON.parse(project.content);
      if (parsed.format === "blocks") {
        initialDoc = parsed as BlockDocument;
      }
    } catch {
      // fall back to the default empty document
    }
  }

  return <ComposeShell projectId={project.id} projectName={project.name} initialDoc={initialDoc} projectStatus={project.status} />;
}
