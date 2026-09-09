"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { GhostPost } from "@/lib/ghost";
import { LearnSidebar } from "@/components/LearnSidebar";
import {
  getLearnGroupForPost,
  getLearnDisplayTitle,
  getLearnTopicForPost,
  LEARN_GROUPS,
  postMatchesLearnSearch,
  type LearnGroupKey
} from "@/lib/learnTaxonomy";

type LearnLibraryProps = {
  posts: GhostPost[];
};

const ArticleLink = ({ post }: { post: GhostPost }) => (
  <Link href={`/learn/${post.slug}`} className="learn-library-article">
    <span className="learn-library-article-title">{getLearnDisplayTitle(post)}</span>
    {post.excerpt ? <span className="learn-library-article-excerpt">{post.excerpt}</span> : null}
    <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
  </Link>
);

const TopicCard = ({
  topic,
  onSelect
}: {
  topic: string;
  onSelect: () => void;
}) => (
  <button className="learn-topic-card" type="button" onClick={onSelect}>
    <span className="learn-topic-card-title">{topic}</span>
    <span className="learn-topic-card-action">
      Explore guides <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
    </span>
  </button>
);

const ArticleCard = ({ post }: { post: GhostPost }) => (
  <Link href={`/learn/${post.slug}`} className="learn-article-card">
    <span className="learn-article-card-title">{getLearnDisplayTitle(post)}</span>
    {post.excerpt ? <span className="learn-article-card-excerpt">{post.excerpt}</span> : null}
    <span className="learn-article-card-action">
      Read guide <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
    </span>
  </Link>
);

export function LearnLibrary({ posts }: LearnLibraryProps) {
  const [activeGroup, setActiveGroup] = useState<LearnGroupKey | "all">("all");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const syncTopicFromHash = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const group = params.get("group");
      const topic = params.get("topic");

      if (
        (group === "academy" || group === "campfire") &&
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
  }, [posts]);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = Boolean(normalizedQuery);

  const visiblePosts = posts.filter(
    (post) =>
      (activeGroup === "all" || getLearnGroupForPost(post) === activeGroup) &&
      (!activeTopic || getLearnTopicForPost(post, getLearnGroupForPost(post)) === activeTopic) &&
      postMatchesLearnSearch(post, normalizedQuery)
  );
  const activeGroupData = activeGroup === "all" ? null : LEARN_GROUPS.find((group) => group.key === activeGroup) ?? null;
  const topicsByGroup = LEARN_GROUPS.map((group) => {
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
                {visiblePosts.length ? (
                  <div className="learn-library-results-list">
                    {visiblePosts.map((post) => (
                      <ArticleLink key={post.id} post={post} />
                    ))}
                  </div>
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
                    <p className="learn-library-eyebrow">{activeGroupData.title}</p>
                    <h2 id="learn-topic-title">{activeTopic}</h2>
                    <p>Browse guides in this topic.</p>
                  </div>
                </div>
                {visiblePosts.length ? (
                  <div className="learn-article-card-grid">
                    {visiblePosts.map((post) => (
                      <ArticleCard key={post.id} post={post} />
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
                  <section className="learn-collection-overview-section" key={group.key} aria-labelledby={`learn-collection-${group.key}`}>
                    <div className="learn-collection-overview-heading">
                      <div>
                        <span className={`learn-collection-icon ${group.key}`}>
                          <BookOpen aria-hidden="true" size={20} strokeWidth={1.7} />
                        </span>
                        <h2 id={`learn-collection-${group.key}`}>{group.title}</h2>
                      </div>
                      {group.description ? <p>{group.description}</p> : null}
                    </div>
                    {group.topics.length ? (
                      <div className="learn-topic-card-grid">
                        {group.topics.map(({ topic }) => (
                          <TopicCard
                            key={topic}
                            topic={topic}
                            onSelect={() => selectTopic(group.key, topic)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="learn-collection-empty">Reference guides will appear here as they’re published.</p>
                    )}
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
