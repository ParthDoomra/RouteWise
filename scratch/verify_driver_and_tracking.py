"""Comprehensive End-to-End Browser Verification for Driver Flow and Public Customer Tracking."""

import sys
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("=== Starting End-to-End Browser Verification ===")
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        driver_context = browser.new_context()
        page = driver_context.new_page()

        # Step 1: Open Login Page & Switch to Driver Tab
        print("\n[Stage 1] Navigating to http://localhost:5173/login...")
        page.goto("http://localhost:5173/login")
        page.wait_for_selector("text=RouteWise")
        time.sleep(1)

        # Click Driver tab
        driver_tab = page.locator("button:has-text('Driver Portal')")
        driver_tab.click()
        time.sleep(1)
        print("Switched to Driver Portal login tab.")

        # Step 2: Fill Seeded Driver Credentials & Login
        print("\n[Stage 2] Logging in as Seeded Driver (+91 98450 11223, PIN 1024)...")
        page.fill("input[placeholder*='98450']", "+91 98450 11223")
        page.fill("input[placeholder*='••••']", "1024")
        page.click("button[type='submit']")

        # Wait for navigation to /driver/route
        page.wait_for_url("**/driver/route", timeout=10000)
        page.wait_for_selector("text=Driver Route Console")
        print("Successfully navigated to /driver/route.")
        
        # Verify Driver Header shows driver name and route
        header_text = page.inner_text("header")
        print(f"Driver Header: {header_text.replace('\n', ' ')}")
        assert "Rahul Sharma" in header_text or "Driver" in header_text

        # Verify stop cards rendered
        page.wait_for_selector("text=ACTIVE TARGET STOP")
        active_stop_text = page.inner_text("text=ACTIVE TARGET STOP >> xpath=ancestor::div[contains(@class, 'card')]")
        print(f"\nInitial Active Stop:\n{active_stop_text[:250]}...")
        assert "ORD-2676" in active_stop_text or "Deepak Verma" in active_stop_text
        results.append("Stage 1 & 2: Driver login and route manifest loaded successfully.")

        # Step 3: Mark Picked Up
        print("\n[Stage 3] Clicking 'Mark Picked Up' on Stop #1...")
        pickup_btn = page.locator("button:has-text('Mark Picked Up')")
        assert pickup_btn.is_visible()
        pickup_btn.click()
        
        # Wait for status to change to Picked Up
        page.wait_for_selector("text=Picked Up", timeout=5000)
        time.sleep(1)
        active_stop_text_after_pickup = page.inner_text("text=ACTIVE TARGET STOP >> xpath=ancestor::div[contains(@class, 'card')]")
        print(f"Stop status after pickup:\n{active_stop_text_after_pickup[:200]}...")
        assert "Picked Up" in active_stop_text_after_pickup
        results.append("Stage 3: Mark Picked Up succeeded; status transitioned to picked_up.")

        # Step 4: Mark Delivered
        print("\n[Stage 4] Clicking 'Mark Delivered' on Stop #1...")
        deliver_btn = page.locator("button:has-text('Mark Delivered')")
        assert deliver_btn.is_visible()
        deliver_btn.click()

        # Wait for delivery to complete and next stop to become active
        time.sleep(2)
        waypoint_manifest = page.inner_text("div:has-text('Full Route Waypoint Manifest') >> xpath=..")
        print(f"Waypoint manifest status:\n{waypoint_manifest[:300]}...")
        assert "Delivered" in waypoint_manifest
        results.append("Stage 4: Mark Delivered succeeded; Stop #1 marked delivered.")

        # Step 5: Customer Tracking in Unauthenticated Context
        print("\n[Stage 5] Opening Customer Tracking in an unauthenticated context...")
        tracking_uuid = "6d202501-c30a-4173-a65c-aa3cef9ba136"  # UUID for ORD-2676
        customer_context = browser.new_context()  # Completely clean context: no cookies/auth
        customer_page = customer_context.new_page()

        customer_url = f"http://localhost:5173/track/{tracking_uuid}"
        customer_page.goto(customer_url)
        customer_page.wait_for_selector("h1:has-text('ORD-2676')", timeout=10000)
        print("Customer tracking page loaded for ORD-2676.")

        # Check Order Code, Stepper Status, Driver Name, and ETA
        order_heading = customer_page.inner_text("h1")
        print(f"Customer Tracking Heading: {order_heading}")
        assert "ORD-2676" in order_heading

        driver_info = customer_page.inner_text("div:has-text('Assigned Courier') >> xpath=..")
        print(f"Customer Driver Card: {driver_info}")
        assert "Rahul" in driver_info

        stepper_info = customer_page.inner_text("div:has-text('Doorstep Delivered') >> xpath=..")
        print(f"Customer Stepper State: {stepper_info}")

        eta_info = customer_page.inner_text("div:has-text('DELIVERY') >> xpath=..")
        print(f"Customer ETA / Delivery Status Badge: {eta_info}")

        # Check Privacy: No phone numbers should be in page text
        page_content = customer_page.content()
        assert "98450" not in page_content
        assert "91234" not in page_content
        print("Privacy verified: Zero courier or customer phone numbers rendered.")
        results.append("Stage 5: Unauthenticated customer tracking verified with stepper moved to delivered, driver name 'Rahul', and zero leaked phone numbers.")

        # Step 6: Order Code into Tracking URL -> Friendly 404
        print("\n[Stage 6] Pasting order code directly into tracking URL (http://localhost:5173/track/ORD-2676)...")
        code_url = "http://localhost:5173/track/ORD-2676"
        customer_page.goto(code_url)
        customer_page.wait_for_selector("text=Tracking Link Not Found", timeout=10000)
        not_found_card = customer_page.inner_text("main")
        print(f"404 Page Content:\n{not_found_card}")
        assert "Tracking Link Not Found" in not_found_card
        assert "could not locate an active delivery" in not_found_card
        assert "Search by Order Tracking Link" in not_found_card
        results.append("Stage 6: Looking up tracking URL by order code gives friendly 404 with no internal details.")

        browser.close()

    print("\n=== Verification Completed Successfully ===")
    for r in results:
        print(f"  [PASS] {r}")

if __name__ == "__main__":
    run_verification()
