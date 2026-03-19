"""Pydantic schemas for User Service API."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str
    sso_id: str
    email: str
    display_name: str
    role: str
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    is_active: bool | None = None


class RoleChangeRequest(BaseModel):
    new_role: str = Field(pattern="^(admin|analyst|viewer)$")
    reason: str | None = None


class AuditLogOut(BaseModel):
    id: str
    user_id: str
    changed_by: str
    old_role: str
    new_role: str
    reason: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationPrefsOut(BaseModel):
    id: str
    user_id: str
    email_enabled: bool
    email_address: str | None = None
    sms_enabled: bool
    sms_phone_number: str | None = None
    push_enabled: bool
    push_subscription: dict | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    notify_on: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationPrefsUpdate(BaseModel):
    email_enabled: bool | None = None
    email_address: str | None = None
    sms_enabled: bool | None = None
    sms_phone_number: str | None = None
    push_enabled: bool | None = None
    push_subscription: dict | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    notify_on: dict | None = None
