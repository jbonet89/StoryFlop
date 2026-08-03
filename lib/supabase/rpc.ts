export function unwrapRpcRow<T>(data: T | T[] | null, operation: string): T {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error(`${operation} no devolvió ningún resultado`);
  return row;
}
