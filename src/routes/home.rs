use askama_axum::Template;

#[derive(Template)]
#[template(path = "home.html")]
pub struct HomePageTemplate<'a> {
    pub welcome: &'a str,
}

pub async fn index() -> HomePageTemplate<'static> {
    HomePageTemplate {
        welcome: "Welcome Nobody Chat",
    }
}
