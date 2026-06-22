import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Feeds } from "./pages/Feeds.tsx"

const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Feeds />} />
        <Route path="/feeds" element={<Feeds />} />
        <Route path="/discover" element={<Feeds />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
