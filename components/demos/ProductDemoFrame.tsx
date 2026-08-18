import type { PropsWithChildren } from "react";

type ProductDemoFrameProps = PropsWithChildren<{
  className?: string;
}>;

/** Shared border and elevation treatment for product demonstration surfaces. */
export function ProductDemoFrame({ children, className }: ProductDemoFrameProps) {
  return <div className={["product-demo-frame", className].filter(Boolean).join(" ")}>{children}</div>;
}
