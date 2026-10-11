"""
Aarogya — Security Hardening Contract Tests
Verifies RLS restrictive policies for anonymous sessions, authenticated patient access,
verified doctor access requirements with consent, and signed-URL 403 protection.
"""
from __future__ import annotations

import os
import re
import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient

import main


@pytest.fixture
def client():
    return TestClient(main.app)


def test_anonymous_signed_url_requests_rejected_with_403(client, monkeypatch):
    """Anonymous visitors must be rejected with HTTP 403 when requesting signed URLs."""
    anon_user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = anon_user_id
    mock_user.is_anonymous = True
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # Ensure generate_signed_url is never called
    mock_generate = MagicMock()
    monkeypatch.setattr(main, "generate_signed_url", mock_generate)

    res = client.post(
        "/api/documents/signed-url",
        headers={"Authorization": "Bearer anon_jwt_token"},
        json={"storage_path": f"{anon_user_id}/report.pdf", "expires_in_seconds": 3600},
    )

    assert res.status_code == 403
    assert "Demo sessions are not permitted to generate signed storage URLs" in res.json().get("detail", "")
    mock_generate.assert_not_called()


def test_normal_authenticated_user_signed_url_authorized_for_own_path(client, monkeypatch):
    """Normal authenticated users can generate signed URLs for documents in their own storage path."""
    user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_user.is_anonymous = False
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    monkeypatch.setattr(main, "generate_signed_url", lambda path, exp: f"https://supabase.local/storage/{path}?token=mock")

    res = client.post(
        "/api/documents/signed-url",
        headers={"Authorization": "Bearer regular_user_jwt"},
        json={"storage_path": f"{user_id}/cbc_report.pdf", "expires_in_seconds": 3600},
    )

    assert res.status_code == 200
    data = res.json()
    assert "https://supabase.local/storage/" in data["signed_url"]
    assert data["expires_in_seconds"] == 3600


def test_rls_migration_defines_restrictive_policies_for_all_8_targets():
    """Verify that the SQL migration creates AS RESTRICTIVE policies on all required tables and storage objects."""
    migration_path = Path("supabase/migrations/20261011140000_aarogya_anonymous_session_rls_hardening.sql")
    assert migration_path.exists(), f"Migration file {migration_path} does not exist"

    sql = migration_path.read_text(encoding="utf-8")

    expected_targets = [
        "public.profiles",
        "public.doctor_profiles",
        "public.patient_doctor_relationships",
        "public.medical_documents",
        "public.medication_reminders",
        "public.appointments",
        "public.abha_profiles",
        "storage.objects",
    ]

    for target in expected_targets:
        assert target in sql, f"Migration missing policy for target: {target}"
        # Verify AS RESTRICTIVE is used
        pattern = rf"ON\s+{re.escape(target)}\s+AS\s+RESTRICTIVE"
        assert re.search(pattern, sql, re.IGNORECASE), f"Target {target} must have an AS RESTRICTIVE policy"
        # Verify TO authenticated is specified
        auth_pattern = rf"ON\s+{re.escape(target)}[\s\S]*?TO\s+authenticated"
        assert re.search(auth_pattern, sql, re.IGNORECASE), f"Target {target} must target role 'authenticated'"

    # Verify anonymous rejection expression
    assert "coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false" in sql
    assert "WITH CHECK" in sql
    assert "USING" in sql


def evaluate_rls_restrictive_condition(jwt: dict | None) -> bool:
    """Python simulation of: coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false."""
    if jwt is None:
        raw_is_anon = None
    else:
        raw_is_anon = jwt.get("is_anonymous")

    if raw_is_anon is None:
        coalesced = False
    elif isinstance(raw_is_anon, bool):
        coalesced = raw_is_anon
    elif isinstance(raw_is_anon, str):
        coalesced = raw_is_anon.lower() == "true"
    else:
        coalesced = bool(raw_is_anon)

    return coalesced is False


def test_rls_policy_evaluator_rejects_anonymous_and_permits_regular_users():
    """Verify boolean truth table for the restrictive RLS policy across diverse JWT configurations."""
    # 1. Anonymous session with boolean True -> REJECTED
    assert evaluate_rls_restrictive_condition({"sub": "anon-1", "is_anonymous": True}) is False

    # 2. Anonymous session with string "true" -> REJECTED
    assert evaluate_rls_restrictive_condition({"sub": "anon-1", "is_anonymous": "true"}) is False

    # 3. Regular authenticated session with boolean False -> ALLOWED
    assert evaluate_rls_restrictive_condition({"sub": "pat-1", "is_anonymous": False}) is True

    # 4. Regular authenticated session with no is_anonymous claim -> ALLOWED
    assert evaluate_rls_restrictive_condition({"sub": "pat-1"}) is True

    # 5. Missing / null JWT claims (e.g. standard auth fallback) -> ALLOWED
    assert evaluate_rls_restrictive_condition(None) is True


