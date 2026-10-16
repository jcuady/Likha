/**
 * Likha waitlist → Google Sheets
 *
 * Setup, once:
 *   1. Create a Sheet. Put a header row in row 1:
 *        Email | Interest | First seen | Last seen | Source
 *   2. Extensions → Apps Script → paste this file → Save.
 *   3. Set SPREADSHEET_ID below to the id from the Sheet URL, the long string
 *      between /d/ and /edit.
 *   4. Deploy → New deployment → Type: Web app.
 *      Execute as: Me.  Who has access: Anyone.
 *      (Anyone is required. A web app restricted to your own account rejects
 *      every request coming from the site.)
 *   5. Copy the /exec URL and put it in the project's .env:
 *        VITE_WAITLIST_WEBHOOK_URL=https://script.google.com/macros/s/DEPLOY_ID/exec
 *      Vite only exposes variables prefixed VITE_, and it inlines them at build
 *      time, so the site must be rebuilt after this changes.
 *
 * Why the caller sends text/plain rather than JSON: a JSON content type makes
 * the browser send a CORS preflight, which Apps Script does not answer, and the
 * request never leaves the page. Sent as text/plain it is a simple request and
 * is delivered. It arrives here as a string, so it is parsed below.
 */

/** The id between /d/ and /edit in the Sheet's URL. */
const SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_HERE";

const SHEET_NAME = "Sheet1";

function sheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

/** Writes the header row if the Sheet is empty, so a fresh Sheet still works. */
function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Email", "Interest", "First seen", "Last seen", "Source"]);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const email = String(payload.email || "")
      .trim()
      .toLowerCase();
    const interest = String(payload.interest || "investor").trim();
    const source = String(payload.source || "unknown").trim();

    if (!email || email.indexOf("@") === -1) {
      return json_({ ok: false, error: "invalid email" });
    }

    const sheet = sheet_();
    ensureHeader_(sheet);

    const stamp = new Date().toISOString();
    const last = sheet.getLastRow();

    // Upsert on email. The client may retry a request it could not read a
    // reply to, and a second row for the same person is worse than a rewrite.
    if (last > 0) {
      const rows = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < rows.length; i++) {
        const cell = String(rows[i][0] || "")
          .trim()
          .toLowerCase();
        if (cell === email) {
          sheet.getRange(i + 2, 2, 1, 3).setValues([[interest, rows[i][2] || stamp, stamp]]);
          return json_({ ok: true, action: "updated" });
        }
      }
    }

    sheet.appendRow([email, interest, stamp, stamp, source]);
    return json_({ ok: true, action: "created" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Run once from the editor to confirm the Sheet id and name are right. */
function test_() {
  sheet_.appendRow(["smoke-test@example.com", "investor", new Date().toISOString(), "", "smoke"]);
}
