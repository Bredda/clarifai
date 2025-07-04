```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

```

- Documentation interactive à : http://127.0.0.1:8000/docs
- Endpoint de santé : http://127.0.0.1:8000/health
