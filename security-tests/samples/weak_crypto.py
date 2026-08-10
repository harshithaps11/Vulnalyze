# Intentionally vulnerable: Weak cryptography patterns
# DO NOT use this code in production — these are test samples for scanner validation.

import hashlib
import random


def hash_password_md5(password):
    # Weak hash: MD5 is broken for cryptographic use
    return hashlib.md5(password.encode()).hexdigest()


def hash_password_sha1(password):
    # Weak hash: SHA-1 is deprecated
    return hashlib.sha1(password.encode()).hexdigest()


def generate_token():
    # Insecure random: not cryptographically secure
    return str(random.random())


def generate_session_id():
    # Insecure random for session ID
    return hex(int(random.random() * 1000000))
