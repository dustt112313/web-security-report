import re
from markupsafe import escape
from fastapi import HTTPException


def sanitize_input(value: str, max_length: int = None) -> str:
    """Sanitize input to prevent XSS and other attacks"""
    if not value:
        return value
    
    value = escape(value.strip())
    
    if max_length and len(value) > max_length:
        raise HTTPException(status_code=400, detail=f"Input too long. Maximum {max_length} characters allowed")
    
    sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'SCRIPT', 'EXEC']
    for keyword in sql_keywords:
        value = re.sub(f'\\b{keyword}\\b', '', value, flags=re.IGNORECASE)
    
    value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
    value = re.sub(r'on\w+\s*=', '', value, flags=re.IGNORECASE)
    
    return value.strip()