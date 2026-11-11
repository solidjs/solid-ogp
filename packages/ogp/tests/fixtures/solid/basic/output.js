import { serverFunctionUrl } from '@solidjs/web/server-functions'
import { GET } from '@solidjs/web/server-functions'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
import { createSignal } from 'solid-js'
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
const [signal] = createSignal('')
const coolVar = DynamicImage1({
  values: [signal()],
})