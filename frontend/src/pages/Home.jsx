import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Spin, message } from 'antd'
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { calendarApi, diaryApi } from '../api'

function Home() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [datesWithDiary, setDatesWithDiary] = useState([])
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [todayDiary, setTodayDiary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadMonthDates()
  }, [currentMonth])

  useEffect(() => {
    loadTodayDiary()
  }, [selectedDate])

  const loadMonthDates = async () => {
    try {
      const res = await calendarApi.getMonthDates(
        currentMonth.year(),
        currentMonth.month() + 1
      )
      setDatesWithDiary(res.data.dates)
    } catch (error) {
      console.error('加载日历数据失败:', error)
    }
  }

  const loadTodayDiary = async () => {
    setLoading(true)
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const res = await diaryApi.getByDate(dateStr)
      setTodayDiary(res.data)
    } catch (error) {
      console.error('加载日记失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const handlePanelChange = (date) => {
    setCurrentMonth(date)
  }

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD')
    const hasDiary = datesWithDiary.includes(dateStr)
    const isToday = value.isSame(dayjs(), 'day')
    const isSelected = value.isSame(selectedDate, 'day')
    
    return (
      <div 
        className="date-cell"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: isSelected ? '#f0f2ff' : 'transparent',
          borderRadius: 8
        }}
        onClick={() => handleDateSelect(value)}
      >
        <span style={{
          fontSize: 14,
          fontWeight: isToday ? 600 : 400,
          color: isToday ? '#667eea' : '#333'
        }}>
          {value.date()}
        </span>
        {hasDiary && <div className="date-dot" />}
      </div>
    )
  }

  const goToDiary = () => {
    navigate(`/diary/${selectedDate.format('YYYY-MM-DD')}`)
  }

  return (
    <div>
      <div className="diary-card watercolor-border">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>
            {selectedDate.format('YYYY年MM月DD日')}
          </h3>
          <button 
            className="btn-secondary" 
            onClick={() => setShowCalendar(!showCalendar)}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <CalendarOutlined /> {showCalendar ? '隐藏日历' : '选择日期'}
          </button>
        </div>
        
        {showCalendar && (
          <div className="calendar-container" style={{ marginBottom: 16, padding: 12 }}>
            <Calendar 
              value={selectedDate}
              onSelect={(date) => {
                handleDateSelect(date)
                setShowCalendar(false)
              }}
              onPanelChange={handlePanelChange}
              cellRender={(current, info) => {
                if (info.type === 'date') {
                  return dateCellRender(current)
                }
                return info.originNode
              }}
            />
          </div>
        )}
        
        {loading ? (
          <div className="loading-container" style={{ minHeight: 100 }}>
            <Spin />
          </div>
        ) : todayDiary ? (
          <div>
            {todayDiary.time_entries && todayDiary.time_entries.length > 0 && (
              <div className="home-time-entries">
                {todayDiary.time_entries.map((entry, index) => (
                  <div key={index} className="home-time-entry">
                    <span className="home-time-badge">{entry.time}</span>
                    <span className="home-time-content">{entry.content}</span>
                  </div>
                ))}
              </div>
            )}
            {todayDiary.content && (
              <p style={{ 
                color: '#666', 
                lineHeight: 1.8,
                maxHeight: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {todayDiary.content}
              </p>
            )}
            <button className="btn-secondary" onClick={goToDiary} style={{ marginTop: 12 }}>
              查看详情
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>这一天还没有记录</p>
            <button className="btn-primary" onClick={goToDiary} style={{ marginTop: 12 }}>
              <PlusOutlined /> 写日记
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
