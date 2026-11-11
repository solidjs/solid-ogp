import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
import { Image } from '@solidjs/ogp'
import { createSignal } from 'solid-js'
const DynamicImage1ServerFunction = (...args) => {
  'use server'

  const [r0] = args
  return createOpenGraphImage(<div>{`Hello ${r0 * 2}!`}</div>)
}
const DynamicImage1 = (props) => {
  const url = createMemo(() => {
    return (
      DynamicImage1ServerFunction.url.replace('_server', '_server/') +
      `&args=${encodeURIComponent(JSON.stringify(props.values))}`
    )
  })
  return url
}
export default function Home() {
  const [count] = createSignal(0)
  return (
    <main>
      <Image>
        {DynamicImage1({
          values: [count()],
        })}
      </Image>
    </main>
  )
}