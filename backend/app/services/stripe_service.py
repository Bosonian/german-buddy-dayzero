"""Stripe payment service for MentorMatch"""

import os
import stripe
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


class StripeService:
    """Service for handling Stripe operations"""

    def __init__(self):
        self.api_key = stripe.api_key
        self.webhook_secret = STRIPE_WEBHOOK_SECRET

    def create_connect_account(self, email: str, country: str = "US") -> Dict[str, Any]:
        """
        Create a Stripe Connect account for a mentor

        Args:
            email: Mentor's email
            country: Country code (default: US)

        Returns:
            Dict with account_id and other account details
        """
        try:
            account = stripe.Account.create(
                type="express",
                country=country,
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            return {
                "account_id": account.id,
                "email": account.email,
                "type": account.type,
                "charges_enabled": account.charges_enabled,
                "payouts_enabled": account.payouts_enabled,
                "details_submitted": account.details_submitted,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe Connect account: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def create_connect_onboarding_link(
        self, account_id: str, refresh_url: str, return_url: str
    ) -> Dict[str, Any]:
        """
        Create an onboarding link for Stripe Connect

        Args:
            account_id: Stripe Connect account ID
            refresh_url: URL to redirect if user needs to restart onboarding
            return_url: URL to redirect after completion

        Returns:
            Dict with onboarding_url and expires_at
        """
        try:
            account_link = stripe.AccountLink.create(
                account=account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type="account_onboarding",
            )
            return {
                "onboarding_url": account_link.url,
                "expires_at": datetime.utcnow() + timedelta(minutes=30),
                "account_id": account_id,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create onboarding link: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def get_account_status(self, account_id: str) -> Dict[str, Any]:
        """
        Get the status of a Stripe Connect account

        Args:
            account_id: Stripe Connect account ID

        Returns:
            Dict with account status information
        """
        try:
            account = stripe.Account.retrieve(account_id)

            requirements_pending = []
            requirements_errors = []

            if hasattr(account, 'requirements'):
                requirements_pending = account.requirements.get('currently_due', [])
                if account.requirements.get('errors'):
                    requirements_errors = [
                        err.get('reason', 'Unknown error')
                        for err in account.requirements.errors
                    ]

            return {
                "account_id": account.id,
                "is_active": account.charges_enabled and account.payouts_enabled,
                "charges_enabled": account.charges_enabled,
                "payouts_enabled": account.payouts_enabled,
                "details_submitted": account.details_submitted,
                "requirements_pending": requirements_pending,
                "requirements_errors": requirements_errors,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve account status: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def create_checkout_session(
        self,
        amount_cents: int,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict[str, Any]] = None,
        connected_account_id: Optional[str] = None,
        application_fee_cents: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout session

        Args:
            amount_cents: Amount in cents
            currency: Currency code (e.g., 'usd')
            success_url: URL to redirect on success
            cancel_url: URL to redirect on cancel
            metadata: Additional metadata
            connected_account_id: Stripe Connect account ID for direct charges
            application_fee_cents: Platform fee in cents

        Returns:
            Dict with checkout_session_id and checkout_url
        """
        try:
            session_params = {
                "payment_method_types": ["card"],
                "line_items": [
                    {
                        "price_data": {
                            "currency": currency,
                            "unit_amount": amount_cents,
                            "product_data": {
                                "name": "Mentoring Session",
                            },
                        },
                        "quantity": 1,
                    }
                ],
                "mode": "payment",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": metadata or {},
            }

            # Add Stripe Connect parameters if provided
            if connected_account_id:
                session_params["payment_intent_data"] = {
                    "application_fee_amount": application_fee_cents or 0,
                    "transfer_data": {
                        "destination": connected_account_id,
                    },
                }

            session = stripe.checkout.Session.create(**session_params)

            return {
                "checkout_session_id": session.id,
                "checkout_url": session.url,
                "expires_at": datetime.utcfromtimestamp(session.expires_at),
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create checkout session: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a subscription

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            metadata: Additional metadata

        Returns:
            Dict with subscription details
        """
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                metadata=metadata or {},
                expand=["latest_invoice.payment_intent"],
            )

            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.utcfromtimestamp(
                    subscription.current_period_start
                ),
                "current_period_end": datetime.utcfromtimestamp(
                    subscription.current_period_end
                ),
                "client_secret": subscription.latest_invoice.payment_intent.client_secret
                if subscription.latest_invoice
                else None,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create subscription: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Cancel a subscription

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Dict with cancellation details
        """
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "canceled_at": datetime.utcfromtimestamp(subscription.canceled_at)
                if subscription.canceled_at
                else None,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def create_transfer(
        self,
        amount_cents: int,
        currency: str,
        destination_account_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a transfer (payout) to a connected account

        Args:
            amount_cents: Amount in cents
            currency: Currency code
            destination_account_id: Destination Stripe account ID
            metadata: Additional metadata

        Returns:
            Dict with transfer details
        """
        try:
            transfer = stripe.Transfer.create(
                amount=amount_cents,
                currency=currency,
                destination=destination_account_id,
                metadata=metadata or {},
            )

            return {
                "transfer_id": transfer.id,
                "amount_cents": transfer.amount,
                "currency": transfer.currency,
                "destination": transfer.destination,
                "created": datetime.utcfromtimestamp(transfer.created),
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create transfer: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def create_refund(
        self,
        payment_intent_id: str,
        amount_cents: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a refund for a payment

        Args:
            payment_intent_id: Stripe payment intent ID
            amount_cents: Amount to refund (None for full refund)
            reason: Reason for refund

        Returns:
            Dict with refund details
        """
        try:
            refund_params = {"payment_intent": payment_intent_id}

            if amount_cents:
                refund_params["amount"] = amount_cents

            if reason:
                refund_params["reason"] = reason

            refund = stripe.Refund.create(**refund_params)

            return {
                "refund_id": refund.id,
                "amount_cents": refund.amount,
                "status": refund.status,
                "reason": refund.reason,
                "created": datetime.utcfromtimestamp(refund.created),
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create refund: {e}")
            raise Exception(f"Stripe error: {str(e)}")

    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Handle Stripe webhook events

        Args:
            payload: Raw request payload
            sig_header: Stripe signature header

        Returns:
            Dict with event type and data
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )

            event_type = event["type"]
            event_data = event["data"]["object"]

            logger.info(f"Received Stripe webhook: {event_type}")

            return {
                "event_type": event_type,
                "event_id": event["id"],
                "data": event_data,
            }
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise Exception("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise Exception("Invalid signature")

    def create_payment_intent(
        self,
        amount_cents: int,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None,
        connected_account_id: Optional[str] = None,
        application_fee_cents: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Create a payment intent

        Args:
            amount_cents: Amount in cents
            currency: Currency code
            metadata: Additional metadata
            connected_account_id: Stripe Connect account ID for direct charges
            application_fee_cents: Platform fee in cents

        Returns:
            Dict with payment intent details
        """
        try:
            intent_params = {
                "amount": amount_cents,
                "currency": currency,
                "metadata": metadata or {},
            }

            if connected_account_id:
                intent_params["application_fee_amount"] = application_fee_cents or 0
                intent_params["transfer_data"] = {
                    "destination": connected_account_id,
                }

            intent = stripe.PaymentIntent.create(**intent_params)

            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount_cents": intent.amount,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create payment intent: {e}")
            raise Exception(f"Stripe error: {str(e)}")


# Singleton instance
stripe_service = StripeService()
