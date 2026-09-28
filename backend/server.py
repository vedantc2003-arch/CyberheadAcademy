from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import re
import time
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Annotated

import jwt
import bcrypt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict, BeforeValidator

from seed_data import COURSES, INSTRUCTORS, TESTIMONIALS, FAQS

# ---------------------------------------------------------------------------
# Config & DB
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@cyberheadacademy.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cyberhead")

app = FastAPI(title="CyberHead Academy API", version="1.0.0", docs_url="/api/swagger", openapi_url="/api/openapi.json")
api = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Helpers: Mongo model base
# ---------------------------------------------------------------------------
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return now_utc().isoformat()


def serialize(doc: dict) -> dict:
    """Convert a Mongo document to a JSON-safe dict, dropping sensitive fields."""
    if not doc:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    out.pop("password_hash", None)
    return out


# ---------------------------------------------------------------------------
# Password + JWT
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": now_utc() + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except (jwt.InvalidTokenError, InvalidId):
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=43200, path="/")


# ---------------------------------------------------------------------------
# Simple in-memory rate limiting + brute-force tracking
# ---------------------------------------------------------------------------
_rate_buckets: dict = {}


def rate_limit(key: str, limit: int, window_sec: int) -> bool:
    """Return True if allowed, False if over limit."""
    now = time.time()
    bucket = _rate_buckets.get(key, [])
    bucket = [t for t in bucket if now - t < window_sec]
    if len(bucket) >= limit:
        _rate_buckets[key] = bucket
        return False
    bucket.append(now)
    _rate_buckets[key] = bucket
    return True


# ---------------------------------------------------------------------------
# Request classification (SAFE — pattern match only, never executed)
# ---------------------------------------------------------------------------
_SQLI = re.compile(r"(\bunion\b.*\bselect\b|\bor\b\s+1\s*=\s*1|--|;\s*drop\b|\bselect\b.*\bfrom\b|'\s*or\s*')", re.I)
_XSS = re.compile(r"(<script|onerror\s*=|onload\s*=|javascript:|<img[^>]+src|<svg|alert\s*\()", re.I)
_CMD = re.compile(r"(;\s*(cat|ls|whoami|id|rm|wget|curl)\b|\|\s*(cat|ls|nc)\b|`.*`|\$\(.*\))", re.I)
_TRAVERSAL = re.compile(r"(\.\./|\.\.\\|/etc/passwd|c:\\\\windows)", re.I)


def classify_input(text: str) -> str:
    if not text:
        return "NORMAL"
    if _SQLI.search(text):
        return "SQL_INJECTION"
    if _XSS.search(text):
        return "XSS"
    if _CMD.search(text):
        return "COMMAND_INJECTION"
    if _TRAVERSAL.search(text):
        return "PATH_TRAVERSAL"
    return "NORMAL"


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------------------
# Request logging middleware (never logs secrets)
# ---------------------------------------------------------------------------
class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        request_id = uuid.uuid4().hex[:16]
        request.state.request_id = request_id
        response = await call_next(request)
        elapsed_ms = round((time.time() - start) * 1000, 2)
        response.headers["X-Request-Id"] = request_id
        path = request.url.path
        if path.startswith("/api") and not path.startswith("/api/openapi") and path != "/api/swagger":
            query = request.url.query or ""
            is_sec = "/api/security-test" in path
            classification = classify_input(query) if query else "NORMAL"
            doc = {
                "request_id": request_id,
                "timestamp": iso_now(),
                "method": request.method,
                "path": path,
                "status_code": response.status_code,
                "response_time_ms": elapsed_ms,
                "user_agent": request.headers.get("user-agent", "unknown")[:400],
                "source_ip": client_ip(request),
                "input_length": len(query),
                "classification": classification,
                "is_security_test": is_sec,
            }
            try:
                await db.request_logs.insert_one(doc)
            except Exception as e:  # logging must never break requests
                logger.warning(f"log insert failed: {e}")
        return response


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: Optional[str] = Field(default=None, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=500)
    photo: Optional[str] = Field(default=None, max_length=500)


class ContactIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=140)
    message: str = Field(min_length=5, max_length=2000)


class SecurityInput(BaseModel):
    payload: Optional[str] = Field(default="", max_length=4000)
    label: Optional[str] = Field(default="", max_length=120)


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(data: RegisterIn, request: Request, response: Response):
    ip = client_ip(request)
    if not rate_limit(f"register:{ip}", 10, 3600):
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        # Do not reveal existence explicitly — generic message
        raise HTTPException(status_code=409, detail="Unable to create account with these details.")
    doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "student",
        "bio": "",
        "photo": "",
        "security_score": 0,
        "created_at": iso_now(),
        "updated_at": iso_now(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email, "student")
    set_auth_cookie(response, token)
    doc["_id"] = res.inserted_id
    return {"user": serialize(doc), "token": token}


@api.post("/auth/login")
async def login(data: LoginIn, request: Request, response: Response):
    ip = client_ip(request)
    email = data.email.lower()
    lock_key = f"login:{ip}:{email}"
    if not rate_limit(lock_key, 8, 900):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please wait 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(str(user["_id"]), email, user.get("role", "student"))
    set_auth_cookie(response, token)
    return {"user": serialize(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": serialize(user)}


# ---------------------------------------------------------------------------
# Course routes
# ---------------------------------------------------------------------------
def _course_public(doc: dict) -> dict:
    out = serialize(doc)
    inst_key = out.get("instructor")
    out["instructor"] = INSTRUCTORS.get(inst_key, {"name": inst_key, "avatar": "", "title": ""})
    out["lessons_count"] = sum(len(m["lessons"]) for m in out.get("modules", []))
    return out


@api.get("/courses")
async def list_courses(category: Optional[str] = None, difficulty: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    docs = await db.courses.find(query).to_list(100)
    return {"courses": [_course_public(d) for d in docs]}


@api.get("/courses/search")
async def search_courses(q: str = ""):
    q = (q or "").strip()
    if not q:
        return {"query": q, "count": 0, "courses": []}
    # Parameterized regex search — MongoDB handles escaping; input never concatenated into a query string.
    safe = re.escape(q)
    regex = {"$regex": safe, "$options": "i"}
    docs = await db.courses.find({
        "$or": [{"title": regex}, {"short": regex}, {"description": regex}, {"category": regex}]
    }).to_list(100)
    return {"query": q, "count": len(docs), "courses": [_course_public(d) for d in docs]}


@api.get("/courses/{course_id}")
async def get_course(course_id: str):
    doc = None
    try:
        doc = await db.courses.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        doc = None
    if not doc:
        doc = await db.courses.find_one({"slug": course_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"course": _course_public(doc)}


@api.post("/courses/{course_id}/enroll")
async def enroll(course_id: str, user: dict = Depends(get_current_user)):
    try:
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        course = await db.courses.find_one({"slug": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    cid = str(course["_id"])
    uid = str(user["_id"])
    existing = await db.enrollments.find_one({"user_id": uid, "course_id": cid})
    if existing:
        return {"enrollment": serialize(existing), "already": True}
    doc = {
        "user_id": uid,
        "course_id": cid,
        "course_title": course["title"],
        "progress": 0,
        "completed_lessons": 0,
        "total_lessons": sum(len(m["lessons"]) for m in course.get("modules", [])),
        "created_at": iso_now(),
        "updated_at": iso_now(),
    }
    res = await db.enrollments.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {"enrollment": serialize(doc), "already": False}


# ---------------------------------------------------------------------------
# User / profile / enrollments
# ---------------------------------------------------------------------------
@api.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return {"user": serialize(user)}


@api.put("/user/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = iso_now()
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return {"user": serialize(fresh)}


@api.get("/user/enrollments")
async def my_enrollments(user: dict = Depends(get_current_user)):
    docs = await db.enrollments.find({"user_id": str(user["_id"])}).to_list(100)
    return {"enrollments": [serialize(d) for d in docs]}


@api.get("/user/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    enrollments = await db.enrollments.find({"user_id": uid}).to_list(100)
    activity = await db.request_logs.find({"is_security_test": True}).sort("timestamp", -1).to_list(6)
    completed = sum(e.get("completed_lessons", 0) for e in enrollments)
    return {
        "user": serialize(user),
        "enrollments": [serialize(e) for e in enrollments],
        "stats": {
            "security_score": user.get("security_score", 720),
            "enrolled": len(enrollments),
            "labs_completed": completed,
            "hours_spent": completed * 2 + len(enrollments) * 6,
        },
        "recent_activity": [serialize(a) for a in activity],
    }


# ---------------------------------------------------------------------------
# Contact
# ---------------------------------------------------------------------------
@api.post("/contact")
async def contact(data: ContactIn, request: Request):
    ip = client_ip(request)
    if not rate_limit(f"contact:{ip}", 5, 600):
        raise HTTPException(status_code=429, detail="Too many submissions. Please try again shortly.")
    doc = data.model_dump()
    doc["email"] = doc["email"].lower()
    doc["source_ip"] = ip
    doc["status"] = "new"
    doc["created_at"] = iso_now()
    res = await db.contact_messages.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {"success": True, "message": "Thanks — our team will get back to you shortly.", "id": str(res.inserted_id)}


# ---------------------------------------------------------------------------
# Security Lab test endpoints (SAFE — inputs classified & logged, never executed)
# ---------------------------------------------------------------------------
@api.get("/security-test/search")
async def sec_search(q: str = "", request: Request = None):
    return {
        "status": "success",
        "endpoint": "/api/security-test/search",
        "query": q,
        "input_length": len(q),
        "classification": classify_input(q),
        "requestId": request.state.request_id,
        "processed": "Input received and safely handled. No query executed.",
    }


@api.post("/security-test/input")
async def sec_input(data: SecurityInput, request: Request):
    text = data.payload or ""
    return {
        "status": "success",
        "endpoint": "/api/security-test/input",
        "label": data.label,
        "input_length": len(text),
        "classification": classify_input(text),
        "requestId": request.state.request_id,
        "processed": "Payload accepted and stored for demonstration. Not executed.",
    }


@api.get("/security-test/resource")
async def sec_resource(id: str = "", request: Request = None):
    return {
        "status": "success",
        "endpoint": "/api/security-test/resource",
        "resource_id": id,
        "classification": classify_input(id),
        "requestId": request.state.request_id,
        "processed": "Resource lookup simulated safely.",
    }


@api.post("/security-test/traffic")
async def sec_traffic(request: Request):
    ip = client_ip(request)
    allowed = rate_limit(f"traffic:{ip}", 60, 60)
    return {
        "status": "success",
        "message": "Traffic received",
        "rate_limited": not allowed,
        "requestId": request.state.request_id,
    }


@api.get("/security-test/traffic")
async def sec_traffic_get(request: Request):
    ip = client_ip(request)
    allowed = rate_limit(f"traffic:{ip}", 60, 60)
    return {
        "status": "success",
        "message": "Traffic received",
        "rate_limited": not allowed,
        "requestId": request.state.request_id,
    }


@api.get("/security-test/stats")
async def sec_stats():
    """Public security-lab metrics for the dashboard."""
    today_start = now_utc().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    total = await db.request_logs.count_documents({})
    today = await db.request_logs.count_documents({"timestamp": {"$gte": today_start}})
    get_count = await db.request_logs.count_documents({"method": "GET"})
    post_count = await db.request_logs.count_documents({"method": "POST"})
    suspicious = await db.request_logs.count_documents({"classification": {"$ne": "NORMAL"}})
    recent = await db.request_logs.find({}).sort("timestamp", -1).to_list(15)
    # per-classification breakdown
    pipeline = [{"$group": {"_id": "$classification", "count": {"$sum": 1}}}]
    by_class = {row["_id"]: row["count"] async for row in db.request_logs.aggregate(pipeline)}
    # hourly buckets (last 12h)
    logs = await db.request_logs.find({}).sort("timestamp", -1).to_list(2000)
    buckets = {}
    for l in logs:
        try:
            hr = l["timestamp"][11:13] + ":00"
        except Exception:
            continue
        b = buckets.setdefault(hr, {"hour": hr, "total": 0, "suspicious": 0})
        b["total"] += 1
        if l.get("classification") != "NORMAL":
            b["suspicious"] += 1
    timeline = sorted(buckets.values(), key=lambda x: x["hour"])[-12:]
    return {
        "total_requests": total,
        "requests_today": today,
        "methods": {"GET": get_count, "POST": post_count},
        "suspicious": suspicious,
        "by_classification": by_class,
        "timeline": timeline,
        "recent": [serialize(r) for r in recent],
    }


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@api.get("/admin/overview")
async def admin_overview(_: dict = Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "courses": await db.courses.count_documents({}),
        "enrollments": await db.enrollments.count_documents({}),
        "messages": await db.contact_messages.count_documents({}),
        "requests": await db.request_logs.count_documents({}),
        "suspicious": await db.request_logs.count_documents({"classification": {"$ne": "NORMAL"}}),
    }


@api.get("/admin/users")
async def admin_users(_: dict = Depends(require_admin)):
    docs = await db.users.find({}).sort("created_at", -1).to_list(500)
    return {"users": [serialize(d) for d in docs]}


@api.get("/admin/enrollments")
async def admin_enrollments(_: dict = Depends(require_admin)):
    docs = await db.enrollments.find({}).sort("created_at", -1).to_list(500)
    return {"enrollments": [serialize(d) for d in docs]}


@api.get("/admin/messages")
async def admin_messages(_: dict = Depends(require_admin)):
    docs = await db.contact_messages.find({}).sort("created_at", -1).to_list(500)
    return {"messages": [serialize(d) for d in docs]}


@api.get("/admin/logs")
async def admin_logs(_: dict = Depends(require_admin), limit: int = 100):
    docs = await db.request_logs.find({}).sort("timestamp", -1).to_list(min(limit, 500))
    return {"logs": [serialize(d) for d in docs]}


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"name": "CyberHead Academy API", "status": "ok", "version": "1.0.0"}


@api.get("/meta")
async def meta():
    return {"testimonials": TESTIMONIALS, "faqs": FAQS,
            "categories": ["Web Security", "Pentesting", "WAF & Defense", "Bug Bounty"],
            "difficulties": ["Beginner", "Intermediate", "Advanced"]}


@api.get("/docs-spec")
async def docs_spec():
    """Human-friendly endpoint catalogue for the /api/docs page."""
    groups = [
        {"group": "Authentication", "endpoints": [
            {"method": "POST", "path": "/api/auth/register", "desc": "Create a new student account"},
            {"method": "POST", "path": "/api/auth/login", "desc": "Authenticate and receive a JWT"},
            {"method": "POST", "path": "/api/auth/logout", "desc": "Clear the session cookie"},
            {"method": "GET", "path": "/api/auth/me", "desc": "Get the current authenticated user"},
        ]},
        {"group": "Courses", "endpoints": [
            {"method": "GET", "path": "/api/courses", "desc": "List all courses"},
            {"method": "GET", "path": "/api/courses/:id", "desc": "Get a single course with curriculum"},
            {"method": "GET", "path": "/api/courses/search?q=", "desc": "Search courses (parameterized)"},
            {"method": "POST", "path": "/api/courses/:id/enroll", "desc": "Enroll the current user"},
        ]},
        {"group": "User", "endpoints": [
            {"method": "GET", "path": "/api/user/profile", "desc": "Get profile"},
            {"method": "PUT", "path": "/api/user/profile", "desc": "Update profile"},
            {"method": "GET", "path": "/api/user/enrollments", "desc": "List enrollments"},
            {"method": "GET", "path": "/api/user/dashboard", "desc": "Dashboard aggregate"},
        ]},
        {"group": "Contact", "endpoints": [
            {"method": "POST", "path": "/api/contact", "desc": "Submit a support message"},
        ]},
        {"group": "Security Lab", "endpoints": [
            {"method": "GET", "path": "/api/security-test/search?q=", "desc": "Safe search test endpoint"},
            {"method": "POST", "path": "/api/security-test/input", "desc": "Safe input test endpoint"},
            {"method": "GET", "path": "/api/security-test/resource?id=", "desc": "Safe resource test endpoint"},
            {"method": "GET/POST", "path": "/api/security-test/traffic", "desc": "Rate-limit demo endpoint"},
            {"method": "GET", "path": "/api/security-test/stats", "desc": "Live traffic metrics"},
        ]},
    ]
    return {"base_url": "/api", "groups": groups}


app.include_router(api)


# ---------------------------------------------------------------------------
# Error handling — consistent JSON envelope
# ---------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    codes = {400: "BAD_REQUEST", 401: "UNAUTHORIZED", 403: "FORBIDDEN",
             404: "NOT_FOUND", 409: "CONFLICT", 429: "RATE_LIMITED"}
    return JSONResponse(status_code=exc.status_code, content={
        "success": False,
        "error": {"code": codes.get(exc.status_code, "ERROR"), "message": exc.detail},
    })


@app.exception_handler(Exception)
async def unhandled_exc_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={
        "success": False,
        "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."},
    })


# ---------------------------------------------------------------------------
# Middleware & CORS
# ---------------------------------------------------------------------------
app.add_middleware(RequestLogMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"],
)


# Security headers
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    return response


# ---------------------------------------------------------------------------
# Startup: indexes + seed
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.courses.create_index("slug", unique=True)
    await db.courses.create_index("title")
    await db.courses.create_index("category")
    await db.enrollments.create_index([("user_id", 1), ("course_id", 1)])
    await db.request_logs.create_index("timestamp")
    await db.request_logs.create_index("classification")
    await db.contact_messages.create_index("created_at")

    # Seed admin
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if not existing_admin:
        await db.users.insert_one({
            "name": "CyberHead Admin",
            "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "bio": "Platform administrator",
            "photo": "",
            "security_score": 1000,
            "created_at": iso_now(),
            "updated_at": iso_now(),
        })
        logger.info("Seeded admin user")
    elif not verify_password(ADMIN_PASSWORD, existing_admin["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL.lower()},
                                  {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})

    # Seed demo student
    student_email = "sanket@cyberheadacademy.com"
    student = await db.users.find_one({"email": student_email})
    if not student:
        res = await db.users.insert_one({
            "name": "Sanket",
            "email": student_email,
            "password_hash": hash_password("Student@2025"),
            "role": "student",
            "bio": "Aspiring bug bounty hunter and web security enthusiast.",
            "photo": "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=srgb&fm=jpg&q=85&w=256",
            "security_score": 720,
            "created_at": iso_now(),
            "updated_at": iso_now(),
        })
        student = await db.users.find_one({"_id": res.inserted_id})

    # Seed courses
    for c in COURSES:
        existing = await db.courses.find_one({"slug": c["slug"]})
        payload = {**c, "updated_at": iso_now()}
        if existing:
            await db.courses.update_one({"slug": c["slug"]}, {"$set": payload})
        else:
            payload["created_at"] = iso_now()
            await db.courses.insert_one(payload)

    # Seed demo enrollments for the student with progress
    if student:
        uid = str(student["_id"])
        demo = [("web-application-security", 72), ("bug-bounty-hunting", 48), ("api-security-fundamentals", 31)]
        for slug, prog in demo:
            course = await db.courses.find_one({"slug": slug})
            if not course:
                continue
            cid = str(course["_id"])
            total = sum(len(m["lessons"]) for m in course.get("modules", []))
            if not await db.enrollments.find_one({"user_id": uid, "course_id": cid}):
                await db.enrollments.insert_one({
                    "user_id": uid, "course_id": cid, "course_title": course["title"],
                    "progress": prog, "completed_lessons": round(total * prog / 100),
                    "total_lessons": total, "created_at": iso_now(), "updated_at": iso_now(),
                })
    logger.info("Startup seed complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()
