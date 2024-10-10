import { useState } from 'react'
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
