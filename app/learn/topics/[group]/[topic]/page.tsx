import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LearnLibrary } from "@/components/LearnLibrary";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";
import { getGhostPosts } from "@/lib/ghost";
import { getLearnGroupForPost, getLearnTopicForPost, type LearnGroupKey } from "@/lib/learnTaxonomy";

export const revalidate = 120;
export const dynamic = "force-static";

type TopicPageProps = {
  params: { group: string; topic: string };
};

const getTopicParam = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getGroupParam = (value: string): LearnGroupKey | null => {
  if (value === "learn" || value === "academy") return "learn";
  if (value === "campfire") return "campfire";
  return null;
};

export async function generateStaticParams() {
  const posts = await getGhostPosts();
  const topics = new Map<string, { group: LearnGroupKey; topic: string }>();

  posts.forEach((post) => {
    const group = getLearnGroupForPost(post);
    const topic = getLearnTopicForPost(post, group);
    topics.set(`${group}:${topic}`, { group, topic });
  });

  return Array.from(topics.values()).map(({ group, topic }) => ({ group, topic }));
}

export default async function LearnTopicPage({ params }: TopicPageProps) {
  const group = getGroupParam(params.group);
  const topic = getTopicParam(params.topic);
  if (!group) notFound();

  const [navItems, pageData, posts] = await Promise.all([
    getNavigationItems(),
    getPublishedPageBySlug("/learn"),
    getGhostPosts()
  ]);
  const hasTopic = posts.some(
    (post) => getLearnGroupForPost(post) === group && getLearnTopicForPost(post, group) === topic
  );

  if (!pageData || !hasTopic) notFound();

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main id="main-content" tabIndex={-1}>
        <LearnLibrary posts={posts} initialGroup={group} initialTopic={topic} />
      </main>
      <SiteFooter navItems={navItems} showTopBorder />
    </>
  );
}
