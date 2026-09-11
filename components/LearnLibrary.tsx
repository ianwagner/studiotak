"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { GhostPost } from "@/lib/ghost";
import { LearnSidebar } from "@/components/LearnSidebar";
import { LearnArticleCard } from "@/components/LearnArticleCard";
import { LearnSeriesCard } from "@/components/LearnSeriesCard";
import {
  getLearnGroupForPost,
  getLearnDisplayTitle,
  getLearnTopicForPost,
  LEARN_GROUPS,
  postMatchesLearnSearch,
  type LearnGroupKey
} from "@/lib/learnTaxonomy";
import { getAvailableLearnSeries } from "@/lib/learnSeries";

type LearnLibraryProps = {
  posts: GhostPost[];
  initialGroup?: LearnGroupKey;
  initialTopic?: string;
};

const TOPIC_CARD_IMAGES: Record<string, string> = {
  BFCM: "/learn/BFCM.png",
  "Branded Ads": "/learn/branded-ads.png",
  "Creative Production": "/learn/creative-production.png",
  "Creative Strategy": "/learn/creative-strategy.png",
  "Media Buying": "/learn/media-buying.png",
  Meta: "/learn/meta.png"
};

const getTopicHref = (group: LearnGroupKey, topic: string) =>
  `/learn/topics/${group}/${encodeURIComponent(topic)}`;

const ArticleLink = ({ post }: { post: GhostPost }) => (
  <Link href={`/learn/${post.slug}`} className="learn-library-article">
    <span className="learn-library-article-title">{getLearnDisplayTitle(post)}</span>
    {post.excerpt ? <span className="learn-library-article-excerpt">{post.excerpt}</span> : null}
    <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
  </Link>
);

const TopicCard = ({
  topic,
  href,
  onSelect
}: {
  topic: string;
  href: string;
  onSelect: () => void;
}) => {
  const image = TOPIC_CARD_IMAGES[topic];

  return (
    <Link className={`learn-topic-card${image ? " has-visual" : ""}`} href={href as any} onClick={onSelect}>
      <span className="learn-topic-card-title">{topic}</span>
      {image ? (
        <span className="learn-topic-card-visual" aria-hidden="true">
          <img src={image} alt="" />
        </span>
      ) : null}
      <span className="learn-topic-card-action">
        Explore guides <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
      </span>
    </Link>
  );
};

