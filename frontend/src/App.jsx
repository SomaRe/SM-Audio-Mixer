import { useState } from 'react'
import SVGVolumeCurveEditor from './SVGVolumeCurveEditor'
import WaveformPlayer from './WaveformPlayerSingle'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SVGVolumeCurveEditor />

      {/* <WaveformPlayer /> */}
    </>
  )
}

export default App
