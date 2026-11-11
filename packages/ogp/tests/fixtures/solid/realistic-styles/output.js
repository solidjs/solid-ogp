import { serverFunctionUrl } from '@solidjs/web/server-functions'
import { GET } from '@solidjs/web/server-functions'
import { createOpenGraphImage } from '@solidjs/ogp/server'
import { createMemo } from 'solid-js'
const DynamicImage1ServerFunction = GET((...args) => {
  'use server'

  const [r0] = args
  return createOpenGraphImage(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'font-size': '128px',
        background: 'lavender',
      }}
    >
      {`👋 Hello, ${r0 * 2}!`}
    </div>,
  )
})
const DynamicImage1 = (props) => {
  const url = createMemo(() =>
    serverFunctionUrl(DynamicImage1ServerFunction, ...props.values),
  )
  return url
}
const coolVar = DynamicImage1({
  values: [count()],
})