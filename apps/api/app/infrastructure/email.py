"""Sends email through SMTP, or writes it to the log when no SMTP server is configured."""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

log = logging.getLogger("rexfy.email")


def require_email_transport() -> None:
    settings = get_settings()
    if settings.env not in ("local", "test") and not settings.smtp_host:
        raise RuntimeError("REXFY_SMTP_HOST is required for email delivery")


def send_email(to: str, subject: str, text: str, *, message_id: str | None = None) -> None:
    require_email_transport()
    settings = get_settings()
    if not settings.smtp_host:
        log.info("Email (sin SMTP configurado) a %s: %s\n%s", to, subject, text)
        return
    message = EmailMessage()
    message["From"] = settings.email_from
    message["To"] = to
    message["Subject"] = subject
    if message_id:
        message["Message-ID"] = message_id
    message.set_content(text)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)
