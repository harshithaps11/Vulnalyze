use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn check_xss(code: &str) -> bool {
    // Simple XSS check for innerHTML assignments
    code.contains("innerHTML") && !code.contains("DOMPurify.sanitize")
}

#[wasm_bindgen]
pub fn check_sql_injection(code: &str) -> bool {
    // Simple SQL injection check
    let sql_keywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "UNION"];
    sql_keywords.iter().any(|&keyword| code.to_uppercase().contains(keyword))
}

#[wasm_bindgen]
pub fn check_command_injection(code: &str) -> bool {
    // Simple command injection check
    let dangerous_functions = ["eval", "exec", "system", "spawn", "execSync"];
    dangerous_functions.iter().any(|&func| code.contains(func))
}

#[wasm_bindgen]
pub fn scan_code(code: &str) -> JsValue {
    let vulnerabilities = vec![
        if check_xss(code) {
            Some(("xss", "Potential XSS vulnerability detected"))
        } else {
            None
        },
        if check_sql_injection(code) {
            Some(("sql_injection", "Potential SQL injection vulnerability detected"))
        } else {
            None
        },
        if check_command_injection(code) {
            Some(("command_injection", "Potential command injection vulnerability detected"))
        } else {
            None
        },
    ]
    .into_iter()
    .filter_map(|v| v)
    .collect::<Vec<_>>();

    JsValue::from_serde(&vulnerabilities).unwrap()
} 