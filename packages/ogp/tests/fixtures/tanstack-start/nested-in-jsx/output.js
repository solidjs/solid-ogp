import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createServerFn } from '@tanstack/solid-start'
import { createTanstackImageUrl } from '@solidjs/ogp'
import { Image } from '@solidjs/ogp'
import { createSignal } from 'solid-js'
const DynamicImage1ServerFunction = createServerFn({ method: 'GET' }).handler(
  (ctx) => {
    const args = ctx.data.values
    const [r0] = args
    return createOpenGraphImage(<div>{`Hello ${r0 * 2}!`}</div>)
  },
)
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    createTanstackImageUrl(DynamicImage1ServerFunction.url, props.values),
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
