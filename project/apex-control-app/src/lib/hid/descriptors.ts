/** Report payload sizes exclude the report ID passed separately to WebHID. */
export function collectionsDeep(collections: HIDCollectionInfo[]): HIDCollectionInfo[] {
  return collections.flatMap(c => [c, ...collectionsDeep(c.children ?? [])]);
}

export function reportLengths(collections: HIDCollectionInfo[], kind: 'inputReports' | 'outputReports' | 'featureReports'): Map<number, number> {
  const bits = new Map<number, number>();
  for (const collection of collectionsDeep(collections)) {
    for (const report of collection[kind] ?? []) {
      const size = report.items.reduce((sum, item) => sum + item.reportSize * item.reportCount, 0);
      bits.set(report.reportId, (bits.get(report.reportId) ?? 0) + size);
    }
  }
  return new Map([...bits].map(([id, size]) => [id, Math.ceil(size / 8)]));
}
