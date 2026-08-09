import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage2ServerFunction = createServerFn({
  method: 'GET',
  response: 'raw',
}).handler((ctx) => {
  const args = ctx.data.values
  const [r0] = args
  return createOpenGraphImage(<div>{r0}</div>, {
    width: 800,
  })
})
const DynamicImage2 = (props) => {
  const payload = () => ({
    data: {
      values: props.values,
    },
    context: {},
  })
  const url = createMemo(
    () =>
      `${DynamicImage2ServerFunction.url}?payload=${encodeURIComponent(JSON.stringify(payload()))}&createServerFn&raw`,
  )
  return url
}
const DynamicImage1ServerFunction = createServerFn({
  method: 'GET',
  response: 'raw',
}).handler((ctx) => {
  const args = ctx.data.values
  const [r0] = args
  return createOpenGraphImage(<div>{r0}</div>)
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
const first = DynamicImage1({
  values: [a()],
})
const second = DynamicImage2({
  values: [b()],
})