// Shared by both profile-viewing surfaces: the /researcher/:id preview and
// every tenant's live subdomain. Previously only the preview page called
// this, so real profile visits (the actual product) were never recorded —
// every customer's analytics dashboard showed zero traffic regardless of
// actual visits.
export async function trackProfileEvent(openalexId: string, eventType: string, eventTarget?: string): Promise<void> {
  try {
    let visitorId = localStorage.getItem("scholar_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("scholar_visitor_id", visitorId);
    }
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openalexId, eventType, eventTarget, visitorId, referrer: document.referrer || null }),
    });
  } catch (error) {
    console.debug("Analytics tracking failed:", error);
  }
}
