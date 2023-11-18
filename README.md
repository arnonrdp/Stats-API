# Stats API

Statistics from Celebrity Fanalyzer entries

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
    STATS {
        int id PK
        timestamp created_at
        string user_id
        string post_id
        int clicks
        int keypresses
        int mousemovements
        int scrolls
        int totaltime
    }
```
