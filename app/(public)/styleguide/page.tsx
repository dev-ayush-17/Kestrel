"use client";

import * as React from "react";
import {
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useToast,
  Skeleton,
  Spinner,
  EmptyState,
  Pagination,
  DateRangePicker,
  GuestPicker,
  GuestValues,
  PriceBreakdown,
  Rating,
  Stepper,
  Breadcrumbs,
} from "@/components/ui";
import {
  Sparkles,
  Calendar,
  Search,
  Mail,
  Heart,
  SlidersHorizontal,
} from "lucide-react";

export default function StyleguidePage() {
  const { toast } = useToast();

  // Interactive component states
  const [currentPage, setCurrentPage] = React.useState(2);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [guestValues, setGuestValues] = React.useState<GuestValues>({
    adults: 2,
    children: 1,
    rooms: 1,
  });
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>({
    from: new Date("2026-11-15T00:00:00Z"),
    to: new Date("2026-11-19T00:00:00Z"),
  });
  const [checkedItem, setCheckedItem] = React.useState(true);
  const [dropdownCheck, setDropdownCheck] = React.useState(true);

  return (
    <div className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="space-y-4 border-b border-brand-border pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Developer", href: "#" },
            { label: "Design System & Styleguide" },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-ink font-normal">
              Kestrel Stays Design System
            </h1>
            <p className="text-sm text-brand-muted mt-1 leading-relaxed">
              Living component inventory and interactive testbed for all 21 UI components, color tokens, and typography.
            </p>
          </div>
          <Badge variant="pine" size="md">
            Phase 1 Complete
          </Badge>
        </div>
      </div>

      {/* 1. Color Tokens & Palette */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            1. Palette & Design Tokens
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Warm editorial hospitality theme. No cold blues, gradients, or glowing neon blobs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="rounded-md border border-brand-border bg-[#FAF7F2] p-4 text-left shadow-2xs">
            <div className="h-8 w-full rounded-sm bg-[#FAF7F2] border border-brand-border mb-2" />
            <p className="text-xs font-semibold text-brand-ink">Canvas Off-White</p>
            <p className="text-[11px] text-brand-muted font-mono">#FAF7F2</p>
          </div>

          <div className="rounded-md border border-brand-border bg-white p-4 text-left shadow-2xs">
            <div className="h-8 w-full rounded-sm bg-white border border-brand-border mb-2" />
            <p className="text-xs font-semibold text-brand-ink">Paper Surface</p>
            <p className="text-[11px] text-brand-muted font-mono">#FFFFFF</p>
          </div>

          <div className="rounded-md border border-brand-border bg-[#1F1B16] text-white p-4 text-left shadow-2xs">
            <div className="h-8 w-full rounded-sm bg-[#1F1B16] border border-white/20 mb-2" />
            <p className="text-xs font-semibold text-white">Ink Text</p>
            <p className="text-[11px] text-white/70 font-mono">#1F1B16</p>
          </div>

          <div className="rounded-md border border-brand-border bg-white p-4 text-left shadow-2xs">
            <div className="h-8 w-full rounded-sm bg-[#6B6459] mb-2" />
            <p className="text-xs font-semibold text-brand-ink">Muted Warm Ink</p>
            <p className="text-[11px] text-brand-muted font-mono">#6B6459</p>
          </div>

          <div className="rounded-md border border-brand-border bg-white p-4 text-left shadow-2xs">
            <div className="h-8 w-full rounded-sm bg-[#1F4D3A] mb-2" />
            <p className="text-xs font-semibold text-brand-ink">Deep Pine (Primary)</p>
            <p className="text-[11px] text-brand-muted font-mono">#1F4D3A</p>
          </div>

          <div className="rounded-md border border-brand-border bg-white p-4 text-left shadow-2xs">
            <div className="h-8 w-full rounded-sm bg-[#C2603A] mb-2" />
            <p className="text-xs font-semibold text-brand-ink">Terracotta (Accent)</p>
            <p className="text-[11px] text-brand-muted font-mono">#C2603A</p>
          </div>
        </div>
      </section>

      {/* 2. Buttons & Variants */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            2. Button System
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Primary, secondary, outline, ghost, terracotta, danger, with sizes and loading states.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Variants
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Pine</Button>
              <Button variant="secondary">Secondary Paper</Button>
              <Button variant="outline">Outline Pine</Button>
              <Button variant="ghost">Ghost Plain</Button>
              <Button variant="terracotta">Terracotta Accent</Button>
              <Button variant="danger">Danger Error</Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Sizes & Icons
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                Small (sm)
              </Button>
              <Button size="md" rightIcon={<Calendar className="h-4 w-4" />}>
                Medium (md)
              </Button>
              <Button size="lg" leftIcon={<Search className="h-4 w-4" />}>
                Large Editorial (lg)
              </Button>
              <Button size="icon" variant="secondary" aria-label="Favorite">
                <Heart className="h-4 w-4 text-terracotta" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              States (Loading & Disabled)
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" isLoading>
                Processing Stay
              </Button>
              <Button variant="secondary" disabled>
                Disabled Action
              </Button>
              <Button variant="outline" disabled>
                Unavailable Room
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Form Controls */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            3. Form Controls & Inputs
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Input, Select, Textarea, and Checkbox with labels, helper texts, and validation errors.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Guest Full Name"
            placeholder="e.g. Eleanor Vance"
            helperText="Enter your official identification name."
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="guest@sanctuary.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error="Please enter a valid email address."
          />

          <Select
            label="Preferred Arrival Window"
            placeholder="Select check-in timeframe"
            options={[
              { value: "early", label: "Early Check-in (12:00 PM – 2:00 PM)" },
              { value: "standard", label: "Standard Arrival (3:00 PM – 7:00 PM)" },
              { value: "late", label: "Late Night Arrival (After 8:00 PM)" },
            ]}
          />

          <div className="space-y-4">
            <p className="block text-xs font-medium uppercase tracking-wider text-brand-muted">
              Preferences & Policies
            </p>
            <Checkbox
              checked={checkedItem}
              onCheckedChange={(checked) => setCheckedItem(checked === true)}
              label="Complimentary Daily Breakfast Service"
              description="Artisdisanal sourdough, local preserves, and hand-brewed coffees."
            />
            <Checkbox
              label="I accept the boutique cancellation terms"
              description="Free cancellation up to 48 hours prior to 3:00 PM check-in."
              error="You must accept the terms before booking."
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Special Stay Requests & Dietary Notes"
              placeholder="Quiet high floor, hypoallergenic pillows, or celebratory champagne on arrival..."
              helperText="Our property concierge will review all requests prior to your arrival."
            />
          </div>
        </div>
      </section>

      {/* 4. Badges, Ratings, and Statuses */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            4. Badges, Ratings & Status Indicators
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Consistent visual status indicators for bookings, room tiers, and customer ratings.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Badge Tones
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Badge variant="default">Default Neutral</Badge>
              <Badge variant="pine">Verified Heritage</Badge>
              <Badge variant="terracotta">Member Price</Badge>
              <Badge variant="success">Confirmed Stay</Badge>
              <Badge variant="warning">Pending Review</Badge>
              <Badge variant="error">Cancelled</Badge>
              <Badge variant="outline">Boutique Hotel</Badge>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Ratings
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Rating score={4.9} reviewCount={128} size="sm" />
              <Rating score={4.8} reviewCount={340} size="md" />
              <Rating score={5.0} reviewCount={42} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Date Picker, Guest Picker & Price Breakdown */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            5. Hospitality Pickers & Price Calculation
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Live interactive date range selector, room guests counter, and integer-cents price breakdown.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Stay Dates</CardTitle>
              <CardDescription>Select arrival & departure</CardDescription>
            </CardHeader>
            <CardContent>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                label="Check-In & Check-Out"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guests & Rooms</CardTitle>
              <CardDescription>Party size configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <GuestPicker
                value={guestValues}
                onChange={setGuestValues}
                label="Occupancy"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
              <CardDescription>Calculated in integer cents</CardDescription>
            </CardHeader>
            <CardContent>
              <PriceBreakdown
                nightlyRateCents={32000} // $320.00
                nights={4}
                cleaningFeeCents={4500} // $45.00
                discountCents={2500} // $25.00
                detailed
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Tabs, Dropdown & Dialogs */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            6. Tabs, Dropdowns & Modals
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Accessible Radix UI dialog, dropdown menu, and tabs primitives.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface space-y-6">
          {/* Tabs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Editorial Tabs
            </p>
            <Tabs defaultValue="overview">
              <TabsList variant="underline">
                <TabsTrigger value="overview">Overview & Architecture</TabsTrigger>
                <TabsTrigger value="rooms">Available Rooms (4)</TabsTrigger>
                <TabsTrigger value="reviews">Guest Reviews (98)</TabsTrigger>
                <TabsTrigger value="policies">House Policies</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="text-sm text-brand-muted leading-relaxed">
                Tucked into the mist-veiled cedar forests of Kyoto, this 18th-century machiya sanctuary has been thoughtfully reimagined with minimalist timber craftsmanship, private mineral onsen baths, and seasonal kaiseki breakfast service.
              </TabsContent>
              <TabsContent value="rooms" className="text-sm text-brand-muted">
                Displaying 4 signature suites with custom tatami mats and king-sized natural latex mattresses.
              </TabsContent>
              <TabsContent value="reviews" className="text-sm text-brand-muted">
                98 verified guest reviews with an aggregate hospitality rating of 4.9 out of 5 stars.
              </TabsContent>
              <TabsContent value="policies" className="text-sm text-brand-muted">
                Check-in from 3:00 PM. Check-out until 11:00 AM. Smoke-free sanctuary.
              </TabsContent>
            </Tabs>
          </div>

          {/* Interactive Modal & Dropdown */}
          <div className="pt-6 border-t border-brand-border flex flex-wrap gap-4 items-center">
            {/* Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="primary">Launch Reservation Modal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Cancellation</DialogTitle>
                  <DialogDescription>
                    Are you sure you wish to cancel reservation #KS-8921 for the Cedar Pavilion Suite?
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2 text-sm text-brand-ink">
                  <p className="text-xs text-brand-muted bg-brand-surface-subtle p-3 rounded-md border border-brand-border">
                    Eligible for a 100% full refund ($1,280.00 USD) credited back to your original payment method within 3 business days.
                  </p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Keep Stay</Button>
                  </DialogClose>
                  <Button variant="danger">Cancel Reservation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" rightIcon={<SlidersHorizontal className="h-4 w-4" />}>
                  Filter Options Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Property Amenities</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={dropdownCheck}
                  onCheckedChange={setDropdownCheck}
                >
                  Onsen / Hot Springs
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={false}>
                  Complimentary Breakfast
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={true}>
                  Free Cancellation
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-pine font-medium">
                  Reset All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toast Triggers */}
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Hotel Saved",
                  description: "Cedar Forest Machiya added to your saved sanctuaries.",
                  variant: "success",
                })
              }
            >
              Trigger Success Toast
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Availability Warning",
                  description: "Only 1 room remaining for your selected dates.",
                  variant: "warning",
                })
              }
            >
              Trigger Warning Toast
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Stepper, Pagination & Feedback States */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            7. Navigation Stepper, Pagination & Feedback
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Multi-step booking progress bar, paginator, loading skeletons, and empty state.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-brand-border bg-brand-surface space-y-8">
          {/* Stepper */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
              Booking Stepper
            </p>
            <Stepper
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              steps={[
                { id: 1, label: "Review Stay", description: "Dates & room" },
                { id: 2, label: "Guest Details", description: "Contact info" },
                { id: 3, label: "Payment", description: "Demo card" },
                { id: 4, label: "Confirmation", description: "Booking ref" },
              ]}
            />
          </div>

          {/* Pagination */}
          <div className="pt-4 border-t border-brand-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
              Pagination Control
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={8}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Skeletons & Spinners */}
          <div className="pt-4 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                Loading Skeletons
              </p>
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                Spinners
              </p>
              <div className="flex items-center gap-6 pt-2">
                <Spinner size="sm" variant="pine" />
                <Spinner size="md" variant="pine" />
                <Spinner size="lg" variant="terracotta" />
                <Spinner size="md" variant="muted" />
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="pt-4 border-t border-brand-border">
            <EmptyState
              icon={<Search className="h-5 w-5 text-pine" />}
              title="No Sanctuaries Found"
              description="No hotels matched your selected dates and filter preferences. Try adjusting your dates or expanding your search radius."
              actionLabel="Clear All Search Filters"
              onAction={() => alert("Search filters cleared")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
