from fastapi import FastAPI
from app.database import Base, engine
from app.models import (
    AuthAccount,
    UserProfile,
    Vehicle,
    Case,
    NajmReport,
    Image,
    Damage,
    CostEstimateItem,
    TotalCostEstimate,
    QadderReport,
)

import psycopg2
from dotenv import load_dotenv
import os

# تحميل المتغيرات
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

app = FastAPI(title="Qadder Backend")


# ✅ عند تشغيل السيرفر
@app.on_event("startup")
def startup():
    # إنشاء الجداول
    Base.metadata.create_all(bind=engine)

    # اختبار الاتصال (اختياري)
    try:
        connection = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )

        cursor = connection.cursor()
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()

        print("✅ Database connected successfully!")
        print("🕒 Current Time:", result)

        cursor.close()
        connection.close()

    except Exception as e:
        print("❌ Database connection failed:", e)


# ✅ API Test
@app.get("/")
def root():
    return {"message": "Qadder backend is running successfully"}