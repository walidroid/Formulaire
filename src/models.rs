use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FormData {
    pub title: String,
    pub description: String,
    pub elements: Vec<Element>,
}

impl Default for FormData {
    fn default() -> Self {
        Self {
            title: "Formulaire sans titre".to_string(),
            description: "".to_string(),
            elements: vec![],
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum Element {
    Question(Question),
    Section(Section),
}

impl Element {
    pub fn id(&self) -> &str {
        match self {
            Element::Question(q) => &q.id,
            Element::Section(s) => &s.id,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Question {
    pub id: String,
    pub q_type: String,
    pub title: String,
    pub required: bool,
    pub options: Vec<String>,
    pub rows: Vec<String>,
    pub cols: Vec<String>,
    pub option_logics: HashMap<usize, String>,
    pub logic_enabled: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Section {
    pub id: String,
    pub title: String,
    pub description: String,
    pub after_section: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FormResponse {
    pub timestamp: String,
    pub data: HashMap<String, String>,
}
