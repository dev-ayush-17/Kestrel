"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";

export default function FAQPage() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "How does Kestrel Stays select and verify properties?",
      a: "Every sanctuary in the Kestrel anthology is hand-selected and evaluated in person by our curatorial team. We assess acoustic insulation, architectural integrity, natural daylighting, linen and bed quality, and host hospitality standards. We do not accept mass-market listings or hotel aggregations.",
    },
    {
      q: "How do direct reservations and pricing work?",
      a: "When you book through Kestrel Stays, your reservation is written directly to our PostgreSQL database with pessimistic row-level locking. This prevents double-bookings. All pricing is computed deterministically in minor currency units (cents), with clear line-item breakdowns of nightly rates, local taxes, and cleaning fees with zero hidden middleman fees.",
    },
    {
      q: "Can I modify my stay dates after booking?",
      a: "Yes. From your 'My Bookings' dashboard, you can reschedule dates for any confirmed stay. The system performs an atomic inventory overlap check and recalculates any rate differences in real time.",
    },
    {
      q: "What is your standard cancellation policy?",
      a: "Each property publishes its exact policy on the hotel detail page. Most properties in our collection offer full refunds up to 48 hours prior to check-in. Cancellations can be executed with a single click in your customer account portal.",
    },
    {
      q: "Are the guest reviews verified?",
      a: "Yes. Reviews on Kestrel Stays can only be submitted by guests with confirmed historical stays. Furthermore, all reviews undergo administrative moderation to prevent spam while preserving honest guest feedback.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-pine">
          Support & Clarity
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-brand-ink mt-2">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-brand-muted mt-3 font-light leading-relaxed">
          Everything you need to know about our sanctuary anthology, booking engine, and cancellation standards.
        </p>
      </div>

      <div className="space-y-4 mb-16">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <span className="font-serif text-lg font-medium text-brand-ink">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-brand-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-pine" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-0 text-sm text-brand-muted leading-relaxed font-light border-t border-brand-border/40 mt-1">
                  <p className="pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-8 rounded-xl bg-brand-surface border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="font-serif text-xl font-normal text-brand-ink">
            Have a question not listed here?
          </h3>
          <p className="text-xs text-brand-muted mt-1 font-light">
            Our concierge team is available around the clock to assist with bespoke requests.
          </p>
        </div>
        <Link href="/contact">
          <Button size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Contact Concierge
          </Button>
        </Link>
      </div>
    </div>
  );
}

