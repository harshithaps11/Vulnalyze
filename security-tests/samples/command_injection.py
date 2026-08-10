# Intentionally vulnerable: Command Injection patterns
# DO NOT use this code in production — these are test samples for scanner validation.

import os
import subprocess


def ping_host(host):
    # OS command injection via os.system
    os.system(f"ping -c 1 {host}")


def run_command(user_input):
    # Command injection via subprocess with shell=True
    subprocess.call(f"echo {user_input}", shell=True)


def process_file(filename):
    # Command injection via os.popen
    result = os.popen(f"cat {filename}").read()
    return result


def dynamic_exec(code_string):
    # Code injection via eval
    result = eval(code_string)
    return result


def execute_dynamic(expression):
    # Code injection via exec
    exec(expression)
