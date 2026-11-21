import random
from fastapi import APIRouter, BackgroundTasks, status
from app.schemas.public import ContactInquiryRequest, ContactInquiryResponse

router = APIRouter(tags=["Public Support"])


def send_concierge_notification(inquiry: ContactInquiryRequest, reference_id: str):
    """
    Background worker simulating automated email dispatch to property concierge.
    """
    print(f"📧 [DISPATCH] Ref: {reference_id} | To: concierge@kestrelstays.com | From: {inquiry.email}")
    print(f"Subject: {inquiry.subject}")


@router.post("/contact", response_model=ContactInquiryResponse, status_code=status.HTTP_200_OK)
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    background_tasks: BackgroundTasks,
):
    """
    Receives guest inquiries, issues a reference ID, and schedules background dispatch.
    """
    ref_id = f"INQ-{random.randint(100000, 999999)}"

    background_tasks.add_task(send_concierge_notification, payload, ref_id)

    return ContactInquiryResponse(
        success=True,
        reference_id=ref_id,
        message="Your inquiry has been delivered to our concierge team. Expect a response within 4 hours.",
    )
