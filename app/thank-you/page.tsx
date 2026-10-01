import { redirect } from "next/navigation";

// Lead confirmation now renders inside each form after the server confirms a
// successful submission. Redirect legacy visits so a page-view-based goal can
// no longer count refreshes, bookmarks, or direct traffic as enquiries.
export default function LegacyThankYouPage() {
  redirect("/");
}
