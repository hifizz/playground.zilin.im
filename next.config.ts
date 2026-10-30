import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  async rewrites() {
    return [
      // 静态页面：public/harness-exploded-view/index.html
      {
        source: "/harness-exploded-view",
        destination: "/harness-exploded-view/index.html",
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "meta" }],
    ],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
