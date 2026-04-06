# SOC Log Analyzer - Fix Issues & LLM Connection TODO

**Status: Started (0/8 completed)**

1. ✅ **Plan approved by user**
2. 📝 Create TODO.md (this file)
3. ✅ Fix anomaly serialization (verified & formatted log_routes.py)
4. ✅ Improve LLM error handling & JSON reliability in summarizer.py
5. ✅ Enhance log parser robustness in parser.py
6. ✅ Improve anomaly detector configurability & ORM safety in detector.py
7. ✅ Add logging setup & middleware in main.py
8. ✅ Fixed OpenAI import error (v1.2+ response_format dict direct), backend issues resolved, LLM connected robustly.
   - Commands:
     - `cd backend && python seed_user.py` (admin/admin123)
     - `cd backend && python -m uvicorn app.main:app --reload`
     - Add OPENAI_API_KEY=sk-... to backend/.env
     - Test upload, GET http://localhost:8000/logs/1/results → LLM ai_summary
9. ✅ Task complete
