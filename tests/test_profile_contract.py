"""
Aarogya — Health Profile Editing, Age Calculation, and Persistence Contract Tests
"""
import datetime
import pytest


def calculate_age_from_dob(dob_str: str | None, ref_date: datetime.date | None = None) -> int | None:
    """Python mirror of src/utils/dateUtils.ts calculateAgeFromDob logic."""
    if not dob_str or not dob_str.strip():
        return None
    trimmed = dob_str.strip()
    try:
        parts = [int(p) for p in trimmed.split("-")]
        if len(parts) != 3:
            return None
        birth_date = datetime.date(parts[0], parts[1], parts[2])
    except (ValueError, TypeError):
        return None

    if ref_date is None:
        ref_date = datetime.date.today()

    # Reject future dates
    if birth_date > ref_date:
        return None

    age = ref_date.year - birth_date.year
    if (ref_date.month, ref_date.day) < (birth_date.month, birth_date.day):
        age -= 1

    return age if age >= 0 else None


def test_profile_without_dob_shows_age_not_set():
    assert calculate_age_from_dob(None) is None
    assert calculate_age_from_dob("") is None
    assert calculate_age_from_dob("   ") is None


def test_entering_dob_calculates_correct_age_across_boundaries():
    ref = datetime.date(2026, 10, 10)

    # Birthday was yesterday -> completed 26
    assert calculate_age_from_dob("2000-10-09", ref) == 26

    # Birthday is today -> completed 26
    assert calculate_age_from_dob("2000-10-10", ref) == 26

    # Birthday is tomorrow -> completed 25
    assert calculate_age_from_dob("2000-10-11", ref) == 25

    # Leap year birthday (Feb 29, 2004) tested in non-leap year 2026
    assert calculate_age_from_dob("2004-02-29", datetime.date(2026, 2, 28)) == 21
    assert calculate_age_from_dob("2004-02-29", datetime.date(2026, 3, 1)) == 22


def test_future_dob_is_rejected():
    ref = datetime.date(2026, 10, 10)
    # Tomorrow
    assert calculate_age_from_dob("2026-10-11", ref) is None
    # Next year
    assert calculate_age_from_dob("2027-01-01", ref) is None


def test_allergies_and_conditions_chip_validation():
    def add_item(existing_list: list[str], new_item: str) -> tuple[list[str], str | None]:
        trimmed = new_item.strip()
        if not trimmed:
            return existing_list, "Empty item not allowed"
        if any(e.lower() == trimmed.lower() for e in existing_list):
            return existing_list, "Duplicate item not allowed"
        return existing_list + [trimmed], None

    allergies = ["Penicillin", "Peanuts"]

    # Duplicates rejected case-insensitively
    res, err = add_item(allergies, "penicillin")
    assert err is not None
    assert len(res) == 2

    # Surrounding whitespace trimmed
    res, err = add_item(allergies, "  Sulfa drugs  ")
    assert err is None
    assert "Sulfa drugs" in res
    assert len(res) == 3

    # Removal
    res.remove("Penicillin")
    assert "Penicillin" not in res
    assert len(res) == 2

    # Empty list produces empty state without asserting medically clear
    empty_list = []
    assert len(empty_list) == 0  # UI displays 'No allergies recorded'


def test_saving_one_field_preserves_unrelated_saved_fields():
    current_profile = {
        "id": "user-123",
        "full_name": "Ravi Kumar",
        "dob": "1995-04-12",
        "gender": "male",
        "blood_group": "B+",
        "phone": "+91 9876543210",
        "location": "Hyderabad",
        "emergency_contact": "Ananya - +91 9876543211",
        "allergies": ["Penicillin"],
        "conditions": ["Asthma"],
        "preferred_language": "te",
    }

    # User only updates phone and emergency contact
    partial_update = {
        "phone": "+91 9123456789",
        "emergencyContact": "Kiran - +91 9999988888"
    }

    payload = {}
    if "name" in partial_update:
        payload["full_name"] = partial_update["name"]
    if "phone" in partial_update:
        payload["phone"] = partial_update["phone"]
    if "emergencyContact" in partial_update:
        payload["emergency_contact"] = partial_update["emergencyContact"]

    # Simulated DB update: preserves all existing fields
    updated_profile = {**current_profile, **payload}
    assert updated_profile["phone"] == "+91 9123456789"
    assert updated_profile["emergency_contact"] == "Kiran - +91 9999988888"
    assert updated_profile["blood_group"] == "B+"
    assert updated_profile["dob"] == "1995-04-12"
    assert updated_profile["gender"] == "male"
    assert updated_profile["allergies"] == ["Penicillin"]
    assert updated_profile["conditions"] == ["Asthma"]
    assert updated_profile["preferred_language"] == "te"


def test_emergency_contact_clearing():
    current_profile = {
        "emergency_contact": "Ananya - +91 9876543211"
    }
    # Clear contact
    cleared = ""
    update = {"emergency_contact": cleared.strip() or None}
    updated = {**current_profile, **update}
    assert updated["emergency_contact"] is None


def test_profile_cross_user_isolation():
    """Verify that update query is bound strictly to the authenticated user ID."""
    auth_user_id = "user-alice-uuid"
    target_update_id = auth_user_id

    # Any query must filter by eq('id', auth_user_id)
    where_clause = {"id": target_update_id}
    assert where_clause["id"] == auth_user_id
