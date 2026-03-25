import type { BetaAnalyticsDataClient, protos } from '@google-analytics/data'

function num(v: string | undefined | null): number {
  const n = parseFloat(v || '0')
  return Number.isFinite(n) ? n : 0
}

function mapRows(
  report: protos.google.analytics.data.v1beta.IRunReportResponse | null | undefined
): Record<string, string | number>[] {
  if (!report?.rows?.length) return []
  const dimNames = (report.dimensionHeaders || []).map((h) => h.name || '')
  const metNames = (report.metricHeaders || []).map((h) => h.name || '')
  return report.rows.map((row) => {
    const out: Record<string, string | number> = {}
    row.dimensionValues?.forEach((d, i) => {
      out[dimNames[i] || `d${i}`] = d.value || ''
    })
    row.metricValues?.forEach((m, i) => {
      out[metNames[i] || `m${i}`] = num(m.value)
    })
    return out
  })
}

function firstRowMetrics(
  report: protos.google.analytics.data.v1beta.IRunReportResponse | null | undefined
): Record<string, number> {
  const row = report?.rows?.[0]
  if (!row?.metricValues?.length || !report) return {}
  const names = (report.metricHeaders || []).map((h) => h.name || '')
  const out: Record<string, number> = {}
  row.metricValues.forEach((m, i) => {
    out[names[i] || `m${i}`] = num(m.value)
  })
  return out
}

export interface Ga4DashboardPayload {
  periodo: string
  dateRange: { startDate: string; endDate: string }
  propertyId: string
  summary: {
    activeUsers: number
    sessions: number
    newUsers: number
    averageSessionDurationSeconds: number
    engagementRate: number
    userEngagementDurationSeconds: number
  }
  byCountry: { country: string; activeUsers: number; sessions: number }[]
  byChannel: { channel: string; sessions: number; activeUsers: number }[]
  bySourceMedium: { sourceMedium: string; sessions: number; activeUsers: number }[]
  byCampaign: { campaign: string; sessions: number; activeUsers: number }[]
  timeseries: { date: string; activeUsers: number; sessions: number }[]
}

export async function fetchGa4Dashboard(
  client: BetaAnalyticsDataClient,
  property: string,
  startDate: string,
  endDate: string,
  periodo: string,
  propertyIdNumeric: string
): Promise<Ga4DashboardPayload> {
  const dateRanges = [{ startDate, endDate }]

  const [
    summaryRes,
    countryRes,
    channelRes,
    sourceRes,
    campaignRes,
    seriesRes,
  ] = await Promise.all([
    client.runReport({
      property,
      dateRanges,
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' },
        { name: 'userEngagementDuration' },
      ],
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'sessionCampaignName' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 366,
    }),
  ])

  const s = firstRowMetrics(summaryRes[0])

  const byCountry = mapRows(countryRes[0]).map((r) => ({
    country: String(r.country || '(desconocido)'),
    activeUsers: Number(r.activeUsers) || 0,
    sessions: Number(r.sessions) || 0,
  }))

  const byChannel = mapRows(channelRes[0]).map((r) => ({
    channel: String(r.sessionDefaultChannelGroup || '(sin canal)'),
    sessions: Number(r.sessions) || 0,
    activeUsers: Number(r.activeUsers) || 0,
  }))

  const bySourceMedium = mapRows(sourceRes[0]).map((r) => ({
    sourceMedium: String(r.sessionSourceMedium || '(sin dato)'),
    sessions: Number(r.sessions) || 0,
    activeUsers: Number(r.activeUsers) || 0,
  }))

  const byCampaign = mapRows(campaignRes[0]).map((r) => ({
    campaign: String(r.sessionCampaignName || '(sin campaña)'),
    sessions: Number(r.sessions) || 0,
    activeUsers: Number(r.activeUsers) || 0,
  }))

  const timeseries = mapRows(seriesRes[0])
    .map((r) => {
      const raw = String(r.date || '')
      const y = raw.slice(0, 4)
      const m = raw.slice(4, 6)
      const d = raw.slice(6, 8)
      const label = raw.length >= 8 ? `${d}/${m}` : raw
      return {
        date: label,
        sortKey: raw,
        activeUsers: Number(r.activeUsers) || 0,
        sessions: Number(r.sessions) || 0,
      }
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ date, activeUsers, sessions }) => ({ date, activeUsers, sessions }))

  return {
    periodo,
    dateRange: { startDate, endDate },
    propertyId: propertyIdNumeric,
    summary: {
      activeUsers: s.activeUsers ?? 0,
      sessions: s.sessions ?? 0,
      newUsers: s.newUsers ?? 0,
      averageSessionDurationSeconds: s.averageSessionDuration ?? 0,
      engagementRate: s.engagementRate ?? 0,
      userEngagementDurationSeconds: s.userEngagementDuration ?? 0,
    },
    byCountry,
    byChannel,
    bySourceMedium,
    byCampaign,
    timeseries,
  }
}