export function LearnLibrary({ posts, initialGroup, initialTopic }: LearnLibraryProps) {
  const [activeGroup, setActiveGroup] = useState<LearnGroupKey | "all">(initialGroup ?? "all");
  const [activeTopic, setActiveTopic] = useState<string | null>(initialTopic ?? null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const syncTopicFromHash = () => {
      if (!window.location.hash && initialGroup && initialTopic) {
        setActiveGroup(initialGroup);
        setActiveTopic(initialTopic);
        return;
      }

      const params = new URLSearchParams(window.location.hash.slice(1));
      const requestedGroup = params.get("group");
      const group = requestedGroup === "academy" ? "learn" : requestedGroup;
      const topic = params.get("topic");

      if (
        (group === "learn" || group === "campfire" || group === "compare") &&
        topic &&
        posts.some(
          (post) =>
            getLearnGroupForPost(post) === group &&
            getLearnTopicForPost(post, group) === topic
        )
      ) {
        setActiveGroup(group);
        setActiveTopic(topic);
        return;
      }

      setActiveGroup("all");
      setActiveTopic(null);
    };

    syncTopicFromHash();
    window.addEventListener("hashchange", syncTopicFromHash);
    return () => window.removeEventListener("hashchange", syncTopicFromHash);
  }, [posts, initialGroup, initialTopic]);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = Boolean(normalizedQuery);

  const visiblePosts = posts.filter(
    (post) =>
      (activeGroup === "all" || getLearnGroupForPost(post) === activeGroup) &&
      (!activeTopic || getLearnTopicForPost(post, getLearnGroupForPost(post)) === activeTopic) &&
      postMatchesLearnSearch(post, normalizedQuery)
  );
  const activeGroupData = activeGroup === "all" ? null : LEARN_GROUPS.find((group) => group.key === activeGroup) ?? null;
  const activeTopicImage = activeTopic ? TOPIC_CARD_IMAGES[activeTopic] : undefined;
  const availableSeries = getAvailableLearnSeries(posts);
  const matchingSeries = availableSeries.filter((series) =>
    [series.title, series.description, ...series.steps.map((step) => step.title)]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
  // Keep unpublished collections out of the library until they have content.
  const visibleGroups = LEARN_GROUPS.filter(
    (group) => posts.some((post) => getLearnGroupForPost(post) === group.key) || (group.key === "campfire" && availableSeries.length)
  );
  const topicsByGroup = visibleGroups.map((group) => {
    const topics = new Map<string, GhostPost[]>();
    posts
      .filter((post) => getLearnGroupForPost(post) === group.key)
      .forEach((post) => {
        const topic = getLearnTopicForPost(post, group.key);
        topics.set(topic, [...(topics.get(topic) ?? []), post]);
      });
    return {
      ...group,
      topics: Array.from(topics.entries())
        .map(([topic, topicPosts]) => ({ topic, posts: topicPosts }))
        .sort((a, b) => (a.topic < b.topic ? -1 : a.topic > b.topic ? 1 : 0))
    };
  });

  const selectTopic = (group: LearnGroupKey, topic: string) => {
    setActiveGroup(group);
    setActiveTopic(topic);
  };

  return (
    <section className="learn-library" aria-labelledby="learn-title">
      <div className="container learn-library-shell">
        <LearnSidebar
          posts={posts}
          activeGroup={activeGroup}
          activeTopic={activeTopic}
          query={query}
          onQueryChange={setQuery}
          onSelectTopic={selectTopic}
        />

        <div className="learn-library-main">
          <div className="learn-library-hero">
            <h1 id="learn-title">How can we help?</h1>
            <label className="learn-search" htmlFor="learn-main-search">
              <span className="visually-hidden">Search Learn guides</span>
              <Search aria-hidden="true" size={20} strokeWidth={1.8} />
              <input
                id="learn-main-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides..."
              />
            </label>
          </div>

          <div className="learn-library-content">
            {isSearching ? (
              <section className="learn-library-results" aria-live="polite">
                <div className="learn-library-results-heading">
                  <h2>Search results</h2>
                  <p>Showing matches for “{query.trim()}”.</p>
                </div>
                {matchingSeries.length || visiblePosts.length ? (
                  <>
                    {matchingSeries.length ? (
                      <section className="learn-series-search-results" aria-label="Curated guide paths">
                        <div className="learn-series-card-grid">
                          {matchingSeries.map((series) => (
                            <LearnSeriesCard key={series.slug} series={series} />
                          ))}
                        </div>
                      </section>
                    ) : null}
                    {visiblePosts.length ? (
                      <div className="learn-library-results-list">
                        {visiblePosts.map((post) => (
                          <ArticleLink key={post.id} post={post} />
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="learn-library-empty" role="status">
                    <h2>No guides found</h2>
                    <p>Try another search term, or browse a topic from the sidebar.</p>
                  </div>
                )}
              </section>
            ) : activeTopic && activeGroupData ? (
              <section className="learn-topic-view" aria-labelledby="learn-topic-title">
                <div className="learn-topic-view-heading">
                  <button
                    className="learn-topic-back"
                    type="button"
                    onClick={() => {
                      setActiveGroup("all");
                      setActiveTopic(null);
                    }}
                  >
                    <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
                    All topics
                  </button>
                  <div>
                    <div className="learn-topic-view-title">
                      {activeTopicImage ? <img src={activeTopicImage} alt="" aria-hidden="true" /> : null}
                      <h2 id="learn-topic-title">{activeTopic}</h2>
                    </div>
                  </div>
                </div>
                {visiblePosts.length ? (
                  <div className="learn-article-card-grid">
                    {visiblePosts.map((post) => (
                      <LearnArticleCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="learn-library-empty" role="status">
                    <h2>No guides found</h2>
                    <p>Choose another topic to keep exploring.</p>
                  </div>
                )}
              </section>
            ) : (
              <section className="learn-collection-overview" aria-label="Browse Learn topics">
                {topicsByGroup.map((group) => (
                  <section
                    className="learn-collection-overview-section"
                    id={group.key === "learn" ? "learn" : group.key === "campfire" ? "references" : "compare"}
                    key={group.key}
                    aria-labelledby={`learn-collection-${group.key}`}
                  >
                    <div className="learn-collection-overview-heading">
                      <div>
                        <h2 id={`learn-collection-${group.key}`}>{group.title}</h2>
                      </div>
                      {group.description ? <p>{group.description}</p> : null}
                    </div>
                    {group.key === "campfire" && availableSeries.length ? (
                      <div className="learn-series-card-grid">
                        {availableSeries.map((series) => (
                          <LearnSeriesCard key={series.slug} series={series} />
                        ))}
                      </div>
                    ) : null}
                    {group.key === "compare" ? (
                      <div className="learn-article-card-grid" aria-label="Compare articles">
                        {group.topics.flatMap(({ posts }) => posts).map((post) => (
                          <LearnArticleCard key={post.id} post={post} />
                        ))}
                      </div>
                    ) : group.topics.length ? (
                      <div className="learn-topic-card-grid">
                        {group.topics.map(({ topic }) => (
                          <TopicCard
                            key={topic}
                            topic={topic}
                            href={getTopicHref(group.key, topic)}
                            onSelect={() => selectTopic(group.key, topic)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
