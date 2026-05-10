import Link from "next/link";
import type { ReactNode } from "react";

import "./article.css";
import { articleFontClass } from "./fonts";
import { ArticleToc } from "./article-toc";

export type ArticleMeta = {
  title: string;
  date?: string;
  tagline?: ReactNode;
  back?: { href: string; label?: string };
  toc?: { label?: string } | false;
};

export function ArticleLayout({
  meta,
  children,
}: {
  meta: ArticleMeta;
  children: ReactNode;
}) {
  const back = meta.back ?? { href: "/", label: "← /playground" };
  const tocCfg = meta.toc === false ? null : meta.toc ?? {};

  return (
    <div className={`${articleFontClass} art-root`}>
      <Link href={back.href} className="art-back" aria-label="Back">
        {back.label ?? "← back"}
      </Link>

      {tocCfg && <ArticleToc label={tocCfg.label} />}

      <main className="art-container">
        <header className="art-header">
          {meta.date && <span className="art-meta">{meta.date}</span>}
          <h1>{meta.title}</h1>
          {meta.tagline && <p className="art-tagline">{meta.tagline}</p>}
        </header>

        <article className="art-article">{children}</article>
      </main>
    </div>
  );
}
