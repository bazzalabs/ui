// Dev-only warnings read `process.env.NODE_ENV`, which bundlers replace with a
// literal so the warning code drops out of production builds. menu-core loads
// no Node types, so it declares the one field it reads.
export {}

declare global {
  var process: { env: { NODE_ENV?: string } }
}
