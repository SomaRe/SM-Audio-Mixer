import { useState } from 'react'
import AudioVolumeCurveEditor from './AudioVolumeCurveEditor'
import SVGVolumeCurveEditor from './SVGVolumeCurveEditor'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SVGVolumeCurveEditor />
    </>
  )
}

export default App
