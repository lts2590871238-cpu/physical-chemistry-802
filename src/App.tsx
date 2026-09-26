import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import Stage1Page from './pages/Stage1Page'
import Stage2Page from './pages/Stage2Page'
import Stage3Page from './pages/Stage3Page'
import PredictionPage from './pages/PredictionPage'
import MistakesPage from './pages/MistakesPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stage1" element={<Stage1Page />} />
        <Route path="/stage2" element={<Stage2Page />} />
        <Route path="/stage3" element={<Stage3Page />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/mistakes" element={<MistakesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
