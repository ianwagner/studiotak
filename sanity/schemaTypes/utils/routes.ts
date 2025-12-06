export const ROUTE_PRODUCT_OPTIONS = [
  {title: 'Campfire', value: 'campfire'},
  {title: 'Marketing Site', value: 'marketing'},
] satisfies Array<{title: string; value: string}>;

export const ROUTE_PATH_PATTERN = /^[^\s/]+$/;

export function getNormalizedDocumentId(_id: string | undefined): string | undefined {
  if (!_id) return undefined;
  return _id.startsWith('drafts.') ? _id.slice('drafts.'.length) : _id;
}
