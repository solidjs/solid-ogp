import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
import { Image } from '@solidjs/ogp'
import { createSignal } from 'solid-js'
const DynamicImage1ServerFunction = createServerFn({
  method: 'GET',
  response: 'raw',
}).handler((ctx) => {
  const args = ctx.data.values
  const [r0] = args
  return createOpenGraphImage(<div>{`Hello ${r0 * 2}!`}</div>)
})
const DynamicImage1 = (props) => {
  const payload = () => ({
    data: {
      values: props.values,
    },
    context: {},
  })
  const url = createMemo(
    () =>
      `${DynamicImage1ServerFunction.url}?payload=${encodeURIComponent(JSON.stringify(payload()))}&createServerFn&raw`,
  )
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