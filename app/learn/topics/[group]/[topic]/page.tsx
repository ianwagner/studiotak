import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LearnLibrary } from "@/components/LearnLibrary";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";
import { getGhostPosts } from "@/lib/ghost";
import { getLearnGroupForPost, getLearnTopicForPost, type LearnGroupKey } from "@/lib/learnTaxonomy";
import { excludePartnerPosts } from "@/lib/partners";

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
  if (value === "campfire-101") return "campfire-101";
  if (value === "campfire") return "campfire";
  if (value === "compare") return "compare";
  return null;
};

export async function generateStaticParams() {
  const posts = excludePartnerPosts(await getGhostPosts());
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

  const [navItems, pageData, allPosts] = await Promise.all([
    getNavigationItems(),
    getPublishedPageBySlug("/learn"),
    getGhostPosts()
  ]);
  const posts = excludePartnerPosts(allPosts);
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
