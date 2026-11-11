import { serverFunctionUrl } from '@solidjs/web/server-functions'
import { GET } from '@solidjs/web/server-functions'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage2ServerFunction = GET((...args) => {
  'use server'

  const [r0] = args
  return createOpenGraphImage(<div>{r0}</div>, {
    width: 800,
  })
})
const DynamicImage2 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage2ServerFunction, ...props.values),
  )
  return url
}
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
const first = DynamicImage1({
  values: [a()],
})
const second = DynamicImage2({
  values: [b()],
})