import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage1ServerFunction = createServerFn({
  method: 'GET',
  response: 'raw',
}).handler((ctx) => {
  const args = ctx.data.values
  return createOpenGraphImage(<div>Hi!</div>, {
    emoji: 'openmoji',
  })
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
DynamicImage1({
  values: [],
})