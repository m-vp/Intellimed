"""
Production:
    gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 2 --timeout 120
"""
from dotenv import load_dotenv
load_dotenv()

from app import create_app
app = create_app()
