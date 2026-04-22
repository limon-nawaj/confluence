-- =============================================================================
-- Confluence Clone -- Oracle DDL
-- =============================================================================
-- Run this script as the schema owner (or a DBA granting to the schema owner).
-- Sequences are used for auto-increment PKs (Oracle 11g compatible).
-- For Oracle 12c+ you can replace sequences + triggers with GENERATED ALWAYS AS
-- IDENTITY on each PK column instead.
--
-- Execution order matters: tables are created before the FKs that reference them.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SEQUENCES  (one per table)
-- -----------------------------------------------------------------------------

CREATE SEQUENCE seq_users         START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_teams         START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_team_members  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_spaces        START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_space_team_access START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_permissions   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_templates     START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_pages         START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_page_versions START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_comments      START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_attachments   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_notifications START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;


-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------

CREATE TABLE users (
    id             NUMBER          NOT NULL,
    email          VARCHAR2(255)   NOT NULL,
    username       VARCHAR2(100)   NOT NULL,
    full_name      VARCHAR2(255),
    hashed_password VARCHAR2(255)  NOT NULL,
    role           VARCHAR2(20)    DEFAULT 'viewer' NOT NULL,
    is_active      NUMBER(1)       DEFAULT 1 NOT NULL,
    created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_users          PRIMARY KEY (id),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT ck_users_role     CHECK (role IN ('admin', 'editor', 'viewer')),
    CONSTRAINT ck_users_active   CHECK (is_active IN (0, 1))
);

CREATE INDEX ix_users_id       ON users (id);
CREATE INDEX ix_users_email    ON users (email);
CREATE INDEX ix_users_username ON users (username);

CREATE OR REPLACE TRIGGER trg_users_id
    BEFORE INSERT ON users
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_users.NEXTVAL;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/


-- -----------------------------------------------------------------------------
-- TEAMS
-- -----------------------------------------------------------------------------

