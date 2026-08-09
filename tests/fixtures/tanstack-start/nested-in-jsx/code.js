import { Image } from '@solidjs/ogp'
import { createSignal } from 'solid-js'

export default function Home() {
  const [count] = createSignal(0)
  return (
    <main>
      <Image>
        <DynamicImage>
          <div>{`Hello ${count() * 2}!`}</div>
        </DynamicImage>
      </Image>
    </main>
  )
}
