import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { GET, serverFunctionUrl } from '@solidjs/web/server-functions'
import { createSignal } from 'solid-js'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'
  const [r0] = args
  return createOpenGraphImage(
    <div class={{ fontSize: '100px', [r0]: '123' }}>{}</div>,
  )
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}

const [signal] = createSignal('hello')
const coolVar = DynamicImage1({ values: [signal()] })
