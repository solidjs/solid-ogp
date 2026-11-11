import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { GET, serverFunctionUrl } from '@solidjs/web/server-functions'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'
  const [r0] = args
  return createOpenGraphImage(<div>{r0}</div>)
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}
const coolVar = DynamicImage1({ values: [nonSignal] })
