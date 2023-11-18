# We've Got Poems - Backend

## How to Run

### Ask for the `.env` file

This file is not included in the repository for security reasons.
Ask a member of the team for the file.

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
npm start
```

---

## Database Diagram

```mermaid
erDiagram
    USERS ||--|{ POEMS : creates
    USERS ||--o{ LIKES : gives
    USERS {
        int id PK
        string name
        string email UK
        string password
        timestamp created_at
        string eth_address UK
    }
    POEMS {
        int id PK
        int user_id FK "as author"
        text content
        timestamp created_at
        string title
    }
    LIKES {
        int id PK
        int user_id FK "given by"
        int poem_id FK "given to"
        timestamp created_at
        boolean is_like
    }
```
