import type { MDXComponents } from "mdx/types";
import { articleMdxComponents } from "@/app/_article/components";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, ...articleMdxComponents };
}
