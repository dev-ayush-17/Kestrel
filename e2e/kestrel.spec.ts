import { test, expect } from "@playwright/test";

test.describe("Kestrel Stays — Full-Stack Verification Suite", () => {
  test("1. Home page renders brand identity, featured stays, and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Kestrel Stays/);

    // Verify Brand display
    const heroHeading = page.locator("h1");
    await expect(heroHeading).toContainText("Sanctuaries for the intentional traveler");

    // Verify Navigation Links
    await expect(page.locator("nav").getByRole("link", { name: "Hotels" })).toBeVisible();
    await expect(page.locator("nav").getByRole("link", { name: "Destinations" })).toBeVisible();
    await expect(page.locator("nav").getByRole("link", { name: "About" })).toBeVisible();
    await expect(page.locator("nav").getByRole("link", { name: "FAQ" })).toBeVisible();
    await expect(page.locator("nav").getByRole("link", { name: "Contact" })).toBeVisible();

    // Verify Featured Sanctuaries section
    await expect(page.getByRole("heading", { name: "Featured Sanctuaries" })).toBeVisible();
  });

  test("2. Public Search page renders catalog and filters", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("h1")).toContainText("Explore Sanctuaries");

    // Check search input exists
    const searchInput = page.getByPlaceholder("Search destination or city...");
    await expect(searchInput).toBeVisible();

    // Verify at least one hotel card is present
    const hotelCards = page.locator("a[href^='/hotels/']");
    await expect(hotelCards.first()).toBeVisible();
  });

  test("3. Destinations anthology page loads regional collections", async ({ page }) => {
    await page.goto("/destinations");
    await expect(page.locator("h1")).toContainText("Curated Destinations");

    // Verify regional cards
    const destCards = page.locator("a[href*='/search?city=']");
    await expect(destCards.first()).toBeVisible();
  });

  test("4. About, FAQ, and Concierge Support pages render properly", async ({ page }) => {
    // About
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("Travel as an act of attention");

    // FAQ
    await page.goto("/faq");
    await expect(page.locator("h1")).toContainText("Frequently Asked Questions");

    // Contact
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("Connect with Our Curators");
    await expect(page.getByRole("button", { name: /Send Concierge Inquiry/i })).toBeVisible();
  });

  test("5. Authentication and Customer Account Portal flow", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome to Kestrel" })).toBeVisible();

    // Click Clara demo quick login
    await page.getByRole("button", { name: "Clara (Guest)" }).click();
    await page.getByRole("button", { name: "Sign In to Kestrel" }).click();

    // Wait for redirect to account
    await page.waitForURL("**/account", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Welcome back");

    // Check Bookings subpage
    await page.goto("/account/bookings");
    await expect(page.locator("h1")).toContainText("My Reservations");

    // Check Profile subpage
    await page.goto("/account/profile");
    await expect(page.locator("h1")).toContainText("Profile & Security");
  });

  test("6. Administrative Console and Analytics Dashboard", async ({ page }) => {
    // Log in as Administrator
    await page.goto("/login");
    await page.getByRole("button", { name: "Alexander (Admin)" }).click();
    await page.getByRole("button", { name: "Sign In to Kestrel" }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });

    // Verify Executive Overview
    await expect(page.locator("h1")).toContainText("Executive Overview");

    // Verify KPI metrics cards
    await expect(page.getByText("Gross Revenue", { exact: true })).toBeVisible();
    await expect(page.getByText("Occupancy Rate")).toBeVisible();
    await expect(page.getByText("Average Daily Rate (ADR)")).toBeVisible();
    await expect(page.getByText("Confirmed Bookings")).toBeVisible();

    // Verify Admin Bookings management
    await page.goto("/admin/bookings");
    await expect(page.locator("h1")).toContainText("Reservation Management");

    // Verify Admin Hotel Catalog
    await page.goto("/admin/hotels");
    await expect(page.locator("h1")).toContainText("Hotels Catalog");

    // Verify Admin Room Inventory
    await page.goto("/admin/rooms");
    await expect(page.locator("h1")).toContainText("Suites & Room Inventory");

    // Verify Admin User Management
    await page.goto("/admin/users");
    await expect(page.locator("h1")).toContainText("User Management");

    // Verify Admin Review Moderation
    await page.goto("/admin/reviews");
    await expect(page.locator("h1")).toContainText("Review Moderation Queue");
  });
});


  test("7. Hotel detail page and room suite selection", async ({ page }) => {
    await page.goto("/search");
    const firstHotel = page.locator("a[href^='/hotels/']").first();
    await firstHotel.click();

    // Verify hotel detail view
    await expect(page.getByText("About This Sanctuary")).toBeVisible();
    await expect(page.getByText("Available Suites")).toBeVisible();
    await expect(page.getByText("Reserve Your Stay")).toBeVisible();
  });
