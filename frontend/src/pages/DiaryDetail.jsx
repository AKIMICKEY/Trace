import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spin, message, Modal } from 'antd'
import { SaveOutlined, RobotOutlined, DeleteOutlined, ArrowLeftOutlined, SmileOutlined, ClockCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmojiPicker from 'emoji-picker-react'
import { diaryApi } from '../api'

function DiaryDetail() {
  const { date } = useParams()
  const navigate = useNavigate()
  const [diary, setDiary] = useState(null)
  const [content, setContent] = useState('')
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [entriesCollapsed, setEntriesCollapsed] = useState(false)
  const textareaRef = useRef(null)
  const emojiPickerRef = useRef(null)

  useEffect(() => {
    loadDiary()
  }, [date])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadDiary = async () => {
    setLoading(true)
    try {
      const res = await diaryApi.getByDate(date)
      if (res.data) {
        setDiary(res.data)
        setContent('')
        setTimeEntries(res.data.time_entries || [])
      } else {
        setDiary(null)
        setContent('')
        setTimeEntries([])
      }
    } catch (error) {
      console.error('加载日记失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      message.warning('请输入要记录的内容')
      return
    }

    setSaving(true)
    try {
      const now = dayjs()
      const newEntry = {
        time: now.format('HH:mm'),
        content: content.trim()
      }
      
      const updatedEntries = [...timeEntries, newEntry]
      
      console.log('Saving with data:', { date, updatedEntries })
      const res = await diaryApi.create('', date, updatedEntries)
      console.log('Save response:', res)
      setDiary(res.data)
      setTimeEntries(res.data.time_entries || [])
      setContent('')
      message.success('记录成功')
    } catch (error) {
      console.error('Save error:', error)
      message.error('保存失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  const handleAiEvaluate = async () => {
    if (!diary) {
      message.warning('请先添加记录')
      return
    }

    setEvaluating(true)
    try {
      const res = await diaryApi.aiEvaluate(diary.id)
      setDiary(res.data)
      message.success('AI评价生成成功')
    } catch (error) {
      message.error(error.response?.data?.detail || 'AI评价生成失败')
    } finally {
      setEvaluating(false)
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇日记吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await diaryApi.delete(diary.id)
          message.success('删除成功')
          navigate('/')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleEmojiClick = (emojiData) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent(content + emojiData.emoji)
    }
  }

  const evaluationAngles = diary?.ai_evaluation 
    ? Object.entries(diary.ai_evaluation).filter(([key]) => key !== 'error')
    : []

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="diary-card watercolor-border">
        <div className="section-header">
          <h2 className="section-title">{dayjs(date).format('YYYY年MM月DD日')}</h2>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeftOutlined /> 返回日历
          </button>
        </div>

        {timeEntries.length > 0 && (
          <div className="time-entries-display">
            <h4 
              className="time-entries-title" 
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setEntriesCollapsed(!entriesCollapsed)}
            >
              {entriesCollapsed ? <RightOutlined /> : <DownOutlined />} <ClockCircleOutlined /> 今日记录
            </h4>
            {!entriesCollapsed && (
              <div className="time-entries-list">
                {timeEntries.map((entry, index) => (
                  <div key={index} className="time-entry-display-item">
                    <span className="time-badge">{entry.time}</span>
                    <span className="time-entry-content">{entry.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="diary-textarea-wrapper" style={{ marginTop: timeEntries.length > 0 ? 20 : 0 }}>
          <textarea
            ref={textareaRef}
            className="diary-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下此刻的想法或做的事情..."
            style={{ minHeight: 120 }}
          />
          <button 
            className="emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="选择表情"
          >
            <SmileOutlined />
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="emoji-picker-container">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
        
        <div className="actions-row">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <SaveOutlined /> {saving ? '保存中...' : '记录此刻'}
          </button>
          
          {diary && (
            <>
              <button 
                className="btn-secondary" 
                onClick={handleAiEvaluate} 
                disabled={evaluating}
              >
                <RobotOutlined /> {evaluating ? 'AI思考中...' : 'AI说'}
              </button>
              
              <button className="btn-secondary btn-danger" onClick={handleDelete}>
                <DeleteOutlined /> 删除
              </button>
            </>
          )}
        </div>
      </div>

      {diary?.ai_evaluation && (
        <div className="diary-card watercolor-border">
          {diary.ai_evaluation.error ? (
            <div style={{ color: '#ff4d4f', padding: 16, background: '#fff2f0', borderRadius: 8 }}>
              {diary.ai_evaluation.error}
            </div>
          ) : (
            evaluationAngles.map(([angle, content]) => (
              <div key={angle} className="evaluation-card">
                <div className="evaluation-title">{String(angle).replaceAll('_', ' ')}</div>
                <div className="evaluation-content">{content}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default DiaryDetail
