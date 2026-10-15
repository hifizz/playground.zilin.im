import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-ab", axes: ["opsz"] });

export const abFontClass = inter.variable;
