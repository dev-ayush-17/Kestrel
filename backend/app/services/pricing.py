from datetime import date
from typing import Dict, Any


class PricingService:
    TAX_RATE = 0.14
    CLEANING_FEE_CENTS = 4500

    @classmethod
    def calculate_stay_price(
        cls,
        base_nightly_rate_cents: int,
        check_in: date,
        check_out: date,
        rooms_count: int = 1,
        currency: str = "USD",
    ) -> Dict[str, Any]:
        """
        Computes accurate integer price breakdown. Check-out day is not charged.
        """
        nights = (check_out - check_in).days
        if nights <= 0:
            raise ValueError("Check-out date must be strictly after check-in date")

        subtotal_cents = base_nightly_rate_cents * nights * rooms_count
        taxes_and_fees_cents = round(subtotal_cents * cls.TAX_RATE)
        cleaning_fee_cents = cls.CLEANING_FEE_CENTS
        total_cents = subtotal_cents + taxes_and_fees_cents + cleaning_fee_cents

        return {
            "nightly_rate_cents": base_nightly_rate_cents,
            "nights": nights,
            "rooms_count": rooms_count,
            "subtotal_cents": subtotal_cents,
            "taxes_and_fees_cents": taxes_and_fees_cents,
            "cleaning_fee_cents": cleaning_fee_cents,
            "discount_cents": 0,
            "total_cents": total_cents,
            "currency": currency,
        }

    # Backward compatibility alias
    claculate_stay_price = calculate_stay_price
