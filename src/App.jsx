import React from 'react'
import { Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import { Route } from 'react-router-dom'
import Stories from './components/Stories'
import Navbar from './components/Navbar'
import Features from './components/Features'
import About from './components/About'
import Devider1 from './components/Devider1'
import Devider2 from './components/Devider2'
import Footer from './components/Footer'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/Forgotpass'
import DashboardLayout from './pages/DashboardLayout'
import DashboardNavbar from './components/DashboardNavbar'  
import Sidebar from './components/Sidebar'  
import DashboardHome from './components/DashboardHome'
import WordHelper from './components/WordHelper'
import Bookmarks from './components/Bookmarks'
import Challenges from './pages/Challenges'
import Shop from './pages/Shop'
import Library from './pages/Library'
import Read from './pages/Read'
import QuizGame from './components/QuizGame'
import StreakWidget from './components/StreakWidget'
import Profile from './pages/Profile'
import Achievements from './components/Achievements'
import LearningProgress from './components/LearningProgress'
import ProfileSettings from './components/ProfileSettings'
import Subscription from './components/Subscription'


const App = () => {
  return (
    
    <Routes>

      <Route path="/" element={<Landing />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/features" element={<Features />} />
      <Route path="/about" element={<About />} />
      <Route path="/devider1" element={<Devider1 />} />
      <Route path="/devider2" element={<Devider2 />} />
      <Route path="/footer" element={<Footer />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} /> 
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboardnavbar" element={<DashboardNavbar />} />
      <Route path="/sidebar" element={<Sidebar />} />

      <Route path="/dashboardlayout" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="quiz-game" element={<QuizGame />} />
        <Route path="word-helper" element={<WordHelper />} />
        <Route path="bookmarks" element={<Bookmarks/>} />
      </Route>

      <Route path="/challenges" element={<Challenges />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/library" element={<Library />} />
      <Route path="/read" element={<Read />} />
      <Route path="/streak-widget" element={<StreakWidget />} />

      <Route path="/profile" element={<Profile />}>
          <Route index element={<LearningProgress />} />  
          <Route path="profile-settings" element={<ProfileSettings />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>

    </Routes>
  )
}

export default App