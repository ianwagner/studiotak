const ATTIO_PEOPLE_ENDPOINT = "https://api.attio.com/v2/objects/people/records";

type AttioPerson = {
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Creates or updates a person using Attio's unique email-address attribute.
 * CRM availability must not prevent a verified form submission from being delivered.
 */
export async function syncAttioPerson({ email, firstName, lastName }: AttioPerson) {
  const apiKey = process.env.ATTIO_API_KEY?.trim();
  if (!apiKey) {
    console.warn("Attio sync skipped: ATTIO_API_KEY is not configured.");
    return;
  }

  try {
    const response = await fetch(ATTIO_PEOPLE_ENDPOINT, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "studio-tak-website/forms"
      },
      body: JSON.stringify({
        data: {
          values: {
            email_addresses: [email],
            name: [
              {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`
              }
            ]
          }
        }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      console.error("Unable to sync person to Attio", { status: response.status });
    }
  } catch {
    console.error("Unable to sync person to Attio");
  }
}
