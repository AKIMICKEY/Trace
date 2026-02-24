import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # 测试保存日记
        response = await client.post(
            'http://localhost:8000/api/v1/diaries',
            json={
                'content': '',
                'date': '2026-02-24',
                'time_entries': [{'time': '11:30', 'content': '测试内容'}]
            },
            headers={'X-User-ID': 'test-user-123'}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

asyncio.run(test())
