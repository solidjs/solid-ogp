import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { GET, serverFunctionUrl } from '@solidjs/web/server-functions'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'
  const [r0, r1, r2, r3] = args
  return createOpenGraphImage(
    <div style={{ color: r0, background: r1, [r2]: r3 }}>Hi</div>,
  )
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}
const coolVar = DynamicImage1({ values: [color(), background, key, size] })
