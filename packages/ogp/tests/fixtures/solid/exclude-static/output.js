import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { GET } from '@solidjs/web/server-functions'
import { serverFunctionUrl } from '@solidjs/web/server-functions'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'
  return createOpenGraphImage(<div style={{ fontSize: '100px' }}>Hello</div>)
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}
const coolVar = DynamicImage1({ values: [] })
