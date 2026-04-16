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
#hadeel added
from app.api.routes.step1_najm import router as step1_najm_router
from app.api.routes.step2_image import router as step2_image_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.step3_severity import router as step3_severity_router
from app.api.routes.step4_damage_type import router as step4_type_router
from fastapi.staticfiles import StaticFiles
from app.api.routes.step5_damage_part import router as step5_router
from app.api.routes.step6_damage_severity import router as step6_router
from app.api.routes import step7_pricing
from app.api.routes import step8_report

from app.api.routes.step0_auth import router as auth_router
from app.api.routes import vehicles

# تحميل المتغيرات
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

app = FastAPI(title="Qadder Backend")
#hadeel added

app.include_router(auth_router)

app.include_router(step1_najm_router)
app.include_router(step2_image_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(step3_severity_router)
app.include_router(step4_type_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
#BY SHROUG
app.include_router(step5_router)
app.include_router(step6_router)
app.include_router(step7_pricing.router)
app.include_router(step8_report.router)

app.include_router(vehicles.router)



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