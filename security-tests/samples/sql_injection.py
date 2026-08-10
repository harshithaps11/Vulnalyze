# Intentionally vulnerable: SQL Injection patterns
# DO NOT use this code in production — these are test samples for scanner validation.

import sqlite3


def get_user_unsafe(username):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    # SQL Injection via string concatenation
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    return cursor.fetchall()


def search_products(search_term):
    # SQL Injection via f-string
    query = f"SELECT * FROM products WHERE name LIKE '%{search_term}%'"
    return query


def delete_record(record_id):
    # SQL Injection via format string
    query = "DELETE FROM records WHERE id = '{}'".format(record_id)
    return query
