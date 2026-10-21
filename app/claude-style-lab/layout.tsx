import "./style-lab.css";

export default function ClaudeStyleLabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="csl-root">{children}</div>;
}
