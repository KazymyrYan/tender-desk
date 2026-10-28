import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TenderList from './pages/TenderList'
import TenderDetail from './pages/TenderDetail'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TenderList />} />
        <Route path="/tender/:id" element={<TenderDetail />} />
      </Routes>
    </Layout>
  )
}
