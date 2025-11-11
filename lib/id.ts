export function nanoid(size = 12): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let id = ""
  const array = new Uint8Array(size)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    for (let i = 0; i < size; i++) id += chars[array[i] % chars.length]
    return id
  }
  for (let i = 0; i < size; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}
