# План реализации: Visual Database Schema Designer (SQL-Drawer)

## Обзор проекта

Визуальный редактор схем баз данных с функционалом drag-and-drop для создания таблиц, управления колонками и установки связей между таблицами.

### Технологический стек

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **UI**: Tailwind CSS v4, ShadCN UI
- **Canvas**: @xyflow/react (ReactFlow)
- **State**: Zustand с Immer middleware
- **Database**: SQLite с Prisma ORM
- **Data Types**: MySQL типы данных

## Фазы реализации

### Phase 1: Установка зависимостей и настройка инфраструктуры

**Действия:**

1. Установить основные зависимости:

   ```bash
   npm install zustand immer nanoid
   npm install -D prisma
   npm install @prisma/client
   ```

2. Установить ShadCN компоненты:

   ```bash
   npx shadcn@latest add button input label select checkbox switch
   npx shadcn@latest add card dialog dropdown-menu popover tooltip
   npx shadcn@latest add sidebar separator scroll-area badge
   npx shadcn@latest add context-menu alert-dialog
   ```

3. Инициализировать Prisma:
   ```bash
   npx prisma init --datasource-provider sqlite
   ```

### Phase 2: Проектирование и создание базы данных

**Файл: `prisma/schema.prisma`**

Создать 4 модели:

1. **Diagram** - диаграммы

   - id (String, @id, default: cuid())
   - name (String)
   - createdAt (DateTime)
   - updatedAt (DateTime)
   - tables (Table[])
   - relationships (Relationship[])

2. **Table** - таблицы

   - id (String, @id, default: cuid())
   - diagramId (String)
   - name (String)
   - positionX (Float)
   - positionY (Float)
   - columns (Column[])
   - sourceRelationships (Relationship[])
   - targetRelationships (Relationship[])

3. **Column** - колонки

   - id (String, @id, default: cuid())
   - tableId (String)
   - name (String)
   - dataType (String) - MySQL типы
   - nullable (Boolean)
   - indexType (String?) - PK, UK, Index, None
   - autoIncrement (Boolean)
   - unsigned (Boolean)
   - defaultValue (String?)
   - comment (String?)
   - order (Int)

4. **Relationship** - связи между таблицами
   - id (String, @id, default: cuid())
   - diagramId (String)
   - sourceTableId (String)
   - sourceColumnId (String)
   - targetTableId (String)
   - targetColumnId (String)
   - type (String) - "1:1", "1:N", "N:1"

**Cascade deletes**: При удалении диаграммы удаляются все таблицы, колонки и связи.

### Phase 3: TypeScript типы и константы

**Файл: `lib/types/database.ts`**

Определить:

- MySQL data types константы (bigInt, int, varchar, text, datetime, timestamp, boolean, decimal, json и т.д.)
- Index types: 'PK' | 'UK' | 'Index' | 'None'
- Relationship types: '1:1' | '1:N' | 'N:1'
- Column attributes интерфейс
- Table, Column, Relationship интерфейсы для frontend

### Phase 4: Zustand Store для управления состоянием

**Файл: `lib/stores/diagram-store.ts`**

Создать store с разделами:

1. **State**:

   - currentDiagram: Diagram | null
   - tables: Table[]
   - relationships: Relationship[]
   - selectedTableId: string | null
   - isCreatingTable: boolean
   - isSaving: boolean

2. **Actions**:
   - loadDiagram(id: string)
   - createTable(position: { x, y })
   - updateTable(id, updates)
   - deleteTable(id)
   - duplicateTable(id)
   - selectTable(id)
   - setCreatingTableMode(boolean)
   - addColumn(tableId)
   - updateColumn(columnId, updates)
   - deleteColumn(columnId)
   - reorderColumns(tableId, fromIndex, toIndex)
   - createRelationship(source, target, type)
   - updateRelationship(id, type)
   - deleteRelationship(id)
   - saveDiagram()

Использовать Immer middleware для immutable updates.

### Phase 5: API Routes

**Структура API:**

1. **`app/api/diagrams/route.ts`** (GET, POST)

   - GET: список всех диаграмм
   - POST: создать новую диаграмму

