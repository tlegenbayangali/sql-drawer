# SQL Import Guide

## Обзор

Функция импорта SQL позволяет загружать готовые схемы баз данных из MySQL дампов или CREATE TABLE выражений напрямую в диаграмму.

## Как использовать

### 1. Откройте диаграмму

Перейдите в редактор диаграммы, нажав на существующую диаграмму или создав новую.

### 2. Нажмите "Import SQL"

В верхней панели редактора найдите кнопку **"Import SQL"** рядом с кнопкой "Save".

### 3. Загрузите SQL

Есть два способа импорта:

- **Загрузить файл**: Выберите `.sql` файл с вашего компьютера
- **Вставить SQL**: Скопируйте и вставьте CREATE TABLE выражения в текстовое поле

### 4. Парсинг

Нажмите **"Parse SQL"**. Парсер автоматически:
- Извлечет все таблицы и колонки
- Определит PRIMARY KEY, UNIQUE, INDEX
- Найдет FOREIGN KEY связи
- Автоматически определит неявные связи по именам (например, `user_id` → `users.id`)

### 5. Предпросмотр

Вы увидите:
- Количество найденных таблиц и связей
- Список таблиц с количеством колонок
- Предупреждения (если есть)

### 6. Импорт

Нажмите **"Import"** для добавления таблиц в текущую диаграмму.

## Поддерживаемые возможности

### ✅ Поддерживается

- **CREATE TABLE** statements
- **ALTER TABLE ADD FOREIGN KEY**
- 26 типов данных MySQL:
  - Числовые: TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT, DECIMAL, FLOAT, DOUBLE
  - Строковые: CHAR, VARCHAR, TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT
  - Даты: DATE, TIME, DATETIME, TIMESTAMP, YEAR
  - Бинарные: BINARY, VARBINARY, TINYBLOB, BLOB, MEDIUMBLOB, LONGBLOB
  - Другие: BOOLEAN, ENUM, SET, JSON, UUID
- Атрибуты колонок:
  - NOT NULL / NULL
  - AUTO_INCREMENT
  - UNSIGNED
  - DEFAULT значения
  - COMMENT
- Индексы:
  - PRIMARY KEY
  - UNIQUE KEY
  - KEY / INDEX
  - FOREIGN KEY
- **Неявные связи** по паттернам имен:
  - `user_id` → `users.id`
  - `category_id` → `categories.id`
  - Автоматическое определение единственного/множественного числа

### ❌ Игнорируется (без предупреждений)

Эти команды пропускаются автоматически, так как они не относятся к структуре схемы:

- SET команды (SQL_MODE, time_zone и т.д.)
- INSERT, UPDATE, DELETE
- TRANSACTION команды (START TRANSACTION, COMMIT, ROLLBACK)
- LOCK/UNLOCK TABLES
- CREATE VIEW, PROCEDURE, FUNCTION, TRIGGER
- GRANT/REVOKE
- USE database
- Комментарии

### ⚠️ Частичная поддержка

- **ENUM типы**: Парсятся как ENUM, но список значений не сохраняется
- **Составные PRIMARY/FOREIGN KEY**: Только первая колонка будет помечена
- **ON DELETE/UPDATE cascades**: Парсятся, но действия не сохраняются

## Определение типов связей

Парсер автоматически определяет тип связи:

| Source Column | Target Column | Тип связи |
|---------------|---------------|-----------|
| PK или UNIQUE | PK или UNIQUE | **1:1** |
| PK или UNIQUE | Обычная | **N:1** |
| Обычная | PK или UNIQUE | **1:N** |
| Обычная | Обычная | **1:N** (по умолчанию) |

## Автоматическое расположение

Импортированные таблицы автоматически размещаются:
- Справа от существующих таблиц (если есть)
- В виде сетки для удобства
- С отступами 100px между таблицами

## Обработка конфликтов

Если таблица с таким именем уже существует:
- Автоматически добавляется суффикс `_1`, `_2` и т.д.
- Вы увидите предупреждение в preview

## Примеры

### Пример 1: Простая таблица

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (email)
);
```

**Результат**: 1 таблица с 4 колонками, `id` помечен как PK, `email` как UNIQUE.

### Пример 2: Явная связь

```sql
CREATE TABLE posts (
  id BIGINT UNSIGNED AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Результат**: 1 таблица с явной связью `posts.user_id` → `users.id` (тип 1:N).

### Пример 3: Неявная связь

```sql
CREATE TABLE comments (
  id BIGINT UNSIGNED AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  content TEXT,
  PRIMARY KEY (id)
);
```

**Результат**: 1 таблица с автоматически определенной связью `comments.post_id` → `posts.id` (тип 1:N).

### Пример 4: Полный MySQL дамп

```sql
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

CREATE TABLE categories (
  id INT AUTO_INCREMENT,
  name VARCHAR(100),
  PRIMARY KEY (id)
);

INSERT INTO categories VALUES (1, 'Technology'), (2, 'Sports');

COMMIT;
```

**Результат**: 1 таблица `categories`. SET, INSERT, TRANSACTION команды пропускаются без предупреждений.

## Советы

1. **Используйте полные дампы**: Можно импортировать полный mysqldump - парсер автоматически извлечет только схему
2. **Проверьте preview**: Всегда проверяйте количество найденных таблиц и связей перед импортом
3. **Пустая диаграмма**: Для лучших результатов импортируйте в пустую диаграмму
4. **Несколько файлов**: Можно импортировать несколько раз - таблицы добавятся к существующим

## Ограничения

- Максимальный размер файла: 5 MB
- Только MySQL синтаксис (PostgreSQL, SQLite не поддерживаются)
- Составные ключи: Обрабатывается только первая колонка
- Вычисляемые колонки: Парсятся как обычные

## Troubleshooting

### "No tables found in SQL file"

- Проверьте, что файл содержит CREATE TABLE выражения
- Убедитесь, что используется MySQL синтаксис

### "SQL parsing failed with errors"

- Проверьте синтаксис SQL
- Убедитесь, что нет незакрытых скобок или кавычек
- Посмотрите детали ошибок в списке

### Неправильные типы связей

- Типы связей определяются автоматически на основе индексов
- Вы можете вручную изменить тип после импорта в UI

### Отсутствуют некоторые связи

- FOREIGN KEY должны быть явно указаны в SQL
- Для неявных связей используется паттерн `*_id` → `*.id`
- Проверьте, что целевая таблица имеет колонку `id`
