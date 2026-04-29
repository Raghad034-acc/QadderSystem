import pytest
from app.services.step0_auth import verify_password, hash_password, login_user
from fastapi import HTTPException


# Test 1: Correct password
def test_verify_password_correct():
    password = "123456"
    hashed = hash_password(password)

    assert verify_password(password, hashed) == True


# Test 2: Wrong password
def test_verify_password_wrong():
    password = "123456"
    hashed = hash_password(password)

    assert verify_password("wrongpass", hashed) == False


# Test 3: Empty password
def test_verify_password_empty():
    password = ""
    hashed = hash_password("123456")

    assert verify_password(password, hashed) == False


# Test 4: Invalid hash
def test_verify_password_invalid_hash():
    password = "123456"
    fake_hash = "$2b$12$KIXQ4bJr3RzK8Wg0pniS4eY2pFv6pZz0J5h4r7YvZ5Q8u8nF6u9aW"

    assert verify_password(password, fake_hash) == False


# Test 5: None password
def test_verify_password_none():
    hashed = hash_password("123456")

    with pytest.raises(Exception):
        verify_password(None, hashed)


#--------------------------------------------------------
# Mock classes
class FakeAccount:
    def __init__(self, email, phone, password_hash, status="active"):
        self.id = "1"
        self.email = email
        self.phone_number = phone
        self.password_hash = password_hash
        self.account_status = status


class FakeProfile:
    def __init__(self):
        self.id = "profile1"
        self.first_name = "Test"
        self.last_name = "User"


# Fake DB
class FakeQuery:
    def __init__(self, result):
        self.result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.result

    def all(self):
        return []


class FakeDB:
    def __init__(self, account=None, profile=None):
        self.account = account
        self.profile = profile

    def query(self, model):
        if model.__name__ == "AuthAccount":
            return FakeQuery(self.account)
        elif model.__name__ == "UserProfile":
            return FakeQuery(self.profile)
        else:
            return FakeQuery([])


# Fake payload
class FakePayload:
    def __init__(self, login, password):
        self.login = login
        self.password = password


# ----------------------------------------
# Test 1: Successful login
# ----------------------------------------
def test_login_success():
    from app.services.step0_auth import hash_password

    password = "123456"
    hashed = hash_password(password)

    account = FakeAccount("test@mail.com", "0500000000", hashed)
    profile = FakeProfile()

    db = FakeDB(account, profile)
    payload = FakePayload("test@mail.com", password)

    result = login_user(db, payload)

    assert result["message"] == "login successful"


# ----------------------------------------
# Test 2: Account not found
# ----------------------------------------
def test_login_account_not_found():
    db = FakeDB(account=None)
    payload = FakePayload("notfound@mail.com", "123456")

    with pytest.raises(HTTPException) as exc:
        login_user(db, payload)

    assert exc.value.status_code == 404


# ----------------------------------------
# Test 3: Account not active
# ----------------------------------------
def test_login_inactive_account():
    from app.services.step0_auth import hash_password

    hashed = hash_password("123456")
    account = FakeAccount("test@mail.com", "0500000000", hashed, status="inactive")

    db = FakeDB(account)
    payload = FakePayload("test@mail.com", "123456")

    with pytest.raises(HTTPException) as exc:
        login_user(db, payload)

    assert exc.value.status_code == 403


# ----------------------------------------
# Test 4: Wrong password
# ----------------------------------------
def test_login_wrong_password():
    from app.services.step0_auth import hash_password

    hashed = hash_password("123456")
    account = FakeAccount("test@mail.com", "0500000000", hashed)

    db = FakeDB(account)
    payload = FakePayload("test@mail.com", "wrong")

    with pytest.raises(HTTPException) as exc:
        login_user(db, payload)

    assert exc.value.status_code == 401