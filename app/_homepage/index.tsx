import { Hero } from "./hero";
import { DemosGrid } from "./demos-grid";
import { demos } from "./demos";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 font-sans">
      <Hero demoCount={demos.length} />
      <DemosGrid />
      <footer className="border-t border-neutral-700/50 px-6 py-5 sm:px-10">
        <p className="text-xs text-neutral-600">zilin · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
