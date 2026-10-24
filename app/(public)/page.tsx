import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Compass, Sparkles, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pine/20 bg-pine-light text-pine text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Phase 1 Milestone Complete</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-brand-ink leading-[1.1] mb-6">
          Sanctuaries for the intentional traveler.
        </h1>
        <p className="text-lg text-brand-muted leading-relaxed mb-8 max-w-2xl font-light">
          Kestrel Stays is a curated anthology of independent boutique hotels, historic mountain lodges, and coastal retreats. Built with Next.js App Router, strict TypeScript, custom design tokens, and a decoupled API architecture ready for FastAPI.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/styleguide">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Explore Component Styleguide
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="secondary" size="lg" leftIcon={<Compass className="h-4 w-4" />}>
              Browse Stays Catalog
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-brand-border">
        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface">
          <h3 className="font-serif text-lg font-medium text-brand-ink mb-2">
            Design Tokens & Typography
          </h3>
          <p className="text-sm text-brand-muted leading-relaxed">
            Newsreader serif display paired with Geist sans, warm paper surfaces (#FFFFFF), warm off-white canvas (#FAF7F2), and pine accent (#1F4D3A).
          </p>
        </div>
        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface">
          <h3 className="font-serif text-lg font-medium text-brand-ink mb-2">
            Complete UI Primitives
          </h3>
          <p className="text-sm text-brand-muted leading-relaxed">
            All 21 accessible components in /components/ui (Button, Dialog, Dropdown, Tabs, DateRangePicker, GuestPicker, PriceBreakdown, etc.).
          </p>
        </div>
        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface">
          <h3 className="font-serif text-lg font-medium text-brand-ink mb-2">
            Decoupled Architecture
          </h3>
          <p className="text-sm text-brand-muted leading-relaxed">
            Modular route group layouts for Public, Auth, Customer Account, and Hotel Admin Console.
          </p>
        </div>
      </div>
    </div>
  );
}