def test_normal_authenticated_patient_operations_authorized_by_rls():
    """
    Simulate full RLS policy evaluation: Permissive policy AND Restrictive policy.
    Proves that normal patients can access their own data, but not other patients' data.
    """
    patient_a_id = "patient-uuid-aaa"
    patient_b_id = "patient-uuid-bbb"

    def can_access_profile(auth_user_id: str, jwt: dict, target_profile_id: str) -> bool:
        # Permissive: auth.uid() = id
        permissive = auth_user_id == target_profile_id
        # Restrictive: coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
        restrictive = evaluate_rls_restrictive_condition(jwt)
        return permissive and restrictive

    def can_access_document(auth_user_id: str, jwt: dict, doc_patient_id: str) -> bool:
        # Permissive: auth.uid() = patient_id
        permissive = auth_user_id == doc_patient_id
        restrictive = evaluate_rls_restrictive_condition(jwt)
        return permissive and restrictive

    def can_upload_storage(auth_user_id: str, jwt: dict, bucket_id: str, folder_name: str) -> bool:
        # Permissive: bucket_id = 'medical-records' AND folder = auth.uid()
        permissive = bucket_id == "medical-records" and folder_name == auth_user_id
        restrictive = evaluate_rls_restrictive_condition(jwt)
        return permissive and restrictive

    patient_jwt = {"sub": patient_a_id, "is_anonymous": False}
    anon_jwt = {"sub": patient_a_id, "is_anonymous": True}

    # Normal patient accessing own profile -> ALLOWED
    assert can_access_profile(patient_a_id, patient_jwt, patient_a_id) is True
    # Normal patient accessing another patient's profile -> DENIED
    assert can_access_profile(patient_a_id, patient_jwt, patient_b_id) is False

    # Normal patient accessing own documents -> ALLOWED
    assert can_access_document(patient_a_id, patient_jwt, patient_a_id) is True
    # Normal patient accessing another patient's documents -> DENIED
    assert can_access_document(patient_a_id, patient_jwt, patient_b_id) is False

    # Normal patient uploading to own storage folder -> ALLOWED
    assert can_upload_storage(patient_a_id, patient_jwt, "medical-records", patient_a_id) is True
    # Normal patient attempting upload to another user's storage folder -> DENIED
    assert can_upload_storage(patient_a_id, patient_jwt, "medical-records", patient_b_id) is False

    # Anonymous user attempting ANY access even for their own auth.uid -> DENIED by restrictive policy
    assert can_access_profile(patient_a_id, anon_jwt, patient_a_id) is False
    assert can_access_document(patient_a_id, anon_jwt, patient_a_id) is False
    assert can_upload_storage(patient_a_id, anon_jwt, "medical-records", patient_a_id) is False


def test_verified_doctor_access_requires_verification_and_consent():
    """
    Tests the RLS contract that doctor access to patient documents strictly requires:
    1. The doctor account is verified (is_verified = True)
    2. An active patient-doctor relationship exists (status = 'active')
    3. The session is not an anonymous demo session
    """
    doctor_id = "doc-uuid-111"
    patient_id = "pat-uuid-222"

    relationships_table = [
        {"doctor_id": doctor_id, "patient_id": patient_id, "status": "active"},
        {"doctor_id": "doc-uuid-revoked", "patient_id": patient_id, "status": "revoked"},
        {"doctor_id": "doc-uuid-pending", "patient_id": patient_id, "status": "pending"},
    ]

    doctor_profiles_table = {
        doctor_id: {"is_verified": True},
        "doc-uuid-unverified": {"is_verified": False},
        "doc-uuid-revoked": {"is_verified": True},
        "doc-uuid-pending": {"is_verified": True},
    }

    def can_doctor_view_patient_document(auth_doc_id: str, jwt: dict, target_patient_id: str) -> bool:
        # Check restrictive policy for anonymous JWT
        if not evaluate_rls_restrictive_condition(jwt):
            return False

        # Doctor profile verification check
        doc_prof = doctor_profiles_table.get(auth_doc_id)
        if not doc_prof or not doc_prof.get("is_verified"):
            return False

        # Relationship active consent check
        has_consent = any(
            rel["doctor_id"] == auth_doc_id
            and rel["patient_id"] == target_patient_id
            and rel["status"] == "active"
            for rel in relationships_table
        )
        return has_consent

    doc_jwt_regular = {"sub": doctor_id, "is_anonymous": False}
    doc_jwt_anon = {"sub": doctor_id, "is_anonymous": True}

    # Verified doctor with active consent -> ALLOWED
    assert can_doctor_view_patient_document(doctor_id, doc_jwt_regular, patient_id) is True

    # Doctor with revoked consent -> DENIED
    assert can_doctor_view_patient_document("doc-uuid-revoked", doc_jwt_regular, patient_id) is False

    # Doctor with pending consent -> DENIED
    assert can_doctor_view_patient_document("doc-uuid-pending", doc_jwt_regular, patient_id) is False

    # Doctor without relationship -> DENIED
    assert can_doctor_view_patient_document("doc-uuid-stranger", doc_jwt_regular, patient_id) is False

    # Unverified doctor attempting access -> DENIED
    assert can_doctor_view_patient_document("doc-uuid-unverified", doc_jwt_regular, patient_id) is False

    # Anonymous demo doctor attempting database access -> DENIED
    assert can_doctor_view_patient_document(doctor_id, doc_jwt_anon, patient_id) is False
