import { serverFunctionUrl } from '@solidjs/web/server-functions'
import { GET } from '@solidjs/web/server-functions'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'

  const [r0, r1] = args
  return createOpenGraphImage(<div title={r0}>{r1}</div>)
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}
const coolVar = DynamicImage1({
  values: [
    user.profile.name,
    format(count(), {
      pad: 2,
    }),
  ],
})