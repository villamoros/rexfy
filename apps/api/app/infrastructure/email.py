"""Sends email through SMTP, or writes it to the log when no SMTP server is configured."""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

log = logging.getLogger("rexfy.email")


def send_email(to: str, subject: str, text: str) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        log.info("Email (sin SMTP configurado) a %s: %s\n%s", to, subject, text)
        return
    message = EmailMessage()
    message["From"] = settings.email_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)
