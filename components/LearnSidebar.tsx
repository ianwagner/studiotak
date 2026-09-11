"use client";

import Link from "next/link";
import { ChevronDown, GraduationCap, LibraryBig, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { GhostPost } from "@/lib/ghost";
import {
  getLearnGroupForPost,
  getLearnDisplayTitle,
  getLearnTopicForPost,
  LEARN_GROUPS,
  postMatchesLearnSearch,
  type LearnGroupKey
} from "@/lib/learnTaxonomy";
import { getAvailableLearnSeries } from "@/lib/learnSeries";

type LearnSidebarProps = {
  posts: GhostPost[];
  activeGroup?: LearnGroupKey | "all";
  activeTopic?: string | null;
  currentPostSlug?: string;
  currentSeriesSlug?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  onSelectTopic?: (group: LearnGroupKey, topic: string) => void;
};

export function LearnSidebar({
  posts,
  activeGroup,
  activeTopic,
  currentPostSlug,
  currentSeriesSlug,
  query,
  onQueryChange,
  onSelectTopic
}: LearnSidebarProps) {
  const [localQuery, setLocalQuery] = useState("");
  const searchQuery = query ?? localQuery;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const updateQuery = onQueryChange ?? setLocalQuery;
  const currentPost = currentPostSlug ? posts.find((post) => post.slug === currentPostSlug) : undefined;
  const currentGroup = currentPost ? getLearnGroupForPost(currentPost) : undefined;
  const currentTopic = currentPost && currentGroup ? getLearnTopicForPost(currentPost, currentGroup) : undefined;
  const availableSeries = getAvailableLearnSeries(posts);
  const visibleGroups = LEARN_GROUPS.filter(
    (group) => posts.some((post) => getLearnGroupForPost(post) === group.key) || (group.key === "campfire" && availableSeries.length)
  );

  const postsByGroup = useMemo(
    () =>
      LEARN_GROUPS.reduce<Record<LearnGroupKey, GhostPost[]>>(
        (groups, group) => {
          groups[group.key] = posts.filter(
            (post) => getLearnGroupForPost(post) === group.key && postMatchesLearnSearch(post, normalizedQuery)
          );
          return groups;
        },
        { learn: [], campfire: [], compare: [] }
      ),
    [posts, normalizedQuery]
  );

  const topicsByGroup = useMemo(
    () =>
      LEARN_GROUPS.reduce<Record<LearnGroupKey, string[]>>(
        (groups, group) => {
          groups[group.key] = Array.from(new Set(postsByGroup[group.key].map((post) => getLearnTopicForPost(post, group.key)))).sort(
            (a, b) => (a < b ? -1 : a > b ? 1 : 0)
          );
          return groups;
        },
        { learn: [], campfire: [], compare: [] }
      ),
    [postsByGroup]
  );

  return (
    <aside className="learn-library-sidebar">
      <label className="learn-sidebar-search" htmlFor="learn-sidebar-search">
        <span className="visually-hidden">Search Learn guides</span>
        <Search aria-hidden="true" size={16} strokeWidth={1.8} />
        <input
          id="learn-sidebar-search"
          type="search"
          value={searchQuery}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search guides..."
        />
      </label>
      <nav className="learn-collection-nav" aria-label="Learn collections">
        {visibleGroups.map((group) => {
          const anchor = group.key === "learn" ? "learn" : group.key === "campfire" ? "references" : "compare";
          return (
            <div className="learn-sidebar-collection" key={group.key}>
              <Link
                className="learn-sidebar-collection-heading"
                href={`/learn#${anchor}`}
                onClick={() => updateQuery("")}
              >
                {group.key === "campfire" ? (
                  <LibraryBig aria-hidden="true" size={17} strokeWidth={1.8} />
                ) : (
                  <GraduationCap aria-hidden="true" size={17} strokeWidth={1.8} />
                )}
                {group.title}
              </Link>
            {group.key === "campfire" && availableSeries.length ? (
              <div className="learn-sidebar-series-list">
                {availableSeries.map((series) => (
                  <Link
                    className={`learn-sidebar-series-link ${currentSeriesSlug === series.slug ? "is-current" : ""}`}
                    href={`/learn/series/${series.slug}`}
                    key={series.slug}
                  >
                    <span>{series.title}</span>
                  </Link>
                ))}
              </div>
            ) : null}
            {group.key === "compare" ? (
              <div className="learn-sidebar-topic-articles">
                {postsByGroup.compare.map((post) => (
                  <Link
                    key={post.id}
                    href={`/learn/${post.slug}`}
                    className={`learn-sidebar-article ${currentPostSlug === post.slug ? "is-current" : ""}`}
                  >
                    {getLearnDisplayTitle(post)}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="learn-sidebar-topics">
                {topicsByGroup[group.key].map((topic) => (
                  <details
                    className={`learn-sidebar-topic ${activeGroup === group.key && activeTopic === topic ? "is-active" : ""}`}
                    key={topic}
                    open={currentGroup === group.key && currentTopic === topic ? true : undefined}
                  >
                    <summary onClick={() => onSelectTopic?.(group.key, topic)}>
                      <span>{topic}</span>
                      <ChevronDown aria-hidden="true" size={14} strokeWidth={1.8} />
                    </summary>
                    <div className="learn-sidebar-topic-articles">
                      {postsByGroup[group.key]
                        .filter((post) => getLearnTopicForPost(post, group.key) === topic)
                        .map((post) => (
                          <Link
                            key={post.id}
                            href={`/learn/${post.slug}`}
                            className={`learn-sidebar-article ${currentPostSlug === post.slug ? "is-current" : ""}`}
                          >
                            {getLearnDisplayTitle(post)}
                          </Link>
                        ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
