import { expect, test } from "@playwright/test";

test.describe("overlay visual regression", () => {
  test("dialog shell baseline", async ({ page }) => {
    await page.setContent(`
      <style>
        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #f8fafc;
          color: #0f172a;
        }
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: grid;
          place-items: center;
        }
        .dialog {
          width: 420px;
          border-radius: 12px;
          background: white;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.25);
          padding: 20px;
        }
        .title {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
        }
        .body {
          margin: 0;
          color: #334155;
          line-height: 1.4;
        }
      </style>
      <div class="backdrop">
        <section class="dialog" role="dialog" aria-modal="true" aria-label="Dialog example">
          <h2 class="title">Dialog</h2>
          <p class="body">Overlay visual baseline used by the generation pipeline.</p>
        </section>
      </div>
    `);

    await expect(page).toHaveScreenshot("dialog-shell.png", {
      fullPage: true,
    });
  });
});
