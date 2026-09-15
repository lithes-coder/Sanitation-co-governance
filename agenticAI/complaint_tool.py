import json
from pathlib import Path


def get_complaint_by_id(complaint_id: str):
    """
    Find a sanitation complaint by its complaint ID.

    This is a temporary local test tool.
    Later, this will be replaced by an API/database connection.
    """

    data_file = Path("complaints_test.json")

    if not data_file.exists():
        return {
            "error": "Complaint data source is not connected yet."
        }

    try:
        complaints = json.loads(data_file.read_text(encoding="utf-8"))
    except Exception:
        return {
            "error": "Could not read complaint data."
        }

    for complaint in complaints:
        if complaint.get("complaint_id") == complaint_id:
            return complaint

    return {
        "error": f"Complaint {complaint_id} was not found."
    }