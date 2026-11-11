import { createMemo } from 'solid-js'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createServerFn } from '@tanstack/solid-start'
import { createTanstackImageUrl } from '@solidjs/ogp'
const DynamicImage1ServerFunction = createServerFn({ method: 'GET' }).handler(
  (ctx) => {
    const args = ctx.data.values
    return createOpenGraphImage(<div>Hi!</div>, { emoji: 'openmoji' })
  },
)
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    createTanstackImageUrl(DynamicImage1ServerFunction.url, props.values),
  )
  return url
}
DynamicImage1({ values: [] })
