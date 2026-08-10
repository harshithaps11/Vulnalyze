# Intentionally vulnerable: Insecure deserialization
# DO NOT use this code in production — these are test samples for scanner validation.

import pickle
import yaml


def load_user_data(data_bytes):
    # Insecure: pickle deserialization of untrusted data
    user = pickle.loads(data_bytes)
    return user


def load_config(yaml_string):
    # Insecure: yaml.load without SafeLoader
    config = yaml.load(yaml_string)
    return config


def load_from_file(path):
    with open(path, "rb") as f:
        # Insecure: pickle.load from untrusted file
        return pickle.load(f)
