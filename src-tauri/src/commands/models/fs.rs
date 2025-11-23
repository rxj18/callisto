use serde::{Deserialize, Serialize};
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CallistoConfig {
    pub version: String,
    #[serde(default)]
    pub workspaces: Vec<Workspace>,
    #[serde(default)]
    pub environments: Vec<Environment>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub collections: Vec<Collection>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub requests: Vec<Request>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Request {
    pub id: String,
    pub name: String,
    pub req_type: String,
    pub method: String,
    pub curl: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Environment {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub variables: Vec<Variable>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Variable {
    pub key: String,
    pub value: String,
}
