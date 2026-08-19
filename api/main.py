from fastapi import FastAPI
from src.services.sample_drop_service import SampleDropService
app=FastAPI(title='Sample Drop Optimization'); service=SampleDropService()
@app.get('/health')
def health(): return {'status':'ok'}
@app.get('/medicines')
def medicines(): return service.meds.to_dict('records')
@app.post('/sample-drop/run')
def run(req:dict): return service.run(req)
