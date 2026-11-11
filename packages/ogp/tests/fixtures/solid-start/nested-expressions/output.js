import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage1ServerFunction = (...args) => {
  'use server'

  const [r0, r1] = args
  return createOpenGraphImage(<div title={r0}>{r1}</div>)
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
const coolVar = DynamicImage1({
  values: [
    user.profile.name,
    format(count(), {
      pad: 2,
    }),
  ],
})