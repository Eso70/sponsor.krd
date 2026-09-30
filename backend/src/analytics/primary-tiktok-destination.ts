/**
 * One web data connection per owner is used for automatic Linktree events.
 * Additional configured groups remain available as standby destinations.
 * Both the public Pixel projection and the Events API outbox use this exact
 * predicate so the browser and server halves cannot target different Pixels.
 */
export const PRIMARY_TIKTOK_DESTINATION_SQL = `pixel.id = (
  SELECT candidate.id
    FROM business_tiktok_pixels candidate
   WHERE candidate.business_id = pixel.business_id
     AND candidate.status = 'active'
   ORDER BY candidate.display_order, candidate.created_at, candidate.id
   LIMIT 1
)`;
