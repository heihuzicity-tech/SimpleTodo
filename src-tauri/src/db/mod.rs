// 数据库模块
// 使用 SQLite 进行数据持久化

pub mod kanban;
pub mod projects;
mod schema;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use thiserror::Error;

/// 数据库错误类型
#[derive(Error, Debug)]
pub enum DbError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("Database not initialized")]
    NotInitialized,
    #[error("Lock poisoned")]
    LockPoisoned,
    #[error("Item not found: {0}")]
    #[allow(dead_code)]
    NotFound(String),
}

/// 数据库连接状态
pub struct DbState {
    pub conn: Mutex<Connection>,
}

/// 初始化数据库
pub fn init_database(app_handle: &AppHandle) -> Result<(), DbError> {
    // 获取应用数据目录
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| DbError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Could not get app data directory",
        )))?;

    // 确保目录存在
    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("zetodo.db");
    log::info!("Database path: {:?}", db_path);

    // 打开或创建数据库
    let conn = Connection::open(&db_path)?;

    // 执行数据库迁移
    schema::run_migrations(&conn)?;

    // 将连接存储到应用状态
    app_handle.manage(DbState {
        conn: Mutex::new(conn),
    });

    Ok(())
}

/// 使用数据库连接执行操作
pub fn with_connection<F, T>(app_handle: &AppHandle, f: F) -> Result<T, DbError>
where
    F: FnOnce(&Connection) -> Result<T, DbError>,
{
    let state = app_handle
        .try_state::<DbState>()
        .ok_or(DbError::NotInitialized)?;

    let conn = state.conn.lock().map_err(|_| DbError::LockPoisoned)?;
    f(&conn)
}
