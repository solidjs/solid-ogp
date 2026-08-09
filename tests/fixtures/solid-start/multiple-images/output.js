import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage2ServerFunction = (...args) => {
  'use server'

  const [r0] = args
  return createOpenGraphImage(<div>{r0}</div>, {
    width: 800,
  })
}
const DynamicImage2 = (props) => {
  const url = createMemo(() => {
    return (
      DynamicImage2ServerFunction.url.replace('_server', '_server/') +
      `&args=${encodeURIComponent(JSON.stringify(props.values))}`
    )
  })
  return url
}
const DynamicImage1ServerFunction = (...args) => {
  'use server'

  const [r0] = args
  return createOpenGraphImage(<div>{r0}</div>)
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
const first = DynamicImage1({
  values: [a()],
})
const second = DynamicImage2({
  values: [b()],
})