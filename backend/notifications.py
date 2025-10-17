from typing import Dict, Any
from datetime import datetime, timezone
from models import NotificationLog
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, mode: str = "SIMULATED"):
        self.mode = mode
    
    async def send_whatsapp(self, recipient: str, message: str, order_id: str = None) -> NotificationLog:
        """Send WhatsApp notification"""
        log = NotificationLog(
            type="WhatsApp",
            recipient=recipient,
            message=message,
            order_id=order_id,
            status="Simulated" if self.mode == "SIMULATED" else "Sent"
        )
        
        if self.mode == "SIMULATED":
            logger.info(f"[SIMULATED WhatsApp] To: {recipient} | Message: {message}")
        else:
            # Real WhatsApp integration (Meta WhatsApp Business API)
            # await self._send_whatsapp_live(recipient, message)
            pass
        
        return log
    
    async def send_email(self, recipient: str, subject: str, message: str, order_id: str = None) -> NotificationLog:
        """Send Email notification"""
        log = NotificationLog(
            type="Email",
            recipient=recipient,
            subject=subject,
            message=message,
            order_id=order_id,
            status="Simulated" if self.mode == "SIMULATED" else "Sent"
        )
        
        if self.mode == "SIMULATED":
            logger.info(f"[SIMULATED Email] To: {recipient} | Subject: {subject} | Message: {message}")
        else:
            # Real Email integration (SMTP/SendGrid)
            # await self._send_email_live(recipient, subject, message)
            pass
        
        return log
    
    async def _send_whatsapp_live(self, recipient: str, message: str):
        """Send WhatsApp via Meta WhatsApp Business API (real implementation)"""
        # This would use Meta WhatsApp Business API
        # Requires: phone_number_id, access_token
        # import requests
        # url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        # headers = {"Authorization": f"Bearer {access_token}"}
        # data = {
        #     "messaging_product": "whatsapp",
        #     "to": recipient,
        #     "text": {"body": message}
        # }
        # response = requests.post(url, json=data, headers=headers)
        pass
    
    async def _send_email_live(self, recipient: str, subject: str, message: str):
        """Send Email via SMTP/SendGrid (real implementation)"""
        # This would use SMTP or SendGrid
        pass

# Notification templates
def get_order_confirmation_message(order_id: str, total: float) -> str:
    return f"Your order {order_id} has been confirmed! Total: ₹{total:.2f}. We'll notify you once it's ready."

def get_order_ready_message(order_id: str, fulfillment_type: str) -> str:
    if fulfillment_type == "Pickup":
        return f"Your order {order_id} is ready for pickup! Please collect it from the store."
    else:
        return f"Your order {order_id} is ready and will be delivered soon!"

def get_order_delivered_message(order_id: str) -> str:
    return f"Your order {order_id} has been delivered! Thank you for choosing Vaishnavi Printers."
