import { GBPClient, V4_BASE } from './client'

export type PostTopicType = 'STANDARD' | 'EVENT' | 'OFFER'

export interface GBPPost {
  name:         string
  summary:      string
  topicType:    PostTopicType
  state:        string
  createTime:   string
  updateTime:   string
  actionType?:  string
  actionUrl?:   string
}

export interface CreatePostInput {
  summary:     string
  topicType:   PostTopicType
  actionType?: 'LEARN_MORE' | 'CALL' | 'ORDER' | 'SHOP' | 'SIGN_UP' | 'BOOK'
  actionUrl?:  string
}

export async function listPosts(gbp: GBPClient): Promise<GBPPost[]> {
  const locPath = `${gbp.accountId}/${gbp.locationId}`
  const res = await gbp.get(`${V4_BASE}/${locPath}/localPosts?pageSize=20`)

  if (!res.ok) {
    console.error('[GBP posts list]', res.status, await res.text())
    return []
  }

  const data = await res.json()
  return (data.localPosts ?? []).map((p: any) => ({
    name:        p.name,
    summary:     p.summary,
    topicType:   p.topicType,
    state:       p.state,
    createTime:  p.createTime,
    updateTime:  p.updateTime,
    actionType:  p.callToAction?.actionType,
    actionUrl:   p.callToAction?.url,
  }))
}

export async function createPost(
  gbp: GBPClient,
  input: CreatePostInput
): Promise<GBPPost | null> {
  const locPath = `${gbp.accountId}/${gbp.locationId}`
  const body: Record<string, unknown> = {
    summary:   input.summary,
    topicType: input.topicType,
  }
  if (input.actionType && input.actionUrl) {
    body.callToAction = { actionType: input.actionType, url: input.actionUrl }
  }

  const res = await gbp.post(`${V4_BASE}/${locPath}/localPosts`, body)
  if (!res.ok) {
    console.error('[GBP post create]', res.status, await res.text())
    return null
  }

  const p = await res.json()
  return {
    name:       p.name,
    summary:    p.summary,
    topicType:  p.topicType,
    state:      p.state,
    createTime: p.createTime,
    updateTime: p.updateTime,
    actionType: p.callToAction?.actionType,
    actionUrl:  p.callToAction?.url,
  }
}
