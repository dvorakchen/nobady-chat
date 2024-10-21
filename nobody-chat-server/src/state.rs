use std::sync::Arc;

pub type AllowOriginState = Arc<Vec<String>>;

pub fn new_allow_origin_state(allow_origins: Vec<String>) -> AllowOriginState {
    Arc::new(allow_origins)
}
