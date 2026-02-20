import { GBPClient, V4_BASE } from './client'

export interface GBPReview {
  reviewId:     string
  reviewer:     string
  rating:       number          // 1-5
  comment:      string
  replyText:    string | null
  createTime:   string
  updateTime:   string
  starRating:   string          // e.g. "FIVE"
}

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}

export async function listReviews(
  gbp: GBPClient,
  pageSize = 50
): Promise<GBPReview[]> {
  // v4 path: accounts/{account}/locations/{location}/reviews
  // gbp.accountId = "accounts/123456"
  // loc part from accountId + locationId: "accounts/123456/locations/987654321"
  const locPath = `${gbp.accountId}/${gbp.locationId}`
  const url = `${V4_BASE}/${locPath}/reviews?pageSize=${pageSize}&orderBy=updateTime desc`

  const res = await gbp.get(url)
  if (!res.ok) {
    console.error('[GBP reviews]', res.status, await res.text())
    return []
  }

  const data = await res.json()
  const reviews: GBPReview[] = (data.reviews || []).map((r: any) => ({
    reviewId:   r.reviewId,
    reviewer:   r.reviewer?.displayName || 'Anonymous',
    rating:     STAR_MAP[r.starRating] ?? 0,
    comment:    r.comment || '',
    replyText:  r.reviewReply?.comment ?? null,
    createTime: r.createTime,
    updateTime: r.updateTime,
    starRating: r.starRating,
  }))

  return reviews
}

export async function replyToReview(
  gbp: GBPClient,
  reviewId: string,
  replyText: string
): Promise<boolean> {
  const locPath = `${gbp.accountId}/${gbp.locationId}`
  const url = `${V4_BASE}/${locPath}/reviews/${reviewId}/reply`

  const res = await gbp.put(url, { comment: replyText })
  if (!res.ok) {
    console.error('[GBP reply]', res.status, await res.text())
    return false
  }
  return true
}
