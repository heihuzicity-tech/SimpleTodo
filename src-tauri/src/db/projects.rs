// 项目相关数据库操作
use super::{with_connection, DbError};
use crate::commands::projects::Project;
use chrono::Utc;
use rusqlite::Connection;
use tauri::AppHandle;
use uuid::Uuid;

/// 获取所有项目
pub fn get_all_projects(app_handle: &AppHandle) -> Result<Vec<Project>, DbError> {
    with_connection(app_handle, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at FROM projects ORDER BY created_at DESC"
        )?;

        let projects_iter = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        let projects: Vec<Project> = projects_iter.filter_map(|p| p.ok()).collect();
        Ok(projects)
    })
}

/// 创建项目
pub fn create_project(app_handle: &AppHandle, project: &Project) -> Result<Project, DbError> {
    let p = project.clone();
    with_connection(app_handle, |conn| {
        create_project_impl(conn, &p)
    })
}

fn create_project_impl(conn: &Connection, project: &Project) -> Result<Project, DbError> {
    let now = Utc::now().to_rfc3339();
    let id = if project.id.is_empty() { Uuid::new_v4().to_string() } else { project.id.clone() };

    conn.execute(
        "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        rusqlite::params![id, project.name, project.description, now, now],
    )?;

    // 为新项目创建默认列
    create_default_columns(conn, &id, &now)?;

    Ok(Project {
        id,
        name: project.name.clone(),
        description: project.description.clone(),
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 创建默认列
fn create_default_columns(conn: &Connection, project_id: &str, now: &str) -> Result<(), DbError> {
    let default_columns = [
        ("待办", 0, "#f8fafc"),
        ("进行中", 1, "#eff6ff"),
        ("已完成", 2, "#f0fdf4"),
    ];

    for (title, position, color) in default_columns {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO columns (id, project_id, title, position, background_color, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![id, project_id, title, position, color, now, now],
        )?;
    }

    Ok(())
}

/// 更新项目
pub fn update_project(app_handle: &AppHandle, project: &Project) -> Result<Project, DbError> {
    let p = project.clone();
    with_connection(app_handle, |conn| {
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![p.name, p.description, now, p.id],
        )?;

        Ok(Project {
            id: p.id.clone(),
            name: p.name.clone(),
            description: p.description.clone(),
            created_at: p.created_at.clone(),
            updated_at: now,
        })
    })
}

/// 删除项目
pub fn delete_project(app_handle: &AppHandle, project_id: &str) -> Result<(), DbError> {
    let pid = project_id.to_string();
    with_connection(app_handle, |conn| {
        // 级联删除会自动删除相关的列和卡片
        conn.execute("DELETE FROM projects WHERE id = ?", [&pid])?;

        // 如果删除的是当前项目，清除设置
        let current = get_current_project_impl(conn)?;
        if current.as_deref() == Some(&pid) {
            conn.execute("DELETE FROM settings WHERE key = 'current_project_id'", [])?;
        }

        Ok(())
    })
}

/// 获取当前项目ID
pub fn get_current_project(app_handle: &AppHandle) -> Result<Option<String>, DbError> {
    with_connection(app_handle, |conn| {
        get_current_project_impl(conn)
    })
}

fn get_current_project_impl(conn: &Connection) -> Result<Option<String>, DbError> {
    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = 'current_project_id'",
        [],
        |row| row.get(0),
    );

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DbError::from(e)),
    }
}

/// 设置当前项目
pub fn set_current_project(app_handle: &AppHandle, project_id: &str) -> Result<(), DbError> {
    let pid = project_id.to_string();
    with_connection(app_handle, |conn| {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('current_project_id', ?)",
            [&pid],
        )?;
        Ok(())
    })
}