CREATE TABLE teams (
    id          NUMBER          NOT NULL,
    name        VARCHAR2(255)   NOT NULL,
    description VARCHAR2(500),
    owner_id    NUMBER          NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_teams      PRIMARY KEY (id),
    CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE INDEX ix_teams_id ON teams (id);

CREATE OR REPLACE TRIGGER trg_teams_id
    BEFORE INSERT ON teams
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_teams.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- TEAM_MEMBERS
-- -----------------------------------------------------------------------------

CREATE TABLE team_members (
    id         NUMBER        NOT NULL,
    team_id    NUMBER        NOT NULL,
    user_id    NUMBER        NOT NULL,
    role       VARCHAR2(50)  DEFAULT 'member' NOT NULL,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_team_members      PRIMARY KEY (id),
    CONSTRAINT fk_tm_team           FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_user           FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_team_members_id      ON team_members (id);
CREATE INDEX ix_team_members_team_id ON team_members (team_id);
CREATE INDEX ix_team_members_user_id ON team_members (user_id);

CREATE OR REPLACE TRIGGER trg_team_members_id
    BEFORE INSERT ON team_members
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_team_members.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- TEMPLATES
-- -----------------------------------------------------------------------------

CREATE TABLE templates (
    id          NUMBER          NOT NULL,
    name        VARCHAR2(255)   NOT NULL,
    description VARCHAR2(500),
    category    VARCHAR2(100)   DEFAULT 'general' NOT NULL,
    content     CLOB            NOT NULL,
    created_by  NUMBER,
    is_system   NUMBER(1)       DEFAULT 0 NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_templates        PRIMARY KEY (id),
    CONSTRAINT fk_templates_creator FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT ck_templates_system  CHECK (is_system IN (0, 1))
);

CREATE INDEX ix_templates_id ON templates (id);

CREATE OR REPLACE TRIGGER trg_templates_id
    BEFORE INSERT ON templates
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_templates.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- SPACES
-- -----------------------------------------------------------------------------

CREATE TABLE spaces (
    id          NUMBER          NOT NULL,
    key         VARCHAR2(50)    NOT NULL,
    name        VARCHAR2(255)   NOT NULL,
    description CLOB,
    is_public   NUMBER(1)       DEFAULT 1 NOT NULL,
    owner_id    NUMBER          NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_spaces       PRIMARY KEY (id),
    CONSTRAINT uq_spaces_key   UNIQUE (key),
    CONSTRAINT fk_spaces_owner FOREIGN KEY (owner_id) REFERENCES users (id),
    CONSTRAINT ck_spaces_public CHECK (is_public IN (0, 1))
);

CREATE INDEX ix_spaces_id  ON spaces (id);
CREATE INDEX ix_spaces_key ON spaces (key);

CREATE OR REPLACE TRIGGER trg_spaces_id
    BEFORE INSERT ON spaces
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_spaces.NEXTVAL;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_spaces_updated_at
    BEFORE UPDATE ON spaces
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/


-- -----------------------------------------------------------------------------
-- SPACE_TEAM_ACCESS
-- -----------------------------------------------------------------------------

CREATE TABLE space_team_access (
    id         NUMBER        NOT NULL,
    space_id   NUMBER        NOT NULL,
    team_id    NUMBER        NOT NULL,
    permission VARCHAR2(50)  DEFAULT 'read' NOT NULL,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_space_team_access      PRIMARY KEY (id),
    CONSTRAINT fk_sta_space              FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_sta_team               FOREIGN KEY (team_id)  REFERENCES teams  (id) ON DELETE CASCADE,
    CONSTRAINT ck_sta_permission         CHECK (permission IN ('read', 'write'))
);

CREATE INDEX ix_sta_id       ON space_team_access (id);
CREATE INDEX ix_sta_space_id ON space_team_access (space_id);
CREATE INDEX ix_sta_team_id  ON space_team_access (team_id);

CREATE OR REPLACE TRIGGER trg_sta_id
    BEFORE INSERT ON space_team_access
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_space_team_access.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- PERMISSIONS  (per-user, per-space)
-- -----------------------------------------------------------------------------

CREATE TABLE permissions (
    id       NUMBER        NOT NULL,
    user_id  NUMBER        NOT NULL,
    space_id NUMBER        NOT NULL,
    level    VARCHAR2(20)  DEFAULT 'view' NOT NULL,

    CONSTRAINT pk_permissions       PRIMARY KEY (id),
    CONSTRAINT fk_perm_user         FOREIGN KEY (user_id)  REFERENCES users  (id) ON DELETE CASCADE,
    CONSTRAINT fk_perm_space        FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE,
    CONSTRAINT ck_permissions_level CHECK (level IN ('view', 'edit', 'admin'))
);

CREATE INDEX ix_permissions_id       ON permissions (id);
CREATE INDEX ix_permissions_user_id  ON permissions (user_id);
CREATE INDEX ix_permissions_space_id ON permissions (space_id);

CREATE OR REPLACE TRIGGER trg_permissions_id
    BEFORE INSERT ON permissions
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_permissions.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- PAGES
-- -----------------------------------------------------------------------------

CREATE TABLE pages (
    id           NUMBER          NOT NULL,
    title        VARCHAR2(500)   NOT NULL,
    content      CLOB,
    content_text CLOB,
    space_id     NUMBER          NOT NULL,
    parent_id    NUMBER,
    author_id    NUMBER          NOT NULL,
    position     NUMBER          DEFAULT 0 NOT NULL,
    is_published NUMBER(1)       DEFAULT 0 NOT NULL,
    template_id  NUMBER,
    created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_pages          PRIMARY KEY (id),
    CONSTRAINT fk_pages_space    FOREIGN KEY (space_id)   REFERENCES spaces    (id) ON DELETE CASCADE,
    CONSTRAINT fk_pages_parent   FOREIGN KEY (parent_id)  REFERENCES pages     (id),
    CONSTRAINT fk_pages_author   FOREIGN KEY (author_id)  REFERENCES users     (id),
    CONSTRAINT fk_pages_template FOREIGN KEY (template_id) REFERENCES templates (id),
    CONSTRAINT ck_pages_published CHECK (is_published IN (0, 1))
);

CREATE INDEX ix_pages_id       ON pages (id);
CREATE INDEX ix_pages_title    ON pages (title);
CREATE INDEX ix_pages_space_id ON pages (space_id);

CREATE OR REPLACE TRIGGER trg_pages_id
    BEFORE INSERT ON pages
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_pages.NEXTVAL;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/


-- -----------------------------------------------------------------------------
-- PAGE_VERSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE page_versions (
    id             NUMBER          NOT NULL,
    page_id        NUMBER          NOT NULL,
    version_number NUMBER          NOT NULL,
    title          VARCHAR2(500)   NOT NULL,
    content        CLOB            NOT NULL,
    content_text   CLOB            DEFAULT '' NOT NULL,
    change_summary VARCHAR2(500)   DEFAULT '' NOT NULL,
    author_id      NUMBER          NOT NULL,
    created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_page_versions      PRIMARY KEY (id),
    CONSTRAINT fk_pv_page            FOREIGN KEY (page_id)   REFERENCES pages (id) ON DELETE CASCADE,
    CONSTRAINT fk_pv_author          FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX ix_page_versions_id      ON page_versions (id);
CREATE INDEX ix_page_versions_page_id ON page_versions (page_id);

CREATE OR REPLACE TRIGGER trg_page_versions_id
    BEFORE INSERT ON page_versions
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_page_versions.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE comments (
    id          NUMBER      NOT NULL,
    page_id     NUMBER      NOT NULL,
    author_id   NUMBER      NOT NULL,
    parent_id   NUMBER,
    content     CLOB        NOT NULL,
    is_resolved NUMBER(1)   DEFAULT 0 NOT NULL,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_comments         PRIMARY KEY (id),
    CONSTRAINT fk_comments_page    FOREIGN KEY (page_id)   REFERENCES pages    (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author  FOREIGN KEY (author_id) REFERENCES users    (id),
    CONSTRAINT fk_comments_parent  FOREIGN KEY (parent_id) REFERENCES comments (id),
    CONSTRAINT ck_comments_resolved CHECK (is_resolved IN (0, 1))
);

CREATE INDEX ix_comments_id      ON comments (id);
CREATE INDEX ix_comments_page_id ON comments (page_id);

CREATE OR REPLACE TRIGGER trg_comments_id
    BEFORE INSERT ON comments
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_comments.NEXTVAL;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/


-- -----------------------------------------------------------------------------
-- ATTACHMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE attachments (
    id                NUMBER          NOT NULL,
    page_id           NUMBER          NOT NULL,
    uploader_id       NUMBER          NOT NULL,
    filename          VARCHAR2(255)   NOT NULL,
    original_filename VARCHAR2(255)   NOT NULL,
    mime_type         VARCHAR2(100)   DEFAULT 'application/octet-stream' NOT NULL,
    file_size         NUMBER          DEFAULT 0 NOT NULL,
    storage_path      VARCHAR2(500)   NOT NULL,
    created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_attachments         PRIMARY KEY (id),
    CONSTRAINT fk_attach_page         FOREIGN KEY (page_id)     REFERENCES pages (id) ON DELETE CASCADE,
    CONSTRAINT fk_attach_uploader     FOREIGN KEY (uploader_id) REFERENCES users (id)
);

CREATE INDEX ix_attachments_id      ON attachments (id);
CREATE INDEX ix_attachments_page_id ON attachments (page_id);

CREATE OR REPLACE TRIGGER trg_attachments_id
    BEFORE INSERT ON attachments
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_attachments.NEXTVAL;
    END IF;
END;
/


-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE notifications (
    id           NUMBER        NOT NULL,
    recipient_id NUMBER        NOT NULL,
    actor_id     NUMBER        NOT NULL,
    page_id      NUMBER,
    type         VARCHAR2(50)  DEFAULT 'page_modified' NOT NULL,
    message      CLOB          NOT NULL,
    is_read      NUMBER(1)     DEFAULT 0 NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT pk_notifications        PRIMARY KEY (id),
    CONSTRAINT fk_notif_recipient      FOREIGN KEY (recipient_id) REFERENCES users (id),
    CONSTRAINT fk_notif_actor          FOREIGN KEY (actor_id)     REFERENCES users (id),
    CONSTRAINT fk_notif_page           FOREIGN KEY (page_id)      REFERENCES pages (id) ON DELETE CASCADE,
    CONSTRAINT ck_notifications_read   CHECK (is_read IN (0, 1))
);

CREATE INDEX ix_notifications_id           ON notifications (id);
CREATE INDEX ix_notifications_recipient_id ON notifications (recipient_id);

CREATE OR REPLACE TRIGGER trg_notifications_id
    BEFORE INSERT ON notifications
    FOR EACH ROW
BEGIN
    IF :NEW.id IS NULL THEN
        :NEW.id := seq_notifications.NEXTVAL;
    END IF;
END;
/


-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
