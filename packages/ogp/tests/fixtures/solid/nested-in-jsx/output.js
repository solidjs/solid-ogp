import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { GET, serverFunctionUrl } from '@solidjs/web/server-functions'
import { Image } from '@solidjs/ogp'
import { createSignal } from 'solid-js'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'
  const [r0] = args
  return createOpenGraphImage(<div>{`Hello ${r0 * 2}!`}</div>)
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}

export default function Home() {
  const [count] = createSignal(0)
  return (
    <main>
      <Image>{DynamicImage1({ values: [count()] })}</Image>
    </main>
  )
}
