mod models;

use models::{Element, FormData, FormResponse, Question, Section};
use yew::prelude::*;
use std::collections::HashMap;
use uuid::Uuid;

enum Msg {
    SetTab(String),
    AddQuestion,
    AddSection,
    UpdateTitle(String),
    UpdateDescription(String),
    UpdateQuestionTitle(usize, String),
    UpdateQuestionType(usize, String),
    AddQuestionOption(usize),
    UpdateQuestionOption(usize, usize, String),
    DeleteQuestionOption(usize, usize),
    DeleteElement(usize),
    TogglePreview,
    NewForm,
    // Add more messages as needed for a complete form builder
}

struct App {
    active_tab: String,
    form_data: FormData,
    responses: Vec<FormResponse>,
    active_element_index: Option<usize>,
    preview_mode: bool,
}

impl Component for App {
    type Message = Msg;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            active_tab: "editor".into(),
            form_data: FormData::default(),
            responses: vec![],
            active_element_index: None,
            preview_mode: false,
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Msg::SetTab(tab) => {
                self.active_tab = tab;
                true
            }
            Msg::AddQuestion => {
                let id = format!("q_{}", Uuid::new_v4().simple());
                let q = Question {
                    id,
                    q_type: "multiple".into(),
                    title: "".into(),
                    required: false,
                    options: vec!["Option 1".into()],
                    rows: vec!["Ligne 1".into()],
                    cols: vec!["Colonne 1".into()],
                    option_logics: HashMap::new(),
                    logic_enabled: false,
                };
                self.form_data.elements.push(Element::Question(q));
                self.active_element_index = Some(self.form_data.elements.len() - 1);
                true
            }
            Msg::AddSection => {
                let id = format!("s_{}", Uuid::new_v4().simple());
                let s = Section {
                    id,
                    title: "Section sans titre".into(),
                    description: "".into(),
                    after_section: "next".into(),
                };
                self.form_data.elements.push(Element::Section(s));
                self.active_element_index = Some(self.form_data.elements.len() - 1);
                true
            }
            Msg::UpdateTitle(t) => {
                self.form_data.title = t;
                true
            }
            Msg::UpdateDescription(d) => {
                self.form_data.description = d;
                true
            }
            Msg::DeleteElement(idx) => {
                self.form_data.elements.remove(idx);
                true
            }
            Msg::TogglePreview => {
                self.preview_mode = !self.preview_mode;
                true
            }
            Msg::NewForm => {
                self.form_data = FormData::default();
                self.responses = vec![];
                self.active_element_index = None;
                true
            }
            _ => false,
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <>
                <header>
                    <div class="header-left">
                        <div class="logo-box">{"F"}</div>
                        <input 
                            type="text" 
                            id="form-title-input" 
                            value={self.form_data.title.clone()} 
                            oninput={ctx.link().callback(|e: InputEvent| {
                                let input: web_sys::HtmlInputElement = e.target_unchecked_into();
                                Msg::UpdateTitle(input.value())
                            })}
                            placeholder="Titre du formulaire" 
                        />
                    </div>
                    <div class="header-right">
                        <button class="btn-secondary" onclick={ctx.link().callback(|_| Msg::NewForm)}>{"Nouveau"}</button>
                        <button class="btn-secondary">{"Ouvrir"}</button>
                        <button class="btn-primary">{"Sauvegarder"}</button>
                        <button class="btn-icon" title="Aperçu" onclick={ctx.link().callback(|_| Msg::TogglePreview)}>{"👁"}</button>
                    </div>
                </header>

                <nav class="tabs">
                    <button 
                        class={classes!("tab-btn", if self.active_tab == "editor" { "active" } else { "" })}
                        onclick={ctx.link().callback(|_| Msg::SetTab("editor".into()))}
                    >{"Questions"}</button>
                    <button 
                        class={classes!("tab-btn", if self.active_tab == "responses" { "active" } else { "" })}
                        onclick={ctx.link().callback(|_| Msg::SetTab("responses".into()))}
                    >{"Réponses"}</button>
                </nav>

                <main id="app-container">
                    if self.preview_mode {
                        { self.view_preview(ctx) }
                    } else if self.active_tab == "editor" {
                        { self.view_editor(ctx) }
                    } else if self.active_tab == "responses" {
                        { self.view_responses(ctx) }
                    }
                </main>
            </>
        }
    }
}

