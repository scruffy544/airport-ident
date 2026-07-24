// app/api/etsy/route.js
//
// Server-side Etsy integration for AirportIDGear.
// Handles refreshing the OAuth access token automatically (using the
// long-lived refresh token) and uploading mockup images to a listing.
//
// Required Vercel environment variables (set these in your project settings):
//   ETSY_KEYSTRING       - your Etsy App API Key keystring
//   ETSY_SHARED_SECRET   - your Etsy App shared secret
//   ETSY_REFRESH_TOKEN   - the refresh token from the OAuth setup (90-day lifetime)
//
// This route exposes two actions via POST body { action, ... }:
//   1. { action: "getShopId" }
//        -> returns your shop_id (only need to call this once, then hardcode
//           the result as ETSY_SHOP_ID to save an API call each time)
//   2. { action: "uploadImage", listingId, imageUrl, rank }
//        -> downloads imageUrl (e.g. a mockup hosted on your own site or
//           Printify) and uploads it as a listing image on Etsy

const ETSY_API_BASE = "https://openapi.etsy.com/v3/application";

async function getAccessToken() {
  const keystring = process.env.ETSY_KEYSTRING;
  const sharedSecret = process.env.ETSY_SHARED_SECRET;
  const refreshToken = process.env.ETSY_REFRESH_TOKEN;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: keystring,
    refresh_token: refreshToken,
  });

  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-api-key": `${keystring}:${sharedSecret}`,
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Etsy token refresh failed: ${JSON.stringify(data)}`);
  }
  const userId = data.access_token.split(".")[0];
  return { accessToken: data.access_token, userId };
}

// NOTE: apiKeyHeader is the FULL "keystring:sharedsecret" string -
// every Etsy v3 endpoint requires both parts, not just the keystring.
async function getShopId(accessToken, userId, apiKeyHeader) {
  const res = await fetch(`${ETSY_API_BASE}/users/${userId}/shops`, {
    headers: {
      "x-api-key": apiKeyHeader,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to fetch shop: ${JSON.stringify(data)}`);
  }
  return data.shop_id;
}

async function uploadListingImage({ accessToken, apiKeyHeader, shopId, listingId, imageUrl, rank }) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download image from ${imageUrl}`);
  }
  const imgBlob = await imgRes.blob();

  const form = new FormData();
  form.append("image", imgBlob, "mockup.jpg");
  if (rank) form.append("rank", String(rank));

  const uploadRes = await fetch(
    `${ETSY_API_BASE}/shops/${shopId}/listings/${listingId}/images`,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKeyHeader,
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  const data = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Etsy image upload failed: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;
    const keystring = process.env.ETSY_KEYSTRING;
    const sharedSecret = process.env.ETSY_SHARED_SECRET;
    const apiKeyHeader = `${keystring}:${sharedSecret}`;

    const { accessToken, userId } = await getAccessToken();

    if (action === "getShopId") {
      const shopId = await getShopId(accessToken, userId, apiKeyHeader);
      return Response.json({ shop_id: shopId });
    }

    if (action === "uploadImage") {
      const { listingId, imageUrl, rank } = body;
      const shopId = process.env.ETSY_SHOP_ID || (await getShopId(accessToken, userId, apiKeyHeader));
      const result = await uploadListingImage({
        accessToken,
        apiKeyHeader,
        shopId,
        listingId,
        imageUrl,
        rank,
      });
      return Response.json(result);
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