2. **`app/api/diagrams/[id]/route.ts`** (GET, DELETE)

   - GET: получить диаграмму с таблицами и связями
   - DELETE: удалить диаграмму

3. **`app/api/diagrams/[id]/save/route.ts`** (POST)
   - Сохранить все изменения диаграммы (транзакция Prisma)
   - Обновить/создать/удалить таблицы, колонки, связи

### Phase 6: Главная страница (список диаграмм)

**Файл: `app/page.tsx`**

Server Component:

- Загрузка списка диаграмм из БД
- Отображение в grid layout
- Кнопка "Create New Diagram"
- Карточки диаграмм с preview и действиями (open, duplicate, delete)

**Компоненты:**

- `components/home/diagram-list.tsx` (Client Component)
- `components/home/diagram-card.tsx`
- `components/home/create-diagram-dialog.tsx`

### Phase 7: Страница редактора диаграммы

**Файл: `app/diagrams/[id]/page.tsx`**

Server Component:

- Загрузка диаграммы по ID
- Инициализация Zustand store
- Layout: TopBar + Sidebar + Canvas

**Структура:**

```tsx
<div className="h-screen flex flex-col">
  <EditorTopBar />
  <div className="flex-1 flex">
    <TableSidebar />
    <FlowCanvas />
  </div>
</div>
```

### Phase 8: Top Bar компонент

**Файл: `components/editor/top-bar/editor-top-bar.tsx`**

Client Component с:

- Название диаграммы (editable)
- Кнопка Save (показывает статус сохранения)
- Кнопка Back to home
- Auto-save индикатор

### Phase 9: Sidebar с управлением таблицами

**Файл: `components/editor/sidebar/table-sidebar.tsx`**

Client Component с:

- Кнопка "Create Table" (активирует режим создания на canvas)
- Список таблиц (collapsed/expanded)
- При клике на таблицу - раскрывается редактор

**Подкомпоненты:**

- `table-list-item.tsx` - элемент списка с названием таблицы
- `table-editor.tsx` - редактор колонок таблицы
- `column-editor-row.tsx` - редактор одной колонки
- `column-attributes-popover.tsx` - popover с дополнительными атрибутами

**Редактор колонки (5 колонок):**

1. Input для названия колонки
2. Select для типа данных (MySQL types)
3. Checkbox для nullable
4. Select для index type (PK, UK, Index, None)
5. Button для атрибутов -> Popover с:
   - Checkbox: autoIncrement
   - Checkbox: unsigned
   - Input: default value
   - Textarea: comment
   - Button: Delete column

**Кнопки под редактором:**

- "Add Column"
- "Add Index" (опционально, можно в Phase 14)

### Phase 10: ReactFlow Canvas

**Файл: `components/editor/canvas/flow-canvas.tsx`**

Client Component с @xyflow/react:

- ReactFlow setup с custom nodeTypes и edgeTypes
- Background с dots pattern
- Controls (zoom, fit view)
- MiniMap (опционально)
- Click-to-create table mode
- Pan/zoom с мышью

**Обработчики:**

- `onNodesChange` - обновление позиций таблиц
- `onConnect` - создание связи между колонками
- `onPaneClick` - создание таблицы в режиме создания
- `onEdgeClick` - выбор связи для редактирования

### Phase 11: Custom ReactFlow Node - TableNode

**Файл: `components/editor/canvas/table-node.tsx`**

Custom node component:

- Заголовок с названием таблицы
- Список колонок
- На каждой колонке:
  - Handle слева (source) с id: `${tableId}-${columnId}-left`
  - Handle справа (target) с id: `${tableId}-${columnId}-right`
  - Иконка типа данных
  - Название колонки
  - Badges: PK, UK, Index, nullable

**Стилизация:**

- Card с border
- Header с фоном
- Hover эффекты
- Selected state (при выборе в sidebar)

### Phase 12: Custom ReactFlow Edge - RelationshipEdge

**Файл: `components/editor/canvas/relationship-edge.tsx`**

Custom edge component:

- Линия с animated path
- Badge с типом связи (1:1, 1:N, N:1)
- Click handler для открытия popover редактирования
- Context menu: Change type, Delete

**Компонент:**

