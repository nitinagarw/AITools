"""Unit tests for libs.shared.auth — UT-SH-01 through UT-SH-06."""

import pytest
from fastapi import HTTPException
from jose import jwt

from libs.shared.auth import (
    CurrentUser,
    Role,
    configure_auth,
    get_current_user,
    require_role,
    verify_internal_jwt,
    _decode_internal_token,
)

TEST_SECRET = "test-secret-key"
TEST_ALGO = "HS256"


@pytest.fixture(autouse=True)
def setup_auth():
    configure_auth(TEST_SECRET, TEST_ALGO)


# ── UT-SH-01: Valid user from headers ──

class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_valid_headers_return_user(self):
        """UT-SH-01: get_current_user returns valid CurrentUser from correct headers."""
        user = await get_current_user(
            x_user_id="user-123",
            x_user_role="admin",
            x_user_email="admin@test.com",
            x_user_sso_id="sso-123",
            x_user_display_name="Admin",
        )
        assert isinstance(user, CurrentUser)
        assert user.user_id == "user-123"
        assert user.role == Role.ADMIN
        assert user.email == "admin@test.com"

    @pytest.mark.asyncio
    async def test_missing_user_id_raises_401(self):
        """UT-SH-02: Missing x-user-id raises 401."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                x_user_id=None,
                x_user_role="admin",
            )
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_role_raises_401(self):
        """UT-SH-03: Missing x-user-role raises 401."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                x_user_id="user-123",
                x_user_role=None,
            )
        assert exc_info.value.status_code == 401


# ── UT-SH-04/05: require_role ──

class TestRequireRole:
    @pytest.mark.asyncio
    async def test_admin_allowed_for_admin_role(self):
        """UT-SH-04: require_role(ADMIN) allows admin user."""
        admin = CurrentUser(
            user_id="u1", sso_id="s1", email="a@t.com", role=Role.ADMIN
        )
        checker = require_role(Role.ADMIN)
        result = await checker(user=admin)
        assert result.role == Role.ADMIN

    @pytest.mark.asyncio
    async def test_analyst_rejected_for_admin_role(self):
        """UT-SH-05: require_role(ADMIN) raises 403 for analyst."""
        analyst = CurrentUser(
            user_id="u2", sso_id="s2", email="b@t.com", role=Role.ANALYST
        )
        checker = require_role(Role.ADMIN)
        with pytest.raises(HTTPException) as exc_info:
            await checker(user=analyst)
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_viewer_rejected_for_admin_role(self):
        """UT-SH-05: require_role(ADMIN) raises 403 for viewer."""
        viewer = CurrentUser(
            user_id="u3", sso_id="s3", email="c@t.com", role=Role.VIEWER
        )
        checker = require_role(Role.ADMIN)
        with pytest.raises(HTTPException) as exc_info:
            await checker(user=viewer)
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_multiple_roles_allowed(self):
        """require_role(ADMIN, ANALYST) allows analyst."""
        analyst = CurrentUser(
            user_id="u2", sso_id="s2", email="b@t.com", role=Role.ANALYST
        )
        checker = require_role(Role.ADMIN, Role.ANALYST)
        result = await checker(user=analyst)
        assert result.role == Role.ANALYST


# ── UT-SH-06: verify_internal_jwt ──

class TestVerifyInternalJWT:
    @pytest.mark.asyncio
    async def test_valid_internal_token(self):
        """UT-SH-06: verify_internal_jwt validates inter-service tokens."""
        token = jwt.encode({"service": "user-service"}, TEST_SECRET, algorithm=TEST_ALGO)
        result = await verify_internal_jwt(authorization=f"Bearer {token}")
        assert result["service"] == "user-service"

    @pytest.mark.asyncio
    async def test_missing_auth_header_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            await verify_internal_jwt(authorization=None)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_malformed_header_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            await verify_internal_jwt(authorization="InvalidToken")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_wrong_secret_raises_401(self):
        token = jwt.encode({"service": "x"}, "wrong-secret", algorithm=TEST_ALGO)
        with pytest.raises(HTTPException) as exc_info:
            await verify_internal_jwt(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401
