import { Inter, Newsreader } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-article-sans",
  axes: ["opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-article-serif",
  style: ["italic"],
  axes: ["opsz"],
});

export const articleFontClass = `${inter.variable} ${newsreader.variable}`;