- `relationship-type-popover.tsx` - выбор/изменение типа связи

### Phase 13: Логика сохранения

**Реализация в store:**

1. Debounced auto-save (1-2 секунды после изменений)
2. Manual save по кнопке
3. Save before navigation (предупреждение о несохраненных изменениях)

**API endpoint `/api/diagrams/[id]/save`:**

```typescript
// Prisma transaction:
await prisma.$transaction([
  // Update diagram
  // Upsert tables
  // Delete removed tables
  // Upsert columns
  // Delete removed columns
  // Upsert relationships
  // Delete removed relationships
]);
```

### Phase 14: Тестирование и полировка

1. **Тестирование функционала:**

   - Создание диаграммы
   - Создание таблиц (click-to-create)
   - Редактирование колонок
   - Создание связей (drag-and-drop)
   - Изменение типа связи
   - Удаление таблиц/колонок/связей
   - Дублирование таблиц
   - Сохранение диаграммы

2. **UI/UX улучшения:**

   - Keyboard shortcuts (Delete, Ctrl+S)
   - Undo/Redo (опционально)
   - Drag-to-select multiple nodes
   - Export to SQL (опционально)
   - Dark mode support

3. **Performance:**
   - Оптимизация ре-рендеров
   - Memoization для тяжелых компонентов
   - Виртуализация списка таблиц (если много)

## Структура директорий

```
sql-drawer/
├── app/
│   ├── page.tsx                          # Главная страница (список диаграмм)
│   ├── diagrams/
│   │   └── [id]/
│   │       └── page.tsx                  # Редактор диаграммы
│   ├── api/
│   │   └── diagrams/
│   │       ├── route.ts                  # GET, POST diagrams
│   │       └── [id]/
│   │           ├── route.ts              # GET, DELETE diagram
│   │           └── save/
│   │               └── route.ts          # POST save changes
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                               # ShadCN компоненты
│   ├── home/
│   │   ├── diagram-list.tsx
│   │   ├── diagram-card.tsx
│   │   └── create-diagram-dialog.tsx
│   └── editor/
│       ├── top-bar/
│       │   └── editor-top-bar.tsx
│       ├── sidebar/
│       │   ├── table-sidebar.tsx
│       │   ├── table-list-item.tsx
│       │   ├── table-editor.tsx
│       │   ├── column-editor-row.tsx
│       │   └── column-attributes-popover.tsx
│       └── canvas/
│           ├── flow-canvas.tsx
│           ├── table-node.tsx
│           ├── relationship-edge.tsx
│           └── relationship-type-popover.tsx
├── lib/
│   ├── db.ts                             # Prisma client singleton
│   ├── utils.ts                          # cn() utility (exists)
│   ├── types/
│   │   └── database.ts                   # TypeScript types
│   ├── constants/
│   │   └── mysql-types.ts                # MySQL data types
│   └── stores/
│       └── diagram-store.ts              # Zustand store
├── prisma/
│   └── schema.prisma                     # Database schema
├── components.json                        # ShadCN config (exists)
└── package.json
```

## Критически важные файлы для реализации

1. **`prisma/schema.prisma`** - Схема БД с 4 моделями
2. **`lib/stores/diagram-store.ts`** - Центральное управление состоянием
3. **`app/api/diagrams/[id]/save/route.ts`** - Endpoint сохранения
4. **`components/editor/canvas/flow-canvas.tsx`** - ReactFlow canvas
5. **`components/editor/canvas/table-node.tsx`** - Custom node с handles

## Порядок выполнения (пошагово)

### Шаг 1-2: Инфраструктура

- Установить все зависимости
- Настроить Prisma, создать schema
- Выполнить `npx prisma migrate dev --name init`
- Создать типы и константы

### Шаг 3-4: Backend

- Создать Prisma client singleton (`lib/db.ts`)
- Реализовать все API routes
- Протестировать API через Postman/curl

### Шаг 5-6: Zustand Store

- Создать store с actions
- Добавить Immer middleware
- Реализовать логику CRUD операций

### Шаг 7-8: Главная страница

- Установить нужные ShadCN компоненты
- Создать список диаграмм
- Реализовать создание новой диаграммы

