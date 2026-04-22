from sqlalchemy.orm import Session

from app.models.template import Template
from app.schemas.template import TemplateCreate


def get_templates(db: Session) -> list[Template]:
    return db.query(Template).order_by(Template.is_system.desc(), Template.name).all()


def get_template(db: Session, template_id: int) -> Template | None:
    return db.get(Template, template_id)


def create_template(db: Session, data: TemplateCreate, created_by: int) -> Template:
    template = Template(**data.model_dump(), created_by=created_by)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template: Template) -> None:
    db.delete(template)
    db.commit()
