import httpx
import json
import logging
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL

logger = logging.getLogger(__name__)


def set_user_api_key(api_key: str) -> str:
    return api_key if api_key else DEEPSEEK_API_KEY


async def call_deepseek(prompt: str, timeout: int = 30, user_api_key: str = None) -> dict:
    api_key = user_api_key if user_api_key else DEEPSEEK_API_KEY
    if not api_key:
        return {"error": "DeepSeek API Key未配置，请在个人中心设置"}
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一个温暖、有同理心的AI助手，专门帮助用户反思和成长。请用JSON格式回复。"},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7
    }
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(DEEPSEEK_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"DeepSeek API error: {response.status_code} - {error_detail}")
                try:
                    error_json = response.json()
                    if "error" in error_json:
                        msg = error_json["error"].get("message", error_detail)
                        return {"error": f"API错误: {msg}"}
                except:
                    pass
                return {"error": f"API调用失败({response.status_code})"}
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)
    except httpx.TimeoutException:
        return {"error": "AI服务响应超时，请稍后重试"}
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return {"error": "AI返回数据格式错误"}
    except Exception as e:
        logger.error(f"AI service error: {str(e)}")
        return {"error": f"AI服务调用失败: {str(e)}"}


async def generate_diary_evaluation(diary_content: str, time_entries: list, recent_diaries: list, portrait_data: dict = None, user_api_key: str = None) -> dict:
    def format_diary(d):
        text = f"[{d['date']}]"
        if d.get('time_entries'):
            for entry in d['time_entries']:
                text += f"\n  {entry['time']} - {entry['content']}"
        if d.get('content'):
            text += f"\n  {d['content']}"
        return text
    
    recent_text = "\n".join([
        format_diary(d) 
        for d in recent_diaries[:5]
    ]) if recent_diaries else "暂无历史记录"
    
    current_text = ""
    if time_entries:
        current_text = "今日时间点记录：\n"
        for entry in time_entries:
            current_text += f"  {entry['time']} - {entry['content']}\n"
    if diary_content:
        current_text += f"\n日记内容：\n{diary_content}"
    
    portrait_text = json.dumps(portrait_data, ensure_ascii=False) if portrait_data else "暂无用户画像"
    
    prompt = f"""请根据以下信息，从多个角度对用户的日记给出贴心评价：

当前日记：
{current_text if current_text else "暂无内容"}

用户最近5篇日记：
{recent_text}

用户画像：
{portrait_text}

请从以下角度给出评价（每个角度用一段话，温暖有同理心）：
1. 情感角度：分析用户当前的情绪状态
2. 成长角度：发现用户的成长和进步
3. 建议角度：给出温和的建议或鼓励
4. 共鸣角度：表达对用户感受的理解

请以JSON格式返回，格式如下：
{{
    "情感角度": "...",
    "成长角度": "...",
    "建议角度": "...",
    "共鸣角度": "..."
}}"""
    
    return await call_deepseek(prompt, user_api_key=user_api_key)


async def generate_user_portrait(diaries: list, user_api_key: str = None) -> dict:
    def format_diary(d):
        text = f"[{d['date']}]"
        if d.get('time_entries'):
            for entry in d['time_entries']:
                text += f"\n  {entry['time']} - {entry['content']}"
        if d.get('content'):
            text += f"\n  {d['content']}"
        return text
    
    diaries_text = "\n".join([
        format_diary(d) 
        for d in diaries
    ])
    
    prompt = f"""根据用户以下日记内容（按时间排序），总结他的性格特点、关注主题、情绪变化和重要事件：

{diaries_text}

请以JSON格式返回，格式如下：
{{
    "personality": ["性格特点1", "性格特点2"],
    "focus_themes": ["关注主题1", "关注主题2"],
    "emotion_trend": "情绪变化趋势描述",
    "important_events": ["重要事件1", "重要事件2"],
    "summary": "整体画像总结"
}}"""
    
    return await call_deepseek(prompt, timeout=60, user_api_key=user_api_key)