### Шаг 9-10: Редактор - Layout

- Создать страницу редактора
- Реализовать TopBar
- Создать базовую структуру Sidebar

### Шаг 11-12: Sidebar - Управление таблицами

- Список таблиц (collapsed/expanded)
- Редактор колонок (5-column layout)
- Popover с атрибутами
- CRUD операции через store

### Шаг 13-14: ReactFlow Canvas

- Установить @xyflow/react
- Настроить ReactFlow с background/controls
- Реализовать click-to-create mode
- Синхронизация с store

### Шаг 15-16: Custom Nodes

- TableNode с заголовком и списком колонок
- Connection handles на каждой колонке
- Стилизация и hover эффекты
- Клик на таблицу -> выбор в sidebar

### Шаг 17-18: Relationships

- Обработка onConnect (drag-and-drop)
- Custom RelationshipEdge с типом связи
- Popover для редактирования типа
- Delete relationship

### Шаг 19-20: Сохранение

- Debounced auto-save в store
- Manual save button
- Транзакционное сохранение в API
- Индикатор статуса сохранения

### Шаг 21: Тестирование и полировка

- End-to-end тестирование всех функций
- UI/UX улучшения
- Обработка ошибок
- Loading states

## Ключевые технические решения

### State Management с Zustand

```typescript
// Centralized state с actions
// Immer для immutable updates
// Debounced auto-save
// Optimistic updates для UI responsiveness
```

### ReactFlow Integration

```typescript
// Custom nodeTypes: { table: TableNode }
// Custom edgeTypes: { relationship: RelationshipEdge }
// Connection validation (только между колонками)
// Handle IDs: `${tableId}-${columnId}-left/right`
```

### Database Transactions

```typescript
// Atomic saves с Prisma transactions
// Cascade deletes для data integrity
// Optimistic locking для concurrent edits (опционально)
```

### Type Safety

```typescript
// Prisma generated types
// Frontend types mirror database schema
// MySQL data type constants с literal types
// Zod validation для API routes (опционально)
```

## MySQL Data Types Support

Поддерживаемые типы:

- **Numeric**: TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT, DECIMAL, FLOAT, DOUBLE
- **String**: CHAR, VARCHAR, TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT
- **Date/Time**: DATE, TIME, DATETIME, TIMESTAMP, YEAR
- **Binary**: BINARY, VARBINARY, TINYBLOB, BLOB, MEDIUMBLOB, LONGBLOB
- **Other**: BOOLEAN, ENUM, SET, JSON

Каждый тип с соответствующими атрибутами (length, precision, scale).

## Приоритеты и фокус

1. **Фаза 1-8**: Основная функциональность (MUST HAVE)

   - CRUD диаграмм и таблиц
   - Редактор колонок
   - ReactFlow canvas
   - Базовые связи

2. **Фаза 9-13**: Полная функциональность (SHOULD HAVE)

   - Визуальные связи drag-and-drop
   - Редактирование типов связей
   - Auto-save
   - Дублирование таблиц

3. **Фаза 14+**: Улучшения (NICE TO HAVE)
   - Export to SQL
   - Undo/Redo
   - Keyboard shortcuts
   - Multi-select

## Оценка времени

- **Phases 1-4**: 1-2 дня (инфраструктура, БД, API)
- **Phases 5-8**: 1-2 дня (главная страница, layout редактора)
- **Phases 9-12**: 2-3 дня (sidebar, редактор таблиц)
- **Phases 13-18**: 2-3 дня (canvas, nodes, relationships)
- **Phases 19-21**: 1-2 дня (сохранение, тестирование)

**Итого**: 7-12 дней активной разработки

## Успешные критерии

✅ Создание и управление диаграммами
✅ Создание таблиц click-to-create на canvas
✅ Редактирование колонок (название, тип, nullable, index, атрибуты)
✅ Drag-and-drop связи между колонками таблиц
✅ Выбор типа связи (1:1, 1:N, N:1)
✅ Auto-save диаграмм
✅ Pan/zoom canvas
✅ Дублирование/удаление таблиц
✅ Persistence в SQLite через Prisma
✅ Type-safe TypeScript throughout
