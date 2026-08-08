declare module '*.png' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.jpg' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.jpeg' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.gif' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.webp' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.avif' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.ico' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.bmp' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.svg' {
  const content: import('next/image').StaticImageData
  export default content
}

// CSS-only package exports (side-effect imports); TS 7's TS2882 requires these to resolve
declare module 'rehype-callouts/theme/github'
