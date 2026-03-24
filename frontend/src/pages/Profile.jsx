import React, { useState, useEffect } from 'react'
import { Spin, message, Button, Input, Modal, Card, Typography, Space, Divider } from 'antd'
import { ReloadOutlined, UserOutlined, SettingOutlined, KeyOutlined, DeleteOutlined, SaveOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { portraitApi, settingsApi } from '../api'
import HenjiIcon from '../components/HenjiIcon'

const { Title, Text, Paragraph } = Typography
const { Password } = Input

function Profile() {
  const [portrait, setPortrait] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [apiModalVisible, setApiModalVisible] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [savingApiKey, setSavingApiKey] = useState(false)

  useEffect(() => {
    loadPortrait()
    loadApiKeyStatus()
  }, [])

  const loadPortrait = async () => {
    setLoading(true)
    try {
      const res = await portraitApi.getLatest()
      setPortrait(res.data)
    } catch (error) {
      console.error('加载画像失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadApiKeyStatus = async () => {
    try {
      const res = await settingsApi.getApiKeyStatus()
      setHasApiKey(res.data.has_api_key)
    } catch (error) {
      console.error('获取API Key状态失败:', error)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await portraitApi.generate()
      setPortrait(res.data)
      message.success('画像生成成功')
    } catch (error) {
      message.error(error.response?.data?.detail || '画像生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleOpenApiModal = () => {
    setApiKey('')
    setApiModalVisible(true)
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      message.warning('请输入API Key')
      return
    }
    setSavingApiKey(true)
    try {
      await settingsApi.updateApiKey(apiKey.trim())
      message.success('API Key保存成功')
      setApiModalVisible(false)
      setHasApiKey(true)
      setApiKey('')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSavingApiKey(false)
    }
  }

  const handleDeleteApiKey = async () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除已保存的API Key吗？删除后将使用服务器默认配置。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await settingsApi.deleteApiKey()
          message.success('API Key已删除')
          setHasApiKey(false)
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const userId = localStorage.getItem('diary_user_id')

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="portrait-section watercolor-border">
        <div className="section-header profile-header">
          <div className="icon-title-row">
            <HenjiIcon size={40} />
            <h2 className="section-title">
              <UserOutlined /> 个人中心
            </h2>
          </div>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={handleGenerate}
            loading={generating}
          >
            刷新画像
          </Button>
        </div>

        <div className="info-banner">
          <strong>用户ID:</strong> {userId}
        </div>

        <Card 
          title={<span><SettingOutlined /> API设置</span>}
          style={{ marginBottom: 24 }}
          size="small"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text type="secondary">DeepSeek API Key: </Text>
              <Text strong={hasApiKey} type={hasApiKey ? 'success' : 'secondary'}>
                {hasApiKey ? '已配置' : '未配置'}
              </Text>
            </div>
            <Space>
              <Button 
                type="primary" 
                icon={<KeyOutlined />}
                onClick={handleOpenApiModal}
              >
                {hasApiKey ? '更新' : '设置'}
              </Button>
              {hasApiKey && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteApiKey}
                >
                  删除
                </Button>
              )}
            </Space>
          </div>
          <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
            配置您自己的DeepSeek API Key，用于AI日记评价和画像生成功能。如未配置，将使用服务器默认配置。
          </Paragraph>
        </Card>

        {portrait ? (
          <>
            <div style={{ 
              marginBottom: 16, 
              color: '#999', 
              fontSize: 13 
            }}>
              画像周期: {portrait.period_start} 至 {portrait.period_end}
            </div>

            {portrait.portrait_data.personality && (
              <div className="portrait-item">
                <div className="portrait-label">性格特点</div>
                <div className="portrait-tags">
                  {portrait.portrait_data.personality.map((item, index) => (
                    <span key={index} className="portrait-tag">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {portrait.portrait_data.focus_themes && (
              <div className="portrait-item">
                <div className="portrait-label">关注主题</div>
                <div className="portrait-tags">
                  {portrait.portrait_data.focus_themes.map((item, index) => (
                    <span key={index} className="portrait-tag">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {portrait.portrait_data.emotion_trend && (
              <div className="portrait-item">
                <div className="portrait-label">情绪趋势</div>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  {portrait.portrait_data.emotion_trend}
                </p>
              </div>
            )}

            {portrait.portrait_data.important_events && (
              <div className="portrait-item">
                <div className="portrait-label">重要事件</div>
                <div className="portrait-tags">
                  {portrait.portrait_data.important_events.map((item, index) => (
                    <span key={index} className="portrait-tag">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {portrait.portrait_data.summary && (
              <div className="portrait-item">
                <div className="portrait-label">整体画像</div>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  {portrait.portrait_data.summary}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>还没有生成用户画像</p>
            <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
              写一周日记后点击"刷新画像"按钮生成
            </p>
          </div>
        )}
      </div>

      <Modal
        title={<span><KeyOutlined /> 设置DeepSeek API Key</span>}
        open={apiModalVisible}
        onCancel={() => setApiModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApiModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />}
            loading={savingApiKey}
            onClick={handleSaveApiKey}
          >
            保存
          </Button>
        ]}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          请输入您的DeepSeek API Key。您可以在 
          <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">
            DeepSeek开放平台
          </a>
          获取API Key。
        </Paragraph>
        <Password
          placeholder="请输入API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
        />
      </Modal>
    </div>
  )
}

export default Profile
