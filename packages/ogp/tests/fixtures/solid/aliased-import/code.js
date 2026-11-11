import { createMemo as memo } from 'solid-js'

const value = memo(() => 1)
const coolVar = <DynamicImage><div>{value()}</div></DynamicImage>
