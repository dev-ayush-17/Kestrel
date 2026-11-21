"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { apiClient } from "@/lib/api/client";
import { Check, Mail, Phone, MapPin, Send, Sparkles } from "lucide-react";

export default function ContactPage() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [responseMsg, setResponseMsg] = React.useState<{ ref: string; note: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; reference_id: string; message: string }>("/contact", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName || "Guest",
          email,
          subject: subject || "General Concierge Inquiry",
          message,
        }),
      });

      setResponseMsg({
        ref: res.reference_id,
        note: res.message,
      });
    } catch (err: any) {
      alert(`Inquiry dispatch failed: ${err.message || "Please check your network connection"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-pine">
          Concierge & Guest Support
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-brand-ink mt-2">
          Connect with Our Curators
        </h1>
        <p className="text-base text-brand-muted mt-3 font-light leading-relaxed">
          Whether you need bespoke travel recommendations, special dietary arrangements, or private estate bookings, our team is at your disposal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Form Box (2 cols) */}
        <div className="md:col-span-2">
          <div className="p-8 rounded-2xl border border-brand-border bg-brand-surface shadow-xs">
            {responseMsg ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-pine-light text-pine flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-brand-ink">
                  Inquiry Dispatched
                </h3>
                <p className="text-xs font-mono text-pine font-semibold">
                  Reference: {responseMsg.ref}
                </p>
                <p className="text-sm text-brand-muted max-w-md mx-auto font-light leading-relaxed">
                  {responseMsg.note}
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => {
                    setResponseMsg(null);
                    setMessage("");
                  }}
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Clara Oswald"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="clara@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Input
                  label="Subject"
                  placeholder="e.g. Private booking or itinerary assistance"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <Textarea
                  label="Your Inquiry or Request"
                  required
                  rows={5}
                  placeholder="Share the details of your requested sanctuary or questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  rightIcon={<Send className="h-4 w-4" />}
                >
                  {loading ? "Dispatching via FastAPI..." : "Send Concierge Inquiry"}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Right Info Box (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-brand-border bg-brand-surface">
            <h4 className="font-serif text-lg font-medium text-brand-ink mb-3">
              Direct Contact
            </h4>
            <div className="space-y-3 text-xs text-brand-muted">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-pine shrink-0" />
                <span>concierge@kestrelstays.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-pine shrink-0" />
                <span>+44 (0) 20 7946 0912</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-pine shrink-0" />
                <span>Anthology House, Edinburgh, UK</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-brand-border bg-brand-surface">
            <h4 className="font-serif text-lg font-medium text-brand-ink mb-2">
              Concierge Hours
            </h4>
            <p className="text-xs text-brand-muted leading-relaxed font-light">
              Our team operates 24/7 across European and North American time zones. Urgent reservation assistance is guaranteed a 4-hour response window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
