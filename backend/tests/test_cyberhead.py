"""CyberHead Academy backend regression suite."""
import os
import time
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://academy-staging-11.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@cyberheadacademy.com", "password": "CyberHead@Admin2025"}
STUDENT = {"email": "sanket@cyberheadacademy.com", "password": "Student@2025"}


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _login(s, creds):
    r = s.post(f"{API}/auth/login", json=creds)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token(s):
    return _login(s, ADMIN)


@pytest.fixture(scope="module")
def student_token(s):
    return _login(s, STUDENT)


# ------------ Meta & Courses ------------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_courses_count_is_8(s):
    r = s.get(f"{API}/courses")
    assert r.status_code == 200
    data = r.json()
    assert len(data["courses"]) == 8
    c = data["courses"][0]
    for k in ("id", "title", "slug", "category", "difficulty", "modules", "lessons_count"):
        assert k in c
    assert isinstance(c["instructor"], dict)


def test_courses_filter_category(s):
    r = s.get(f"{API}/courses", params={"category": "Web Security"})
    assert r.status_code == 200
    for c in r.json()["courses"]:
        assert c["category"] == "Web Security"


def test_course_search(s):
    r = s.get(f"{API}/courses/search", params={"q": "web"})
    assert r.status_code == 200
    j = r.json()
    assert j["count"] >= 1
    assert any("web" in c["title"].lower() or "web" in c["category"].lower() for c in j["courses"])


def test_course_search_empty(s):
    r = s.get(f"{API}/courses/search", params={"q": "zzzzznope"})
    assert r.status_code == 200
    assert r.json()["count"] == 0


def test_course_by_slug_and_id(s):
    r = s.get(f"{API}/courses")
    c0 = r.json()["courses"][0]
    slug = c0["slug"]
    cid = c0["id"]
    for key in (slug, cid):
        r2 = s.get(f"{API}/courses/{key}")
        assert r2.status_code == 200, key
        assert r2.json()["course"]["slug"] == slug


def test_course_not_found(s):
    r = s.get(f"{API}/courses/nonexistent-slug-xyz")
    assert r.status_code == 404
    body = r.json()
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"


# ------------ Auth ------------
def test_login_admin(s):
    r = s.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200
    j = r.json()
    assert j["user"]["role"] == "admin"
    assert "password_hash" not in j["user"]
    assert j["token"]


def test_login_student(s):
    r = s.post(f"{API}/auth/login", json=STUDENT)
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "student"


def test_login_invalid_generic_message(s):
    r = s.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "wrongpass"})
    assert r.status_code == 401
    body = r.json()
    assert body["error"]["message"] == "Invalid email or password."
    # Should not reveal existence
    r2 = s.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrongpass"})
    assert r2.status_code in (401, 429)
    if r2.status_code == 401:
        assert r2.json()["error"]["message"] == "Invalid email or password."


def test_register_and_login_flow(s):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Test User", "email": email,
        "password": "Passw0rd!123", "confirm_password": "Passw0rd!123"
    })
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert token
    # /auth/me
    r2 = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["user"]["email"] == email


def test_register_duplicate():
    r = requests.post(f"{API}/auth/register", json={
        "name": "XY", "email": ADMIN["email"],
        "password": "Passw0rd!123", "confirm_password": "Passw0rd!123"
    })
    assert r.status_code == 409, r.text


