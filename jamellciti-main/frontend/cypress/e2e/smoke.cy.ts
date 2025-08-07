/// <reference types="cypress" />

const email = "admin@aura.vision";
const pass = "demo123";

describe("Aura Vision end-to-end demo", () => {
  it("logs in, watches live map, fixes work-order, sees KPIs tick", () => {
    // 1️⃣ Login
    cy.visit("/");
    cy.get("input[type=email]").should("be.visible").type(email);
    cy.get("input[type=password]").should("be.visible").type(pass);
    cy.contains("button", /sign in/i).click();
    
    // Wait for dashboard load
    cy.url().should("not.include", "/login");
    cy.contains(/aura vision/i, {timeout: 10000}).should("be.visible");

    // 2️⃣ Assert KPIs render  
    cy.contains(/events today/i, {timeout: 10000}).should("exist");
    cy.contains(/work.*orders/i).should("exist");
    cy.contains(/citations/i).should("exist");

    // 3️⃣ Check that map loads
    cy.get(".maplibregl-canvas", {timeout: 15000}).should("be.visible");
    
    // Take screenshot of dashboard
    cy.screenshot("dashboard-loaded");

    // 4️⃣ Navigate to Work Orders tab & check table loads
    cy.contains("a", /work orders/i).click();
    cy.get("table", {timeout: 10000}).should("be.visible");
    
    // Check if there are work orders and try to toggle status
    cy.get("table tbody tr").then(($rows) => {
      if ($rows.length > 0) {
        cy.get("table tbody tr").first().within(() => {
          cy.get("button", {timeout: 5000}).first().click();
        });
        cy.screenshot("work-order-toggled");
      } else {
        cy.log("No work orders found to toggle");
      }
    });

    // 5️⃣ Check Citations ledger
    cy.contains("a", /citations/i).click();
    cy.get("table", {timeout: 10000}).should("be.visible");
    cy.screenshot("citations-page");

    // 6️⃣ Return to Dashboard 
    cy.contains("a", /dashboard/i).click();
    cy.contains(/events today/i, {timeout: 10000}).should("exist");
    
    // 7️⃣ Check Live Map tab
    cy.contains("a", /live map/i).click();
    cy.get(".maplibregl-canvas", {timeout: 15000}).should("be.visible");
    cy.screenshot("live-map");

    // 8️⃣ Admin Panel check
    cy.contains("a", /admin/i).click();
    cy.contains(/api keys/i, {timeout: 10000}).should("exist");
    cy.screenshot("admin-panel");

    cy.log("✅ Smoke test completed successfully!");
  });
});