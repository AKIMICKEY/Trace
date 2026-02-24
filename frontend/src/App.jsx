import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { HomeOutlined, UserOutlined } from '@ant-design/icons'
import Home from './pages/Home'
import DiaryDetail from './pages/DiaryDetail'
import Profile from './pages/Profile'
import HenjiIcon from './components/HenjiIcon'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HenjiIcon size={32} />
            <h1 className="header-title">痕迹</h1>
          </div>
          <nav className="header-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <HomeOutlined /> 日历
            </NavLink>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <UserOutlined /> 我的
            </NavLink>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/diary/:date" element={<DiaryDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
