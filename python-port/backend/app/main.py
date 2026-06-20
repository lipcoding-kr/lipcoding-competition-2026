from fastapi import FastAPI

app = FastAPI(title="Lipcoding Productivity API")


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/message")
def message() -> dict[str, str]:
    return {
        "title": "Docker proxy service is running",
        "message": "Frontend and FastAPI backend are connected through Nginx.",
    }
