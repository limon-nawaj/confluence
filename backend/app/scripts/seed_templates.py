"""
Run with: python -m app.scripts.seed_templates
Seeds the three built-in academic templates into the database.
"""
import json
import sys
import os

# Ensure backend/ is on the path when run as a script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal, create_tables
from app.models.template import Template

TEMPLATES = [
    {
        "name": "Meeting Notes",
        "description": "Standard agenda, attendees, action items, and next meeting date",
        "category": "meeting_notes",
        "content": json.dumps({
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Meeting Notes"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Date: "}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Location: "}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Attendees"}]},
                {"type": "bulletList", "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Name — Role"}]}]}
                ]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Agenda"}]},
                {"type": "orderedList", "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item 1"}]}]}
                ]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Discussion Notes"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Add notes here..."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Action Items"}]},
                {"type": "taskList", "content": [
                    {"type": "taskItem", "attrs": {"checked": False}, "content": [
                        {"type": "paragraph", "content": [{"type": "text", "text": "Action item — Assigned to: "}]}
                    ]}
                ]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Next Meeting"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Date: TBD"}]},
            ]
        }),
    },
    {
        "name": "Research Summary",
        "description": "Abstract, methodology, findings, and references for research documentation",
        "category": "research",
        "content": json.dumps({
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Research Title"}]},
                {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "Author(s): "}]},
                {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "Date: "}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Briefly describe the research goals, methods, and key findings (150–250 words)."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Introduction"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Background and motivation for the research..."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Methodology"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Describe the research design, data collection, and analysis approach."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Findings"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Present the key results..."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Conclusion"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Summarize findings and implications."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
                {"type": "orderedList", "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Author, A. (Year). Title. Journal, Vol(Issue), pages."}]}]}
                ]},
            ]
        }),
    },
    {
        "name": "Standard Operating Procedure",
        "description": "Step-by-step procedure with purpose, scope, responsibilities, and revision history",
        "category": "general",
        "content": json.dumps({
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Procedure Title"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Document No.: "}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Effective Date: "}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Approved by: "}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Purpose"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Describe the purpose of this procedure..."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Scope"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Define who this procedure applies to..."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Responsibilities"}]},
                {"type": "bulletList", "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Role — Responsibility"}]}]}
                ]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Procedure Steps"}]},
                {"type": "orderedList", "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Step 1: "}]}]},
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Step 2: "}]}]},
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Step 3: "}]}]},
                ]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. References"}]},
                {"type": "bulletList", "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Related document or policy"}]}]}
                ]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Revision History"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "v1.0 — Initial release"}]},
            ]
        }),
    },
]


def seed() -> None:
    create_tables()
    db = SessionLocal()
    try:
        for t in TEMPLATES:
            exists = db.query(Template).filter(Template.name == t["name"], Template.is_system == True).first()
            if not exists:
                db.add(Template(**t, is_system=True))
                print(f"  + Seeded template: {t['name']}")
            else:
                print(f"  ~ Template already exists: {t['name']}")
        db.commit()
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