impl App {
    fn view_editor(&self, ctx: &Context<Self>) -> Html {
        html! {
            <section id="editor-view" class="tab-content active">
                <div class="form-container">
                    <div class="form-header-card">
                        <input 
                            type="text" 
                            class="title-input" 
                            placeholder="Titre du formulaire" 
                            value={self.form_data.title.clone()}
                            oninput={ctx.link().callback(|e: InputEvent| {
                                let input: web_sys::HtmlInputElement = e.target_unchecked_into();
                                Msg::UpdateTitle(input.value())
                            })}
                        />
                        <textarea 
                            class="description-input" 
                            placeholder="Description du formulaire"
                            value={self.form_data.description.clone()}
                            oninput={ctx.link().callback(|e: InputEvent| {
                                let input: web_sys::HtmlTextAreaElement = e.target_unchecked_into();
                                Msg::UpdateDescription(input.value())
                            })}
                        ></textarea>
                    </div>

                    <div id="questions-list" class="questions-container">
                        { for self.form_data.elements.iter().enumerate().map(|(i, el)| self.view_element(ctx, i, el)) }
                    </div>

                    <div class="floating-actions">
                        <button class="action-btn" title="Ajouter une question" onclick={ctx.link().callback(|_| Msg::AddQuestion)}>{"+"}</button>
                        <button class="action-btn" title="Ajouter une section" onclick={ctx.link().callback(|_| Msg::AddSection)}>{"〓"}</button>
                    </div>
                </div>
            </section>
        }
    }

    fn view_element(&self, ctx: &Context<Self>, idx: usize, el: &Element) -> Html {
        let is_active = self.active_element_index == Some(idx);
        let card_class = classes!("question-card", if is_active { "active-card" } else { "" });

        match el {
            Element::Question(q) => {
                html! {
                    <div class={card_class}>
                        <div class="question-top">
                            <input type="text" class="question-title" placeholder="Question" value={q.title.clone()} />
                            <select class="question-type" value={q.q_type.clone()}>
                                <option value="short">{"Réponse courte"}</option>
                                <option value="paragraph">{"Paragraphe"}</option>
                                <option value="multiple">{"Choix multiple"}</option>
                                <option value="checkbox">{"Cases à cocher"}</option>
                            </select>
                        </div>
                        <div class="options-list">
                            { for q.options.iter().map(|opt| html! {
                                <div class="option-row">
                                    <input type="radio" disabled=true />
                                    <input type="text" class="option-input" value={opt.clone()} />
                                </div>
                            }) }
                        </div>
                        <div class="question-footer">
                            <div class="footer-right">
                                <button class="delete-btn" onclick={ctx.link().callback(move |_| Msg::DeleteElement(idx))}>{"Supprimer"}</button>
                            </div>
                        </div>
                    </div>
                }
            }
            Element::Section(s) => {
                html! {
                    <div class={classes!("section-card", if is_active { "active-card" } else { "" })}>
                        <div class="section-header">
                            <span class="section-label">{"SECTION "}</span>
                            <button class="delete-btn" onclick={ctx.link().callback(move |_| Msg::DeleteElement(idx))}>{"×"}</button>
                        </div>
                        <div class="section-body">
                            <input type="text" class="section-title" placeholder="Titre de la section" value={s.title.clone()} />
                            <input type="text" class="section-desc" placeholder="Description" value={s.description.clone()} />
                        </div>
                    </div>
                }
            }
        }
    }

    fn view_responses(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <section id="responses-view" class="tab-content active">
                <div class="responses-container">
                    <div class="responses-card">
                        <h2>{ format!("{} réponses", self.responses.len()) }</h2>
                        <button class="btn-secondary">{"Exporter CSV"}</button>
                    </div>
                </div>
            </section>
        }
    }

    fn view_preview(&self, ctx: &Context<Self>) -> Html {
        html! {
            <section class="preview-overlay">
                <div class="preview-content">
                    <div class="preview-nav">
                        <button class="btn-secondary" onclick={ctx.link().callback(|_| Msg::TogglePreview)}>{"Retour à l'édition"}</button>
                    </div>
                    <div class="form-container">
                        <div class="form-header-card">
                            <h1>{ &self.form_data.title }</h1>
                            <p>{ &self.form_data.description }</p>
                        </div>
                        { for self.form_data.elements.iter().map(|el| {
                            if let Element::Question(q) = el {
                                html! {
                                    <div class="question-card">
                                        <div style="font-weight:500; margin-bottom:15px;">{ &q.title }</div>
                                        <input type="text" class="prev-in" placeholder="Votre réponse" style="width:100%; border:none; border-bottom:1px solid #ddd; padding:10px 0;" />
                                    </div>
                                }
                            } else {
                                html! {}
                            }
                        }) }
                        <div style="margin-top: 20px;">
                            <button class="btn-primary">{"Envoyer"}</button>
                        </div>
                    </div>
                </div>
            </section>
        }
    }
}

fn main() {
    yew::Renderer::<App>::new().render();
}
