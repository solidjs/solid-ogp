import { createSignal } from 'solid-js'
const [signal] = createSignal('')
const coolVar = <div>{signal()}</div>