def test_auth_me_requires_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ------------ Student dashboard & profile ------------
def test_dashboard(s, student_token):
    r = s.get(f"{API}/user/dashboard", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    j = r.json()
    assert j["stats"]["enrolled"] >= 3
    progresses = sorted({e["progress"] for e in j["enrollments"]} & {31, 48, 72})
    assert progresses == [31, 48, 72]


def test_profile_update(s, student_token):
    h = {"Authorization": f"Bearer {student_token}"}
    r = s.put(f"{API}/user/profile", json={"bio": "Updated bio for test"}, headers=h)
    assert r.status_code == 200
    assert r.json()["user"]["bio"] == "Updated bio for test"
    # verify persisted
    r2 = s.get(f"{API}/user/profile", headers=h)
    assert r2.json()["user"]["bio"] == "Updated bio for test"


# ------------ Enroll (idempotent) ------------
def test_enroll_idempotent(s, student_token):
    h = {"Authorization": f"Bearer {student_token}"}
    courses = s.get(f"{API}/courses").json()["courses"]
    # pick a slug that student is not already enrolled in
    enrolled = s.get(f"{API}/user/enrollments", headers=h).json()["enrollments"]
    taken_titles = {e["course_title"] for e in enrolled}
    target = next(c for c in courses if c["title"] not in taken_titles)
    r1 = s.post(f"{API}/courses/{target['slug']}/enroll", headers=h)
    assert r1.status_code == 200
    j1 = r1.json()
    r2 = s.post(f"{API}/courses/{target['slug']}/enroll", headers=h)
    assert r2.status_code == 200
    assert r2.json()["already"] is True


def test_enroll_requires_auth():
    r = requests.post(f"{API}/courses/web-application-security/enroll")
    assert r.status_code == 401


# ------------ Contact ------------
def test_contact_submission(s):
    r = s.post(f"{API}/contact", json={
        "name": "Tester", "email": f"c_{uuid.uuid4().hex[:6]}@ex.com",
        "subject": "Hello", "message": "This is a test message from pytest."
    })
    assert r.status_code == 200
    assert r.json()["success"] is True


# ------------ Security Lab ------------
@pytest.mark.parametrize("payload,expected", [
    ("' OR 1=1 --", "SQL_INJECTION"),
    ("UNION SELECT password FROM users", "SQL_INJECTION"),
    ("<script>alert(1)</script>", "XSS"),
    ("<img src=x onerror=alert(1)>", "XSS"),
    ("; cat /etc/passwd", "COMMAND_INJECTION"),
    ("hello world", "NORMAL"),
])
def test_security_classification_input(s, payload, expected):
    r = s.post(f"{API}/security-test/input", json={"payload": payload, "label": "test"})
    assert r.status_code == 200
    assert r.json()["classification"] == expected


def test_security_search_classify(s):
    r = s.get(f"{API}/security-test/search", params={"q": "' OR 1=1--"})
    assert r.status_code == 200
    assert r.json()["classification"] == "SQL_INJECTION"


def test_security_resource(s):
    r = s.get(f"{API}/security-test/resource", params={"id": "../../etc/passwd"})
    assert r.status_code == 200
    assert r.json()["classification"] == "PATH_TRAVERSAL"


def test_security_traffic_burst(s):
    for _ in range(12):
        r = s.post(f"{API}/security-test/traffic")
        assert r.status_code == 200


def test_security_stats(s):
    r = s.get(f"{API}/security-test/stats")
    assert r.status_code == 200
    j = r.json()
    for k in ("total_requests", "methods", "recent", "timeline", "by_classification"):
        assert k in j
    assert j["total_requests"] >= 1
    assert j["methods"]["GET"] >= 0 and j["methods"]["POST"] >= 0


# ------------ Admin ------------
def test_admin_requires_auth():
    r = requests.get(f"{API}/admin/users")
    assert r.status_code == 401


def test_admin_forbidden_for_student(s, student_token):
    r = s.get(f"{API}/admin/users", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 403


def test_admin_endpoints(s, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    for path in ("overview", "users", "enrollments", "messages", "logs"):
        r = s.get(f"{API}/admin/{path}", headers=h)
        assert r.status_code == 200, path


def test_admin_logs_contain_classification(s, admin_token):
    r = s.get(f"{API}/admin/logs", headers={"Authorization": f"Bearer {admin_token}"}, params={"limit": 50})
    assert r.status_code == 200
    logs = r.json()["logs"]
    assert len(logs) > 0
    sample = logs[0]
    for k in ("request_id", "method", "path", "status_code", "response_time_ms",
              "user_agent", "source_ip", "classification"):
        assert k in sample


# ------------ Docs / Meta ------------
def test_docs_spec(s):
    r = s.get(f"{API}/docs-spec")
    assert r.status_code == 200
    assert len(r.json()["groups"]) >= 5


def test_swagger(s):
    r = s.get(f"{API}/swagger")
    assert r.status_code == 200


def test_meta(s):
    r = s.get(f"{API}/meta")
    j = r.json()
    assert "testimonials" in j and "faqs" in j and "categories" in j


# ------------ Rate limit brute force ------------
def test_login_rate_limit_eventually(s):
    email = f"rl_{uuid.uuid4().hex[:8]}@ex.com"
    got_429 = False
    for _ in range(12):
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "wrongwrong"})
        if r.status_code == 429:
            got_429 = True
            break
    assert got_429, "Expected 429 after repeated bad logins"
