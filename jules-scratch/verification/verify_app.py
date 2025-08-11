from playwright.sync_api import sync_playwright, Page, expect

def verify_dashboard(page: Page):
    """
    This script verifies that the LOTO management dashboard loads correctly.
    """
    # 1. Arrange: Go to the application's URL.
    page.goto("http://localhost:5173")

    # 2. Assert: Wait for the main heading to be visible.
    heading = page.get_by_role("heading", name="LOTO Management")
    expect(heading).to_be_visible()

    # 3. Screenshot: Capture the dashboard for visual verification.
    page.screenshot(path="jules-scratch/verification/loto-dashboard.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_dashboard(page)
    browser.close()
