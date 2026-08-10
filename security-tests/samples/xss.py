# Intentionally vulnerable: XSS patterns
# DO NOT use this code in production — these are test samples for scanner validation.

def render_comment(request):
    comment = request.GET.get("comment", "")
    # XSS: unsanitized user input into innerHTML equivalent
    html = f"<div>{comment}</div>"
    return html


def render_search(query):
    # XSS via document.write
    return f"""
    <script>
        document.write("{query}");
    </script>
    """


class UnsafeTemplate:
    def render(self, user_input):
        # innerHTML assignment
        return f'element.innerHTML = "{user_input}";'
