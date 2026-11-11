import { serverFunctionUrl } from '@solidjs/web/server-functions'
import { GET } from '@solidjs/web/server-functions'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'

  return createOpenGraphImage(
    <div>
      <div></div>
      <div></div>
    </div>,
  )
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}
const coolVar = DynamicImage1({
  values: [],
})