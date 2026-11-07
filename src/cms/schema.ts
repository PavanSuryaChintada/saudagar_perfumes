// The field language every editable thing is described in. SchemaForm renders a form from it.
export interface ShowIf {
  field: string;
  equals?: unknown;
  in?: unknown[];
  truthy?: boolean;
}

interface BaseField {
  key: string;
  label: string;
  help?: string;
  showIf?: ShowIf;
}

export type FieldDef =
  | (BaseField & { type: 'text'; placeholder?: string })
  | (BaseField & { type: 'textarea'; rows?: number })
  | (BaseField & { type: 'richtext' })
  | (BaseField & { type: 'number'; min?: number; max?: number; step?: number })
  | (BaseField & { type: 'boolean' })
  | (BaseField & { type: 'select'; options: { value: string; label: string }[] })
  | (BaseField & { type: 'color' })
  | (BaseField & { type: 'media'; accept?: 'image' | 'video' })
  | (BaseField & { type: 'link' })
  | (BaseField & { type: 'product_source' })
  | (BaseField & { type: 'product'; multiple?: boolean; by?: 'slug' | 'id' })
  | (BaseField & { type: 'datetime' })
  | (BaseField & { type: 'collection' })
  | (BaseField & { type: 'category' })
  | (BaseField & { type: 'font' })
  | (BaseField & { type: 'strings'; placeholder?: string })
  | (BaseField & { type: 'list'; fields: FieldDef[]; itemLabel?: string; max?: number })
  | (BaseField & { type: 'group'; fields: FieldDef[] });

export type Path = (string | number)[];

export function getAtPath(obj: unknown, path: Path): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

export function setAtPath<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const base: any = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  base[head as any] = setAtPath(base[head as any], rest, value);
  return base;
}

export function showIfMatches(showIf: ShowIf | undefined, value: Record<string, unknown>): boolean {
  if (!showIf) return true;
  const v = value?.[showIf.field];
  if (showIf.in) return showIf.in.includes(v);
  if ('equals' in showIf) return v === showIf.equals;
  if (showIf.truthy !== undefined) return Boolean(v) === showIf.truthy;
  return true;
}

export function visibleFields(fields: FieldDef[], value: Record<string, unknown>): FieldDef[] {
  return fields.filter((f) => showIfMatches(f.showIf, value ?? {}));
}

export function emptyValueFor(field: FieldDef): unknown {
  switch (field.type) {
    case 'list':
    case 'strings':
      return [];
    case 'boolean':
      return false;
    case 'group':
      return {};
    case 'number':
      return null;
    case 'link':
    case 'product_source':
      return null;
    case 'product':
      return field.multiple ? [] : '';
    case 'datetime':
      return null;
    default:
      return '';
  }
}

export function emptyItem(fields: FieldDef[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.key, emptyValueFor(f)]));
}
