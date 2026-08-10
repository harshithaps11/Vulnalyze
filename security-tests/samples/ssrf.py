# Intentionally vulnerable: SSRF patterns
# DO NOT use this code in production — these are test samples for scanner validation.

import requests


def fetch_url(request):
    # SSRF: user-controlled URL from request object passed directly to HTTP client
    url = request.GET.get("url")
    response = requests.get(request.GET.get("target"))
    return response.text


def proxy_request(request):
    import httpx
    # SSRF via httpx with request parameter
    resp = httpx.get(request.query_params["target"])
    return resp.json()
