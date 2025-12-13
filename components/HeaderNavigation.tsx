"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { NavigationItemRecord } from "@/lib/admin/navigation";

type HeaderNavigationProps = {
  items: NavigationItemRecord[];
};

export function HeaderNavigation({ items }: HeaderNavigationProps) {
  const headerItems = items.filter((item) => item.showInHeader !== false);
  const topLevel = headerItems.filter((item) => !item.parentId);
  const childrenByParent = headerItems
    .filter((item) => item.parentId)
    .reduce<Record<string, NavigationItemRecord[]>>((acc, item) => {
      const key = item.parentId as string;
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    }, {});
  const [isOpen, setIsOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
    setActiveParentId(null);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveParentId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const updateMatch = () => setIsDesktop(mq.matches);
    updateMatch();
    mq.addEventListener("change", updateMatch);
    return () => mq.removeEventListener("change", updateMatch);
  }, []);

  const handleParentToggle = (parentId: string) => {
    if (isDesktop) {
      setActiveParentId((prev) => (prev === parentId ? null : parentId));
    } else {
      setExpandedParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setExpandedParents({});
      setActiveParentId(null);
    }
  }, [isOpen]);

  const renderNavLink = (item: NavigationItemRecord) => {
    const isExternal = item.isExternal || /^https?:\/\//i.test(item.href);
    const rel = isExternal ? "noreferrer noopener" : undefined;
    const target = isExternal ? "_blank" : undefined;
    const content = (
      <span className="nav-link-content">
        {item.icon ? <img className="nav-link-icon" src={item.icon} alt="" aria-hidden /> : null}
        <span>{item.label}</span>
      </span>
    );

    return (
      <a key={item.id} className="nav-link-item" href={item.href} target={target} rel={rel}>
        {content}
      </a>
    );
  };

  const renderChildLinks = (parentId: string) => {
    const children = childrenByParent[parentId] ?? [];
    return children.map((child) => renderNavLink(child));
  };

  return (
    <div data-header-nav>
      <nav data-nav-links data-open={isOpen} aria-label="Primary navigation">
        {topLevel.map((item) => {
          const hasChildren = (childrenByParent[item.id] ?? []).length > 0;
          if (!hasChildren) {
            return renderNavLink(item);
          }

          const isExpanded = isDesktop ? activeParentId === item.id : expandedParents[item.id];

          return (
            <div key={item.id} className="nav-parent">
              <button
                type="button"
                className="nav-parent-trigger"
                onClick={() => handleParentToggle(item.id)}
                aria-haspopup="true"
                aria-expanded={isExpanded}
              >
                <span className="nav-link-content">
                  {item.icon ? <img className="nav-link-icon" src={item.icon} alt="" aria-hidden /> : null}
                  <span>{item.label}</span>
                </span>
                <svg
                  aria-hidden
                  className={`nav-chevron ${isExpanded ? "open" : ""}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  role="img"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </button>
              {!isDesktop && isExpanded ? <div className="nav-children">{renderChildLinks(item.id)}</div> : null}
              {isDesktop && isExpanded ? <div className="nav-parent-panel">{renderChildLinks(item.id)}</div> : null}
            </div>
          );
        })}
      </nav>
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        data-menu-toggle
        data-open={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            role="img"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            role="img"
            aria-hidden
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>
    </div>
  );
}
