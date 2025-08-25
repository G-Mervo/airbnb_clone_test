"""
Payment service for handling payment-related operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from .base_service import BaseService, ValidationError, NotFoundError
from utils.data_manager import payments_manager, bookings_manager, users_manager

class PaymentService(BaseService):
    """Service for payment operations including processing, refunds, and analytics"""

    def __init__(self):
        super().__init__(payments_manager, "payment")
        self.bookings_manager = bookings_manager
        self.users_manager = users_manager

    def get_primary_file(self) -> str:
        return "payments.json"

    def validate_data(self, data: Dict[str, Any], operation: str = "create") -> Dict[str, Any]:
        """
        Validate payment data

        Args:
            data: Payment data to validate
            operation: Operation type ('create' or 'update')

        Returns:
            Validated data
        """
        validated_data = super().validate_data(data, operation)

        if operation == "create":
            # Required fields
            required_fields = ["booking_id", "amount", "payment_method"]
            for field in required_fields:
                if field not in validated_data:
                    raise ValidationError(f"Field '{field}' is required")

            # Validate booking exists
            booking_id = validated_data["booking_id"]
            booking = self.bookings_manager.find_by_id("bookings.json", booking_id)
            if not booking:
                raise ValidationError(f"Booking with ID {booking_id} not found")

            # Validate amount
            amount = validated_data["amount"]
            if not isinstance(amount, (int, float)) or amount <= 0:
                raise ValidationError("Amount must be a positive number")

            # Validate payment method
            valid_methods = ["credit_card", "debit_card", "paypal", "bank_transfer", "apple_pay", "google_pay"]
            payment_method = validated_data["payment_method"]
            if payment_method not in valid_methods:
                raise ValidationError(f"Invalid payment method. Must be one of: {', '.join(valid_methods)}")

            # Set default values
            validated_data["status"] = validated_data.get("status", "pending")
            validated_data["currency"] = validated_data.get("currency", "USD")
            validated_data["transaction_id"] = validated_data.get("transaction_id", self._generate_transaction_id())

        return validated_data

    def _generate_transaction_id(self) -> str:
        """Generate unique transaction ID"""
        return f"TXN_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8].upper()}"

    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment

        Args:
            payment_data: Payment data

        Returns:
            Processed payment with status
        """
        try:
            # Create payment record
            payment = self.create(payment_data)

            # Simulate payment processing
            processing_result = self._simulate_payment_processing(payment)

            # Update payment status based on processing result
            if processing_result["success"]:
                updated_payment = self.update(payment["id"], {
                    "status": "completed",
                    "processed_at": datetime.now().isoformat(),
                    "gateway_response": processing_result
                })

                # Update booking status to confirmed
                self.bookings_manager.update("bookings.json", payment_data["booking_id"], {
                    "status": "confirmed",
                    "payment_status": "paid"
                })

                self.logger.info(f"Payment {payment['id']} processed successfully")
                return updated_payment
            else:
                updated_payment = self.update(payment["id"], {
                    "status": "failed",
                    "error_message": processing_result.get("error", "Payment processing failed"),
                    "gateway_response": processing_result
                })

                self.logger.warning(f"Payment {payment['id']} failed: {processing_result.get('error')}")
                return updated_payment

        except Exception as e:
            self.logger.error(f"Error processing payment: {e}")
            raise

    def _simulate_payment_processing(self, payment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate payment gateway processing

        Args:
            payment: Payment data

        Returns:
            Processing result
        """
        # Simulate different scenarios based on amount
        amount = payment["amount"]

        if amount < 0:
            return {"success": False, "error": "Invalid amount"}
        elif amount > 10000:
            return {"success": False, "error": "Amount exceeds limit"}
        elif payment.get("payment_method") == "expired_card":
            return {"success": False, "error": "Card expired"}
        else:
            # 95% success rate simulation
            import random
            success = random.random() < 0.95

            if success:
                return {
                    "success": True,
                    "gateway_transaction_id": f"GTW_{str(uuid.uuid4())[:12].upper()}",
                    "authorization_code": f"AUTH_{str(uuid.uuid4())[:8].upper()}"
                }
            else:
                return {"success": False, "error": "Insufficient funds"}

    def initiate_refund(self, payment_id: int, refund_amount: Optional[float] = None,
                       reason: str = "Customer request") -> Dict[str, Any]:
        """
        Initiate a refund for a payment

        Args:
            payment_id: Payment ID
            refund_amount: Amount to refund (full amount if not specified)
            reason: Refund reason

        Returns:
            Refund record
        """
        payment = self.get_by_id(payment_id)

        if payment.get("status") != "completed":
            raise ValidationError("Can only refund completed payments")

        # Check if already refunded
        existing_refunds = self.find_by_field("original_payment_id", payment_id)
        total_refunded = sum(r.get("amount", 0) for r in existing_refunds if r.get("status") == "completed")

        original_amount = payment["amount"]
        if refund_amount is None:
            refund_amount = original_amount - total_refunded

        if refund_amount <= 0:
            raise ValidationError("Invalid refund amount")

        if total_refunded + refund_amount > original_amount:
            raise ValidationError("Refund amount exceeds original payment")

        # Create refund record
        refund_data = {
            "original_payment_id": payment_id,
            "booking_id": payment["booking_id"],
            "amount": -refund_amount,  # Negative amount for refund
            "payment_method": payment["payment_method"],
            "status": "pending",
            "transaction_type": "refund",
            "refund_reason": reason,
            "currency": payment.get("currency", "USD")
        }

        refund = self.create(refund_data)

        # Simulate refund processing
        refund_result = self._simulate_refund_processing(refund)

        if refund_result["success"]:
            updated_refund = self.update(refund["id"], {
                "status": "completed",
                "processed_at": datetime.now().isoformat(),
                "gateway_response": refund_result
            })

            # Update booking status if fully refunded
            if total_refunded + refund_amount >= original_amount:
                self.bookings_manager.update("bookings.json", payment["booking_id"], {
                    "payment_status": "refunded"
                })

            self.logger.info(f"Refund {refund['id']} processed successfully")
            return updated_refund
        else:
            updated_refund = self.update(refund["id"], {
                "status": "failed",
                "error_message": refund_result.get("error", "Refund processing failed")
            })

            self.logger.warning(f"Refund {refund['id']} failed: {refund_result.get('error')}")
            return updated_refund

    def _simulate_refund_processing(self, refund: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate refund processing

        Args:
            refund: Refund data

        Returns:
            Processing result
        """
        # Simulate 98% success rate for refunds
        import random
        success = random.random() < 0.98

        if success:
            return {
                "success": True,
                "gateway_transaction_id": f"RFD_{str(uuid.uuid4())[:12].upper()}",
                "refund_id": f"REF_{str(uuid.uuid4())[:8].upper()}"
            }
        else:
            return {"success": False, "error": "Refund processing failed"}

    def get_booking_payments(self, booking_id: int) -> List[Dict[str, Any]]:
        """
        Get all payments for a booking

        Args:
            booking_id: Booking ID

        Returns:
            List of payments and refunds
        """
        try:
            payments = self.find_by_field("booking_id", booking_id)

            # Sort by created_at
            sorted_payments = sorted(payments, key=lambda x: x.get("created_at", ""))

            return sorted_payments
        except Exception as e:
            self.logger.error(f"Error getting booking payments: {e}")
            return []

    def get_user_payments(self, user_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get payments for a user

        Args:
            user_id: User ID
            skip: Pagination skip
            limit: Pagination limit

        Returns:
            List of user payments with booking details
        """
        try:
            # Get user's bookings first
            user_bookings = self.bookings_manager.find_by_field("bookings.json", "guest_id", user_id)
            booking_ids = [b["id"] for b in user_bookings]

            # Get payments for these bookings
            all_payments = self.data_manager.load(self.get_primary_file())
            user_payments = [p for p in all_payments if p.get("booking_id") in booking_ids]

            # Sort by created_at descending
            sorted_payments = sorted(user_payments, key=lambda x: x.get("created_at", ""), reverse=True)

            # Apply pagination
            end_idx = min(skip + limit, len(sorted_payments))
            paginated_payments = sorted_payments[skip:end_idx]

            # Enrich with booking details
            booking_dict = {b["id"]: b for b in user_bookings}
            enriched_payments = []

            for payment in paginated_payments:
                enriched_payment = payment.copy()
                booking = booking_dict.get(payment["booking_id"])
                if booking:
                    enriched_payment["booking_details"] = {
                        "property_id": booking["property_id"],
                        "check_in": booking["check_in"],
                        "check_out": booking["check_out"]
                    }
                enriched_payments.append(enriched_payment)

            return enriched_payments

        except Exception as e:
            self.logger.error(f"Error getting user payments: {e}")
            return []

    def get_payment_analytics(self, start_date: Optional[str] = None,
                            end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get payment analytics

        Args:
            start_date: Start date filter (ISO format)
            end_date: End date filter (ISO format)

        Returns:
            Payment analytics data
        """
        try:
            payments = self.data_manager.load(self.get_primary_file())

            # Filter by date range if provided
            if start_date or end_date:
                filtered_payments = []
                for payment in payments:
                    payment_date = payment.get("created_at", "")
                    if start_date and payment_date < start_date:
                        continue
                    if end_date and payment_date > end_date:
                        continue
                    filtered_payments.append(payment)
                payments = filtered_payments

            # Calculate metrics
            total_payments = len([p for p in payments if p.get("amount", 0) > 0])
            total_refunds = len([p for p in payments if p.get("amount", 0) < 0])

            total_revenue = sum(p.get("amount", 0) for p in payments if p.get("amount", 0) > 0 and p.get("status") == "completed")
            total_refunded = abs(sum(p.get("amount", 0) for p in payments if p.get("amount", 0) < 0 and p.get("status") == "completed"))

            net_revenue = total_revenue - total_refunded

            # Payment method breakdown
            payment_methods = {}
            for payment in payments:
                if payment.get("amount", 0) > 0:  # Only count payments, not refunds
                    method = payment.get("payment_method", "unknown")
                    payment_methods[method] = payment_methods.get(method, 0) + 1

            # Success rate
            completed_payments = len([p for p in payments if p.get("status") == "completed" and p.get("amount", 0) > 0])
            success_rate = (completed_payments / total_payments * 100) if total_payments > 0 else 0

            return {
                "total_payments": total_payments,
                "total_refunds": total_refunds,
                "total_revenue": round(total_revenue, 2),
                "total_refunded": round(total_refunded, 2),
                "net_revenue": round(net_revenue, 2),
                "success_rate": round(success_rate, 2),
                "payment_method_breakdown": payment_methods
            }

        except Exception as e:
            self.logger.error(f"Error getting payment analytics: {e}")
            return {}
