import * as React from "react";

/**
 * React's <ViewTransition>, which the App Router's React build ships but the
 * installed type definitions don't declare yet. Two elements with the same
 * `name` on the old and new page morph into each other when you navigate
 * (a story's photo growing from the homepage into the article). Where the
 * component or the browser feature is missing, children render as normal.
 */

interface ViewTransitionProps {
  /** Shared identity across pages. Must be unique on a page. */
  name?: string;
  /** Class for the shared-element morph (see ::view-transition-group(.morph) in globals.css). */
  share?: string;
  /** Class for every other kind of transition; "none" keeps a named element still unless it morphs. */
  default?: string;
  enter?: string;
  exit?: string;
  update?: string;
  children: React.ReactNode;
}

const Impl = (React as unknown as { ViewTransition?: React.ComponentType<ViewTransitionProps>; unstable_ViewTransition?: React.ComponentType<ViewTransitionProps> })
  .ViewTransition ??
  (React as unknown as { unstable_ViewTransition?: React.ComponentType<ViewTransitionProps> }).unstable_ViewTransition;

export default function ViewTransition({ children, ...props }: ViewTransitionProps) {
  return Impl ? <Impl {...props}>{children}</Impl> : <>{children}</>;
}

/** The shared name for a story's lead photo, on cards and on the article page. */
export function storyPhotoName(slug: string) {
  return `story-photo-${slug.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
