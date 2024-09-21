use askama_axum::Template;

#[derive(Template)]
#[template(path = "404.html")]
pub struct NotFoundTemplate;

pub async fn not_found() -> NotFoundTemplate {
    return NotFoundTemplate;
}
