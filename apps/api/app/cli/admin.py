"""Gives (or removes) RexFy admin rights to a user who has already signed in once.

Run from apps/api:  uv run python -m app.cli.admin tu@correo.com
                    uv run python -m app.cli.admin tu@correo.com --revoke
"""

import argparse
import sys

from sqlalchemy import func, select

from app.infrastructure.db.models import User
from app.infrastructure.db.session import SessionLocal


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    parser.add_argument("--revoke", action="store_true")
    args = parser.parse_args()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(func.lower(User.email) == args.email.lower()))
        if user is None:
            print(f"No hay un usuario con {args.email}. Ingresa a RexFy una vez y repite.")
            return 1
        user.is_platform_admin = not args.revoke
        db.commit()
        print(f"{user.email}: {'ya no es' if args.revoke else 'ahora es'} admin de RexFy")
    return 0


if __name__ == "__main__":
    sys.exit(main())
