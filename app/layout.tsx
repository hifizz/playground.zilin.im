import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "playground.zilin.im",
  description: "Interactive UI demos — Framer Motion, Tailwind CSS, React 19",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/*
          Two workarounds for upstream reaviz / reablocks defaults:

          1. reaviz emits `mask=""` (empty attribute) on every Bar / Area
             <rect>. Chromium treats an empty mask attribute as an invalid
             resource reference and hides the element entirely — so without
             this override every BarChart and StackedBarChart renders blank.

          2. ChartTooltip's default theme applies `bg-panel-accent
             text-text-primary`. Those classes resolve via reablocks CSS
             variables we don't import globally, so we declare the vars
             and matching utility selectors here. Without them every
             reaviz tooltip renders as transparent floating text.
        */}
        <style>{`
          svg [mask=""] { mask: none !important; }
          /*
            Reaviz tooltip vars. Reaviz's tooltip uses its bundled CSS module
            ._base_b22et_1 which sets background-color: var(--tooltip-background)
            and color: var(--tooltip-color). Those vars are only declared inside
            the chart container (._container_1u3dt_1), but the tooltip is
            rendered into a portal under <body> — so it escapes the container
            and the vars resolve to empty → transparent panel + invisible text.
            Re-declaring at :root makes the portal-mounted tooltip pick them up.
          */
          :root {
            --color-tooltip: rgba(0, 5, 11, 0.9);
            --color-on-tooltip: #fff;
            --tooltip-background: var(--color-tooltip);
            --tooltip-color: var(--color-on-tooltip);
            --tooltip-border-radius: 5px;
            --tooltip-spacing: 5px;
            /* reablocks tooltip fallback (in case any path uses these) */
            --panel-accent: #242433;
            --text-primary: #f7f7fa;
          }
          .bg-panel-accent { background-color: var(--panel-accent); }
          .text-text-primary { color: var(--text-primary); }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
