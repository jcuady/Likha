/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional waitlist destination. A Google Apps Script web app `/exec` URL
   * appends each address to a Sheet. Unset means the address is stored in the
   * visitor's browser only, and the dialog says so.
   */
  readonly VITE_WAITLIST_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
