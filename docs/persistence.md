# Persistence (SQLite)

IndoApp stores player state in a **SQLite** database loaded via Tauri’s SQL plugin. The file lives in the app data directory with logical name `sqlite:indo.db` (resolved by `@tauri-apps/plugin-sql`).

## Tables

### `profile`

Single row (`id = 1`): economy and progression.

| Column           | Type    | Description                                      |
| ---------------- | ------- | ------------------------------------------------ |
| `id`             | INTEGER | Always `1`                                     |
| `currency`       | INTEGER | Soft currency (Kosa)                             |
| `xp`             | INTEGER | Total XP                                       |
| `user_level`     | INTEGER | Derived rank level (1-based)                     |
| `shards`         | INTEGER | Gacha duplicate consolation currency             |
| `streak`         | INTEGER | Consecutive-day streak counter                   |
| `last_streak_ymd`| TEXT    | ISO date (`YYYY-MM-DD`) of last play for streak |

### `purchased_skill_nodes`

Skill tree nodes the player has bought.

| Column   | Type | Description   |
| -------- | ---- | ------------- |
| `node_id`| TEXT | Primary key   |

### `level_runs`

Per-level completion stats (stars, accuracy).

| Column        | Type    | Description                          |
| ------------- | ------- | ------------------------------------ |
| `level_id`    | TEXT    | Primary key                          |
| `stars`       | INTEGER | 0–3                                  |
| `accuracy`    | REAL    | Last run accuracy (correct/total)   |
| `completed`   | INTEGER | 0/1                                  |

### `owned_cosmetics`

Cosmetic ids from gacha or future grants.

| Column        | Type | Description |
| ------------- | ---- | ----------- |
| `cosmetic_id` | TEXT | Primary key |

### `equipped_cosmetics`

At most one row per slot.

| Column        | Type | Description                                      |
| ------------- | ---- | ------------------------------------------------ |
| `slot`        | TEXT | `hat` \| `clothes` \| `shoes` \| `background`   |
| `cosmetic_id` | TEXT | Equipped id (nullable semantics: empty = none)  |

### `gacha_pity`

Per pool pity / counters.

| Column         | Type    | Description                    |
| -------------- | ------- | ------------------------------ |
| `pool_id`      | TEXT    | Primary key                    |
| `pulls_since`  | INTEGER | Pulls since last rare+ (MVP)  |
| `hard_pity`    | INTEGER | Pulls toward guaranteed rare   |

### `settings`

Key/value strings for app preferences.

| Column | Type | Description |
| ------ | ---- | ----------- |
| `key`  | TEXT | Primary key |
| `value`| TEXT | JSON or plain string |

## Porting (Unity / Godot)

Reimplement the same **table and column names** and semantics so saves can be copied or migrated. Content remains in `content/` JSON; this file only documents the **player save** shape.
